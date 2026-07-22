/** Plan / multi-gym / member limits — change here only. */
export const SUBSCRIPTION_PLANS = ['free', 'premium'] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export const PLAN_LIMITS = {
  free: {
    maxGyms: 2,
    maxMembersPerGym: 2,
  },
  premium: {
    maxGyms: 10,
    maxMembersPerGym: 10,
  },
} as const;

export const DEFAULT_SUBSCRIPTION_PLAN: SubscriptionPlan = 'free';

/** Highest commercial tier — used for admin effective limits. */
export const MAX_SUBSCRIPTION_PLAN: SubscriptionPlan = 'premium';

/** Sentinel for aggregate “All Gyms” views (never stored as user_gyms.id). */
export const ALL_GYMS_ID = 'all' as const;
export type GymScopeId = typeof ALL_GYMS_ID | (string & {});

export function isAllGymsId(gymId: string | null | undefined): gymId is typeof ALL_GYMS_ID {
  return gymId === ALL_GYMS_ID;
}

export function isSubscriptionPlan(value: unknown): value is SubscriptionPlan {
  return typeof value === 'string' && (SUBSCRIPTION_PLANS as readonly string[]).includes(value);
}

export function getPlanLimits(plan: SubscriptionPlan = DEFAULT_SUBSCRIPTION_PLAN) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

/**
 * Effective commercial plan for limit checks.
 * Admin accounts always use the max (premium) tier regardless of subscription_plan.
 */
export function getEffectiveSubscriptionPlan(
  plan: SubscriptionPlan | string | null | undefined,
  roleCode?: string | null,
): SubscriptionPlan {
  if (roleCode === 'admin') return MAX_SUBSCRIPTION_PLAN;
  return isSubscriptionPlan(plan) ? plan : DEFAULT_SUBSCRIPTION_PLAN;
}

export function getEffectivePlanLimits(
  plan: SubscriptionPlan | string | null | undefined,
  roleCode?: string | null,
) {
  return getPlanLimits(getEffectiveSubscriptionPlan(plan, roleCode));
}
