/** Canonical point action codes (must match point_policies.action_code). */
export const POINT_ACTION_CODES = [
  'signup_complete',
  'first_login',
  'profile_complete',
  'workout_card_create',
  'workout_log_save',
  'workout_complete',
  'workout_streak',
  'daily_workout_done',
  'machine_search',
  'machine_detail_view',
  'favorite_add',
  'template_create',
  'template_share',
  'template_download',
  'template_use',
  'community_post',
  'community_comment',
  'community_like',
  'power_box_claim',
  'timer_session_complete',
  'showcase_post',
  'showcase_claim',
  'machine_dex_discover',
] as const;

export type PointActionCode = (typeof POINT_ACTION_CODES)[number];

export const POINT_ACTION_CODE_SET = new Set<string>(POINT_ACTION_CODES);

export function isPointActionCode(value: string): value is PointActionCode {
  return POINT_ACTION_CODE_SET.has(value);
}

export const POINT_TRANSACTION_TYPES = [
  'EARN',
  'SPEND',
  'ADMIN_GRANT',
  'ADMIN_DEDUCT',
  'EXPIRE',
  'REFUND',
] as const;

export type PointTransactionType = (typeof POINT_TRANSACTION_TYPES)[number];

/** Client may only request these (server still enforces policy/limits). */
export const POINT_CLIENT_TRACKABLE_ACTIONS = [
  'machine_search',
  'machine_detail_view',
] as const;

export type PointClientTrackableAction =
  (typeof POINT_CLIENT_TRACKABLE_ACTIONS)[number];

export function isPointClientTrackableAction(
  value: string
): value is PointClientTrackableAction {
  return (POINT_CLIENT_TRACKABLE_ACTIONS as readonly string[]).includes(value);
}

/** Minimum saved timer duration before 헬창력 (POWER) is awarded. */
export const TIMER_SESSION_POINTS_MIN_SECONDS = 60;
