/** Canonical usage feature codes for tracking + policy. */
export const USAGE_FEATURE_CODES = [
  'exercise_card_create',
  'exercise_card_update',
  'exercise_record_save',
  'exercise_record_delete',
  'template_create',
  'template_use',
  'template_download',
  'template_save',
  'timer_start',
  'timer_end',
  'rest_timer',
  'lap_record',
  'voice_count',
  'voice_count_complete',
  'login',
  'insight_lifter_dna',
  'insight_growth_timeline',
  'insight_growth_analysis',
  'insight_lifted_weight',
  'insight_achievements',
  'insight_share',
  'lab_live_dashboard',
  'lab_open',
  'lab_share',
] as const;

export type UsageFeatureCode = (typeof USAGE_FEATURE_CODES)[number];

export const USAGE_FEATURE_CODE_SET = new Set<string>(USAGE_FEATURE_CODES);

export function isUsageFeatureCode(value: string): value is UsageFeatureCode {
  return USAGE_FEATURE_CODE_SET.has(value);
}

/** Columns on user_usage_daily / user_usage_monthly for fixed counters. */
export const USAGE_COLUMN_BY_FEATURE: Partial<Record<UsageFeatureCode, string>> = {
  exercise_card_create: 'exercise_card_create_count',
  exercise_card_update: 'exercise_card_update_count',
  exercise_record_save: 'exercise_record_save_count',
  exercise_record_delete: 'exercise_record_delete_count',
  template_create: 'template_create_count',
  template_use: 'template_use_count',
  template_download: 'template_download_count',
  template_save: 'template_save_count',
  timer_start: 'timer_start_count',
  timer_end: 'timer_end_count',
  rest_timer: 'rest_timer_count',
  lap_record: 'lap_record_count',
  voice_count: 'voice_count_count',
  voice_count_complete: 'voice_count_complete_count',
  login: 'login_count',
};

export type UsagePlanTier = 'FREE' | 'PREMIUM' | 'ADMIN';

export type UsageLimitReason =
  | 'ALLOWED'
  | 'FEATURE_DISABLED'
  | 'PLAN_NOT_ALLOWED'
  | 'DAILY_LIMIT_EXCEEDED'
  | 'MONTHLY_LIMIT_EXCEEDED'
  | 'LIMITS_NOT_ENFORCED';
