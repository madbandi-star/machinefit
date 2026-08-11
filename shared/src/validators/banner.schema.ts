import { z } from 'zod';
import { BANNER_EVENT_TYPES, BANNER_SLOT_STATUSES, BANNER_STATUSES, BANNER_TYPES } from '../constants/banner.js';

/** Accept ISO / datetime-local; empty → null. */
const optionalDateTime = z
  .union([
    z.string().datetime({ offset: true }),
    z.string().datetime(),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/)
      .transform((v) => {
        const d = new Date(v.length === 16 ? `${v}:00` : v);
        return Number.isNaN(d.getTime()) ? null : d.toISOString();
      }),
    z.literal(''),
    z.null(),
  ])
  .optional()
  .transform((v) => (v === '' || v === undefined ? null : v));

const slotAssignmentSchema = z.object({
  slotKey: z.string().trim().min(1).max(64),
  priority: z.coerce.number().int().min(0).max(10_000).default(100),
});

export const bannerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  q: z.string().trim().max(100).optional(),
  status: z.enum(BANNER_STATUSES).optional(),
  slotKey: z.string().trim().max(64).optional(),
  bannerType: z.enum(BANNER_TYPES).optional(),
});

export type BannerListQuery = z.infer<typeof bannerListQuerySchema>;

const bannerWriteBase = z.object({
  name: z.string().trim().min(1).max(120),
  advertiserName: z.string().trim().max(120).default(''),
  description: z.string().trim().max(2000).default(''),
  bannerType: z.enum(BANNER_TYPES).default('image'),
  targetUrl: z
    .string()
    .trim()
    .max(2000)
    .default('')
    .refine(
      (v) => !v || /^https?:\/\//i.test(v) || v.startsWith('/'),
      'targetUrl must be http(s) or an app-relative path'
    ),
  openNewWindow: z.boolean().default(true),
  status: z.enum(BANNER_STATUSES).default('inactive'),
  startAt: optionalDateTime,
  endAt: optionalDateTime,
  priority: z.coerce.number().int().min(0).max(10_000).default(100),
  slotAssignments: z.array(slotAssignmentSchema).max(50).default([]),
});

function refineSchedule(
  value: { startAt?: string | null; endAt?: string | null },
  ctx: z.RefinementCtx
): void {
  if (value.startAt && value.endAt && value.startAt > value.endAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'endAt must be after startAt',
      path: ['endAt'],
    });
  }
}

export const createBannerSchema = bannerWriteBase.superRefine(refineSchedule);
export type CreateBannerInput = z.infer<typeof createBannerSchema>;

export const updateBannerSchema = bannerWriteBase
  .partial()
  .extend({
    slotAssignments: z.array(slotAssignmentSchema).max(50).optional(),
  })
  .superRefine(refineSchedule);
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;

export const bannerIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const bannerSlotKeyParamsSchema = z.object({
  slotKey: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[A-Z][A-Z0-9_]*$/, 'slotKey must be UPPER_SNAKE_CASE'),
});

export const createBannerSlotSchema = z.object({
  slotKey: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[A-Z][A-Z0-9_]*$/, 'slotKey must be UPPER_SNAKE_CASE'),
  slotName: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).default(''),
  status: z.enum(BANNER_SLOT_STATUSES).default('active'),
});
export type CreateBannerSlotInput = z.infer<typeof createBannerSlotSchema>;

export const updateBannerSlotSchema = z.object({
  slotName: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).optional(),
  status: z.enum(BANNER_SLOT_STATUSES).optional(),
});
export type UpdateBannerSlotInput = z.infer<typeof updateBannerSlotSchema>;

export const bannerEventBodySchema = z.object({
  bannerId: z.string().uuid(),
  slotKey: z.string().trim().min(1).max(64),
  eventType: z.enum(BANNER_EVENT_TYPES),
  sessionId: z.string().trim().max(128).optional(),
});
export type BannerEventBody = z.infer<typeof bannerEventBodySchema>;
