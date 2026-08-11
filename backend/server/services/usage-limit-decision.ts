/**
 * Pure decision helper for usage limit enforcement (unit-tested without DB).
 * Mirrors usageService.checkUsageLimit branching when limitsEnforced is considered.
 */
export type LimitDecisionInput = {
  planTier: 'FREE' | 'PREMIUM' | 'ADMIN';
  limitsEnforced: boolean;
  isActive: boolean;
  freeAllowed: boolean;
  premiumAllowed: boolean;
  freeDailyLimit: number | null;
  freeMonthlyLimit: number | null;
  premiumDailyLimit: number | null;
  premiumMonthlyLimit: number | null;
  dailyUsage: number;
  monthlyUsage: number;
};

export type LimitDecision = {
  allowed: boolean;
  reason:
    | 'ALLOWED'
    | 'FEATURE_DISABLED'
    | 'PLAN_NOT_ALLOWED'
    | 'DAILY_LIMIT_EXCEEDED'
    | 'MONTHLY_LIMIT_EXCEEDED'
    | 'LIMITS_NOT_ENFORCED';
  remainingDaily: number | null;
  remainingMonthly: number | null;
};

export function decideUsageLimit(input: LimitDecisionInput): LimitDecision {
  const isPremiumLike = input.planTier === 'PREMIUM' || input.planTier === 'ADMIN';
  const dailyLimit = isPremiumLike ? input.premiumDailyLimit : input.freeDailyLimit;
  const monthlyLimit = isPremiumLike ? input.premiumMonthlyLimit : input.freeMonthlyLimit;
  const remainingDaily =
    dailyLimit == null ? null : Math.max(0, dailyLimit - input.dailyUsage);
  const remainingMonthly =
    monthlyLimit == null ? null : Math.max(0, monthlyLimit - input.monthlyUsage);

  if (!input.isActive) {
    return {
      allowed: true,
      reason: 'FEATURE_DISABLED',
      remainingDaily,
      remainingMonthly,
    };
  }

  if (input.planTier === 'ADMIN' || !input.limitsEnforced) {
    return {
      allowed: true,
      reason: 'LIMITS_NOT_ENFORCED',
      remainingDaily,
      remainingMonthly,
    };
  }

  const allowedByPlan = isPremiumLike ? input.premiumAllowed : input.freeAllowed;
  if (!allowedByPlan) {
    return {
      allowed: false,
      reason: 'PLAN_NOT_ALLOWED',
      remainingDaily,
      remainingMonthly,
    };
  }
  if (dailyLimit != null && input.dailyUsage >= dailyLimit) {
    return {
      allowed: false,
      reason: 'DAILY_LIMIT_EXCEEDED',
      remainingDaily: 0,
      remainingMonthly,
    };
  }
  if (monthlyLimit != null && input.monthlyUsage >= monthlyLimit) {
    return {
      allowed: false,
      reason: 'MONTHLY_LIMIT_EXCEEDED',
      remainingDaily,
      remainingMonthly: 0,
    };
  }
  return {
    allowed: true,
    reason: 'ALLOWED',
    remainingDaily,
    remainingMonthly,
  };
}
