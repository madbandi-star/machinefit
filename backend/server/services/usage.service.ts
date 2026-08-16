import {
  getFreePlanLimits,
  isUsageFeatureCode,
  Role,
  hasMinRole,
  type UsageFeatureCode,
  type UsageLimitCheckResult,
  type UsagePlanTier,
} from '@machinefit/shared';
import { usageRepository } from '../repositories/usage.repository.js';
import { usagePolicyRepository } from '../repositories/usage-policy.repository.js';
import { workoutCardRepository } from '../repositories/workout-card.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { billingService } from './billing.service.js';
import { decideUsageLimit } from './usage-limit-decision.js';
import { recordAbuseSafe } from './abuse.service.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middlewares/error.middleware.js';

/** Codes that must not lock users out even if a policy is enforced. */
const USAGE_GATE_EXCLUDED = new Set(['login']);

function seoulResetAtIso(at = new Date()): string {
  // Next Seoul midnight approx: usage keys use Asia/Seoul date; reset message for UX.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const today = fmt.format(at); // YYYY-MM-DD
  // 15:00 UTC = 00:00 KST next day boundary depends on DST-less KST (UTC+9)
  const [y, m, d] = today.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1, 15, 0, 0));
  return next.toISOString();
}

function throwQuotaExceeded(
  result: UsageLimitCheckResult,
  code:
    | 'USAGE_LIMIT'
    | 'DAILY_QUOTA_EXCEEDED'
    | 'MONTHLY_QUOTA_EXCEEDED'
    | 'STOCK_LIMIT_EXCEEDED' = 'USAGE_LIMIT',
  message = 'Usage limit exceeded'
): never {
  throw new AppError(429, code, message, {
    featureCode: result.featureCode,
    reason: result.reason,
    used: result.currentUsage,
    limit: result.dailyLimit,
    remainingDaily: result.remainingDaily,
    remainingMonthly: result.remainingMonthly,
    planTier: result.planTier,
    resetAt: seoulResetAtIso(),
  });
}

export async function assertUsageAllowed(userId: string, featureCode: string): Promise<void> {
  await usageService.assertUsageAllowed(userId, featureCode);
}

export async function assertStockAllowed(
  userId: string,
  featureCode: 'exercise_card_create' | 'template_create'
): Promise<void> {
  await usageService.assertStockAllowed(userId, featureCode);
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
   * Policy check. Abuse-critical features are seeded limitsEnforced=true (migration 138).
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

  /** Concurrent ownership cap (cards / templates). Does not consume daily quota. */
  async assertStockAllowed(
    userId: string,
    featureCode: 'exercise_card_create' | 'template_create'
  ): Promise<void> {
    if (!userId) return;
    const planTier = await this.resolvePlanTier(userId);
    if (planTier === 'ADMIN') return;

    const policy = await usagePolicyRepository.findByCode(featureCode);
    if (!policy?.limitsEnforced || !policy.isActive) return;

    const defaults = getFreePlanLimits();
    const isPremium = planTier === 'PREMIUM';
    let stockLimit =
      (isPremium ? policy.premiumStockLimit : policy.freeStockLimit) ??
      (isPremium
        ? featureCode === 'exercise_card_create'
          ? defaults.premiumMaxEquipmentCards
          : defaults.premiumMaxTemplates
        : featureCode === 'exercise_card_create'
          ? defaults.maxEquipmentCards
          : defaults.maxTemplates);

    if (stockLimit == null) return;

    const owned =
      featureCode === 'exercise_card_create'
        ? await workoutCardRepository.countOwnedCards(userId)
        : await workoutCardRepository.countOwnedTemplates(userId);

    if (owned >= stockLimit) {
      recordAbuseSafe({
        userId,
        eventType:
          featureCode === 'exercise_card_create'
            ? 'EQUIPMENT_CARD_LIMIT_EXCEEDED'
            : 'STOCK_LIMIT_EXCEEDED',
        severity: 'MEDIUM',
        metadata: { featureCode, owned, limit: stockLimit },
      });
      throw new AppError(429, 'STOCK_LIMIT_EXCEEDED', 'Stock limit exceeded', {
        featureCode,
        reason: 'STOCK_LIMIT_EXCEEDED',
        used: owned,
        limit: stockLimit,
        planTier,
      });
    }
  },

  /**
   * Block a mutating feature when admin enforcement is on and the user is over quota.
   * Atomic consume under advisory lock when allowed.
   */
  async assertUsageAllowed(userId: string, featureCode: string): Promise<void> {
    if (!userId || USAGE_GATE_EXCLUDED.has(featureCode)) return;
    const result = await this.checkUsageLimit(userId, featureCode);
    if (!result.allowed) {
      const eventType =
        result.reason === 'MONTHLY_LIMIT_EXCEEDED'
          ? 'MONTHLY_QUOTA_EXCEEDED'
          : featureCode === 'recommendation'
            ? 'RECOMMENDATION_LIMIT_EXCEEDED'
            : 'DAILY_QUOTA_EXCEEDED';
      recordAbuseSafe({
        userId,
        eventType,
        severity: 'MEDIUM',
        metadata: {
          featureCode: result.featureCode,
          reason: result.reason,
          used: result.currentUsage,
          limit: result.dailyLimit,
        },
      });
      throwQuotaExceeded(
        result,
        result.reason === 'MONTHLY_LIMIT_EXCEEDED' ? 'MONTHLY_QUOTA_EXCEEDED' : 'DAILY_QUOTA_EXCEEDED'
      );
    }
    if (!result.limitsEnforced || result.planTier === 'ADMIN') return;
    const consumed = await usageRepository.consumeIfUnderLimit({
      userId,
      featureCode,
      dailyLimit: result.dailyLimit,
      monthlyLimit: result.monthlyLimit,
    });
    if (consumed.ok) return;
    recordAbuseSafe({
      userId,
      eventType:
        consumed.reason === 'MONTHLY_LIMIT_EXCEEDED'
          ? 'MONTHLY_QUOTA_EXCEEDED'
          : 'DAILY_QUOTA_EXCEEDED',
      severity: 'MEDIUM',
      metadata: { featureCode, reason: consumed.reason },
    });
    throw new AppError(429, 'DAILY_QUOTA_EXCEEDED', 'Usage limit exceeded', {
      featureCode: result.featureCode,
      reason: consumed.reason,
      remainingDaily: consumed.reason === 'DAILY_LIMIT_EXCEEDED' ? 0 : result.remainingDaily,
      remainingMonthly: consumed.reason === 'MONTHLY_LIMIT_EXCEEDED' ? 0 : result.remainingMonthly,
      planTier: result.planTier,
      resetAt: seoulResetAtIso(),
    });
  },
};
