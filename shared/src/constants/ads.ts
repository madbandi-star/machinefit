/** Ad placement / event / type constants for the unified ad policy engine. */

export const AD_TYPES = [
  'inline_cms',
  'inline',
  'sticky',
  'interstitial',
  'rewarded',
  'native',
] as const;
export type AdType = (typeof AD_TYPES)[number];

export const AD_FEATURE_FLAGS = [
  'ADS_ENABLED',
  'INLINE_CMS_ENABLED',
  'INLINE_ENABLED',
  'INTERSTITIAL_ENABLED',
  'STICKY_BANNER_ENABLED',
  'REWARDED_AD_ENABLED',
  'NATIVE_AD_ENABLED',
  'PAGE_TRANSITION_AD_ENABLED',
] as const;
export type AdFeatureFlag = (typeof AD_FEATURE_FLAGS)[number];

export const AD_PLACEMENT_KEYS = [
  'MAIN_BOTTOM',
  'MY_BOTTOM',
  'WORKOUT_BOTTOM',
  'MACHINE_BOTTOM',
  'COMMUNITY_BOTTOM',
  'HOME_MIDDLE',
  'RECOMMENDATION_BOTTOM',
  'FORTUNE_BOTTOM',
  'SEARCH_NATIVE_MID',
  'GLOBAL_STICKY_BOTTOM',
  'PAGE_TRANSITION',
  'WORKOUT_COMPLETE',
  'LIMIT_REACHED',
] as const;
export type AdPlacementKey = (typeof AD_PLACEMENT_KEYS)[number] | (string & {});

export const AD_EVENT_TYPES = [
  'PAGE_VIEW',
  'PAGE_TRANSITION',
  'MACHINE_VIEW',
  'MACHINE_REGISTER',
  'MACHINE_CARD_CREATE',
  'RECOMMENDATION_START',
  'RECOMMENDATION_RESULT',
  'RECOMMENDATION_COMPLETE',
  'EXERCISE_VIEW',
  'EXERCISE_START',
  'EXERCISE_COMPLETE',
  'WORKOUT_START',
  'WORKOUT_COMPLETE',
  'WORKOUT_RESULT',
  'FORTUNE_VIEW',
  'FORTUNE_RESULT',
  'SEARCH',
  'SEARCH_RESULT',
  'RECORD_SAVE',
  'FREE_LIMIT_REACHED',
  'SUBSCRIPTION_PAGE_VIEW',
] as const;
export type AdEventType = (typeof AD_EVENT_TYPES)[number] | (string & {});

export const AD_USER_STATUSES = ['ANONYMOUS', 'FREE_USER', 'PAID_USER', 'ADMIN'] as const;
export type AdUserStatus = (typeof AD_USER_STATUSES)[number];

export const AD_TRACK_EVENT_TYPES = [
  'impression',
  'click',
  'reward_complete',
  'reward_fail',
] as const;
export type AdTrackEventType = (typeof AD_TRACK_EVENT_TYPES)[number];

/** Map BannerSlot keys → ad placement keys (identity for CMS bottoms). */
export const BANNER_SLOT_TO_AD_PLACEMENT: Record<string, string> = {
  MAIN_BOTTOM: 'MAIN_BOTTOM',
  MY_BOTTOM: 'MY_BOTTOM',
  WORKOUT_BOTTOM: 'WORKOUT_BOTTOM',
  MACHINE_BOTTOM: 'MACHINE_BOTTOM',
  COMMUNITY_BOTTOM: 'COMMUNITY_BOTTOM',
};

export const AD_TYPE_FEATURE_FLAG: Record<AdType, AdFeatureFlag> = {
  inline_cms: 'INLINE_CMS_ENABLED',
  inline: 'INLINE_ENABLED',
  sticky: 'STICKY_BANNER_ENABLED',
  interstitial: 'INTERSTITIAL_ENABLED',
  rewarded: 'REWARDED_AD_ENABLED',
  native: 'NATIVE_AD_ENABLED',
};

export const AD_DEFAULT_FREQUENCY = {
  interstitialMinIntervalSec: 300,
  sessionInterstitialLimit: 3,
  dailyInterstitialLimit: 10,
  pageTransitionEveryN: 5,
  workoutCompleteEveryN: 3,
} as const;
