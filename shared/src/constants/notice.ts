export const NOTICE_CATEGORIES = [
  'notice',
  'event',
  'maintenance',
  'update',
  'other',
] as const;

export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number];

export const NOTICE_STATUSES = ['DRAFT', 'PUBLISHED', 'HIDDEN', 'RESERVED'] as const;

export type NoticeStatus = (typeof NOTICE_STATUSES)[number];

export const NOTICE_LANGUAGES = ['ko', 'en', 'ja', 'zh'] as const;

export type NoticeLanguage = (typeof NOTICE_LANGUAGES)[number];

/** Max attachments per notice (images + files). */
export const NOTICE_MAX_ATTACHMENTS = 10;

/** Max bytes per attachment (20MB). */
export const NOTICE_MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

/** View-count dedupe window. */
export const NOTICE_VIEW_DEDUPE_MS = 30 * 60 * 1000;

/** Show NEW badge for this many days after publish/create. */
export const NOTICE_NEW_BADGE_DAYS = 7;

export const NOTICE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
] as const;
