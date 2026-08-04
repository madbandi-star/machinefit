/** Stable feature keys for MachineFit KPI telemetry. */
export const OPS_FEATURES = {
  VOICE_COUNT: 'voice_count',
  REST_TIMER: 'rest_timer',
  RECOMMEND_VIEW: 'recommend_view',
  MACHINE_SEARCH: 'machine_search',
  FAVORITE_ADD: 'favorite_add',
  HISTORY_SAVE: 'history_save',
  WORKOUT_SAVE: 'workout_save',
  CAPTURE: 'capture',
  PWA_INSTALL: 'pwa_install',
  SHARE: 'share',
  REGISTER_COMPLETE: 'register_complete',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAIL: 'login_fail',
} as const;

export type OpsFeatureKey = (typeof OPS_FEATURES)[keyof typeof OPS_FEATURES];
