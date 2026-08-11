import {
  isUsageFeatureCode,
  Role,
  hasMinRole,
  type UsageFeatureCode,
  type UsageLimitCheckResult,
  type UsagePlanTier,
} from '@machinefit/shared';
import { usageRepository } from '../repositories/usage.repository.js';
import { usagePolicyRepository } from '../repositories/usage-policy.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { billingService } from './billing.service.js';
import { decideUsageLimit } from './usage-limit-decision.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middlewares/error.middleware.js';

/** Codes that must not lock users out even if a policy is enforced. */
const USAGE_GATE_EXCLUDED = new Set(['login']);

export async function assertUsageAllowed(userId: string, featureCode: string): Promise<void> {
  await usageService.assertUsageAllowed(userId, featureCode);
}

/** Fire-and-forget usage increment. Never throws to callers. */
export function trackUsageSafe(
  userId: string | null | undefined,
  featureCode: string,
  amount = 1
): void {
  if (!userId || amount <= 0) return;
  void usageService.recordUsage(userId, featureCode, amount).catch((err) => {
    logger.warn('usage.record failed', { err, userId, featureCode });
  });
}

export const usageService = {
  async recordUsage(userId: string, featureCode: string, amount = 1): Promise<void> {
    if (!userId || !featureCode || amount <= 0) return;
    const code = featureCode.slice(0, 80);
    if (!USAGE_GATE_EXCLUDED.has(code)) {
      const policy = await usagePolicyRepository.findByCode(code);
      // When enforcement is on, assertUsageAllowed already consumed the quota atomically.
      if (policy?.limitsEnforced && policy.isActive) return;
    }
    await usageRepository.incrementUsage(userId, code, Math.min(amount, 100));
  },

  async recordEvents(
    userId: string,
    events: Array<{ featureCode: UsageFeatureCode; amount?: number }>
  ): Promise<{ accepted: number }> {
    let accepted = 0;
    for (const event of events) {
      if (!isUsageFeatureCode(event.featureCode)) continue;
      await this.recordUsage(userId, event.featureCode, event.amount ?? 1);
      accepted += 1;
    }
    return { accepted };
  },

  async resolvePlanTier(userId: string): Promise<UsagePlanTier> {
    const user = await userRepository.findById(userId);
    if (!user) return 'FREE';
    if (hasMinRole(user.roleCode, Role.ADMIN)) return 'ADMIN';
    const premium = await billingService.userHasPremiumEntitlement(userId, user.roleCode);
    return premium ? 'PREMIUM' : 'FREE';
  },

  /**
   * Policy check. Seeds keep limitsEnforced=false so this allows until ops
   * turns enforcement ON and sets numeric limits.
   */
  async checkUsageLimit(
    userId: string,
    featureCode: string
  ): Promise<UsageLimitCheckResult> {
    const planTier = await this.resolvePlanTier(userId);
    const policy = await usagePolicyRepository.findByCode(featureCode);
    const dailyUsage = await usageRepository.getFeatureCount(userId, featureCode, 'daily');
    const monthlyUsage = await usageRepository.getFeatureCount(userId, featureCode, 'monthly');

    if (!policy) {
      return {
        allowed: true,
        featureCode,
        planTier,
        currentUsage: dailyUsage,
        dailyLimit: null,
        monthlyUsage,
        monthlyLimit: null,
        remainingDaily: null,
        remainingMonthly: null,
        reason: 'FEATURE_DISABLED',
        limitsEnforced: false,
      };
    }

    const decision = decideUsageLimit({
      planTier,
      limitsEnforced: policy.limitsEnforced,
      isActive: policy.isActive,
      freeAllowed: policy.freeAllowed,
      premiumAllowed: policy.premiumAllowed,
      freeDailyLimit: policy.freeDailyLimit,
      freeMonthlyLimit: policy.freeMonthlyLimit,
      premiumDailyLimit: policy.premiumDailyLimit,
      premiumMonthlyLimit: policy.premiumMonthlyLimit,
      dailyUsage,
      monthlyUsage,
    });

    const isPremiumLike = planTier === 'PREMIUM' || planTier === 'ADMIN';
    const dailyLimit = isPremiumLike ? policy.premiumDailyLimit : policy.freeDailyLimit;
    const monthlyLimit = isPremiumLike ? policy.premiumMonthlyLimit : policy.freeMonthlyLimit;

    return {
      allowed: decision.allowed,
      featureCode,
      planTier,
      currentUsage: dailyUsage,
      dailyLimit,
      monthlyUsage,
      monthlyLimit,
      remainingDaily: decision.remainingDaily,
      remainingMonthly: decision.remainingMonthly,
      reason: decision.reason,
      limitsEnforced: policy.limitsEnforced,
    };
  },

  /**
   * Block a mutating feature when admin enforcement is on and the user is over quota.
   * No-op while limitsEnforced=false (current production seed).
   */
  async assertUsageAllowed(userId: string, featureCode: string): Promise<void> {
    if (!userId || USAGE_GATE_EXCLUDED.has(featureCode)) return;
    const result = await this.checkUsageLimit(userId, featureCode);
    if (!result.allowed) {
      throw new AppError(402, 'USAGE_LIMIT', 'Usage limit exceeded', {
        featureCode: result.featureCode,
        reason: result.reason,
        remainingDaily: result.remainingDaily,
        remainingMonthly: result.remainingMonthly,
        planTier: result.planTier,
      });
    }
    if (!result.limitsEnforced || result.planTier === 'ADMIN') return;
    const consumed = await usageRepository.consumeIfUnderLimit({
      userId,
      featureCode,
      dailyLimit: result.dailyLimit,
      monthlyLimit: result.monthlyLimit,
    });
    if (consumed.ok) return;
    throw new AppError(402, 'USAGE_LIMIT', 'Usage limit exceeded', {
      featureCode: result.featureCode,
      reason: consumed.reason,
      remainingDaily: consumed.reason === 'DAILY_LIMIT_EXCEEDED' ? 0 : result.remainingDaily,
      remainingMonthly: consumed.reason === 'MONTHLY_LIMIT_EXCEEDED' ? 0 : result.remainingMonthly,
      planTier: result.planTier,
    });
  },
};
