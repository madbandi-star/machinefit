/** Official MachineFit Q&A / help-center categories. */
export const QA_CATEGORIES = [
  'getting_started',
  'login_account',
  'workout_recommend',
  'machine_settings',
  'workout_records',
  'timer',
  'templates',
  'ai_recommend',
  'fortune',
  'points',
  'subscription',
  'notifications',
  'mypage_data',
  'privacy_rights',
  'other',
] as const;

export type QaCategory = (typeof QA_CATEGORIES)[number];

export const QA_CATEGORY_SET = new Set<string>(QA_CATEGORIES);

export function isQaCategory(value: string): value is QaCategory {
  return QA_CATEGORY_SET.has(value);
}

/** Lower number = higher priority (P0 first). */
export const QA_PRIORITIES = [0, 1, 2, 3] as const;
export type QaPriority = (typeof QA_PRIORITIES)[number];

export const QA_FEEDBACK_VALUES = ['helpful', 'not_helpful'] as const;
export type QaFeedbackValue = (typeof QA_FEEDBACK_VALUES)[number];
