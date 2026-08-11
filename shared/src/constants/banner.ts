export const BANNER_TYPES = ['image', 'gif'] as const;
export type BannerType = (typeof BANNER_TYPES)[number];

export const BANNER_STATUSES = ['active', 'inactive'] as const;
export type BannerStatus = (typeof BANNER_STATUSES)[number];

export const BANNER_SLOT_STATUSES = ['active', 'inactive'] as const;
export type BannerSlotStatus = (typeof BANNER_SLOT_STATUSES)[number];

export const BANNER_EVENT_TYPES = ['impression', 'click'] as const;
export type BannerEventType = (typeof BANNER_EVENT_TYPES)[number];

/** Built-in slot keys seeded for existing pages. New slots can be added via admin. */
export const BANNER_SLOT_KEYS = [
  'MAIN_BOTTOM',
  'MY_BOTTOM',
  'WORKOUT_BOTTOM',
  'MACHINE_BOTTOM',
  'COMMUNITY_BOTTOM',
] as const;

export type BannerSlotKey = (typeof BANNER_SLOT_KEYS)[number] | (string & {});

/** Max image bytes (5MB) — GIF-friendly but caps abuse. */
export const BANNER_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const BANNER_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type BannerImageKind = 'desktop' | 'mobile';

/** Max banners returned for a public slot (UX: avoid stacking too many ads). */
export const BANNER_PUBLIC_SLOT_LIMIT = 3;
