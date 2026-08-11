export const TEMPLATE_SHARE_CATEGORIES = [
  'general',
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'full_body',
  'upper',
  'lower',
  'cardio',
  'other',
] as const;
export type TemplateShareCategory = (typeof TEMPLATE_SHARE_CATEGORIES)[number];

export const TEMPLATE_SHARE_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export type TemplateShareDifficulty = (typeof TEMPLATE_SHARE_DIFFICULTIES)[number];

export const TEMPLATE_SHARE_STATUSES = ['published', 'hidden', 'removed'] as const;
export type TemplateShareStatus = (typeof TEMPLATE_SHARE_STATUSES)[number];

export const TEMPLATE_SHARE_SORTS = [
  'latest',
  'popular',
  'downloads',
  'uses',
  'likes',
] as const;
export type TemplateShareSort = (typeof TEMPLATE_SHARE_SORTS)[number];

export const TEMPLATE_SHARE_REPORT_REASONS = [
  'inappropriate',
  'ads',
  'spam',
  'abuse',
  'illegal',
  'other',
] as const;
export type TemplateShareReportReason = (typeof TEMPLATE_SHARE_REPORT_REASONS)[number];

export const TEMPLATE_SHARE_REPORT_STATUSES = [
  'open',
  'reviewed',
  'actioned',
  'dismissed',
] as const;
export type TemplateShareReportStatus = (typeof TEMPLATE_SHARE_REPORT_STATUSES)[number];

/** View-count dedupe window (same viewer_key). */
export const TEMPLATE_SHARE_VIEW_DEDUPE_MS = 30 * 60 * 1000;
