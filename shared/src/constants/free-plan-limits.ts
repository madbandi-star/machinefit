/**
 * Central free-plan abuse / quota defaults.
 * Override via env (backend) — do not scatter magic numbers across services.
 *
 * Stock = concurrent ownership cap (delete does not restore daily create quota).
 * Daily = Seoul calendar day (see seoulDateKey).
 */
export type FreePlanLimits = {
  maxEquipmentCards: number;
  dailyEquipmentCardCreates: number;
  dailyRecommendationCalls: number;
  recommendationCallsPerMinute: number;
  dailyWorkoutRecords: number;
  maxTemplates: number;
  dailyImageUploads: number;
  apiRequestsPerMinute: number;
  apiRequestsPer10Seconds: number;
  /** Premium stock/daily defaults when policy rows leave premium_* null. */
  premiumMaxEquipmentCards: number | null;
  premiumMaxTemplates: number | null;
};

function intEnv(name: string, fallback: number): number {
  const raw = typeof process !== 'undefined' ? process.env?.[name] : undefined;
  if (raw == null || raw === '') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function nullableIntEnv(name: string, fallback: number | null): number | null {
  const raw = typeof process !== 'undefined' ? process.env?.[name] : undefined;
  if (raw == null || raw === '') return fallback;
  if (raw.toLowerCase() === 'null' || raw === 'unlimited') return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Defaults match product brief; env overrides for ops without code change. */
export function getFreePlanLimits(): FreePlanLimits {
  return {
    maxEquipmentCards: intEnv('FREE_MAX_EQUIPMENT_CARDS', 30),
    dailyEquipmentCardCreates: intEnv('FREE_DAILY_EQUIPMENT_CARD_CREATES', 10),
    dailyRecommendationCalls: intEnv('FREE_DAILY_RECOMMENDATION_CALLS', 30),
    recommendationCallsPerMinute: intEnv('FREE_RECOMMENDATION_PER_MINUTE', 10),
    dailyWorkoutRecords: intEnv('FREE_DAILY_WORKOUT_RECORDS', 100),
    maxTemplates: intEnv('FREE_MAX_TEMPLATES', 20),
    dailyImageUploads: intEnv('FREE_DAILY_IMAGE_UPLOADS', 10),
    apiRequestsPerMinute: intEnv('API_RATE_LIMIT_PER_MINUTE', 60),
    apiRequestsPer10Seconds: intEnv('API_BURST_LIMIT', 20),
    premiumMaxEquipmentCards: nullableIntEnv('PREMIUM_MAX_EQUIPMENT_CARDS', null),
    premiumMaxTemplates: nullableIntEnv('PREMIUM_MAX_TEMPLATES', null),
  };
}

/** Static snapshot for docs/tests (env-applied values via getFreePlanLimits()). */
export const FREE_PLAN_LIMITS = getFreePlanLimits();
