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

/** Sentinel for aggregate “All Gyms” views (never stored as user_gyms.id). */
export const ALL_GYMS_ID = 'all' as const;
export type GymScopeId = typeof ALL_GYMS_ID | (string & {});

export function isAllGymsId(gymId: string | null | undefined): gymId is typeof ALL_GYMS_ID {
  return gymId === ALL_GYMS_ID;
}

export function getPlanLimits(plan: SubscriptionPlan = DEFAULT_SUBSCRIPTION_PLAN) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}
