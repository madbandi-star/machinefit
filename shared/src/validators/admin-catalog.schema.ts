import { z } from 'zod';

const localizedNameSchema = z.object({
  ko: z.string().min(1).max(200),
  en: z.string().min(1).max(200),
  ja: z.string().max(200).optional(),
  zh: z.string().max(200).optional(),
});

const localizedOptionalSchema = z
  .object({
    ko: z.string().max(2000).optional(),
    en: z.string().max(2000).optional(),
    ja: z.string().max(2000).optional(),
    zh: z.string().max(2000).optional(),
  })
  .optional();

/** Treat blank / bare scheme placeholders as empty; prepend https when host-only. */
function normalizeOptionalUrl(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\/$/i.test(trimmed)) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function normalizeOptionalCountry(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().toUpperCase();
}

export const adminBrandListQuerySchema = z.object({
  q: z.string().max(100).optional(),
  sort: z.enum(['name', 'createdAt', 'sortOrder']).optional().default('sortOrder'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  isActive: z
    .enum(['true', 'false', 'all'])
    .optional()
    .default('all')
    .transform((v) => (v === 'all' ? undefined : v === 'true')),
});

export const adminBrandUpsertSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, 'Code must be alphanumeric'),
  name: localizedNameSchema,
  description: localizedOptionalSchema,
  websiteUrl: z.preprocess(
    normalizeOptionalUrl,
    z.union([z.literal(''), z.string().url().max(500)]).optional()
  ),
  countryCode: z.preprocess(
    normalizeOptionalCountry,
    z.union([z.literal(''), z.string().length(2)]).optional()
  ),
  sortOrder: z.number().int().min(0).max(999999).optional().default(0),
  isActive: z.boolean().optional().default(true),
  isDefaultFavorite: z.boolean().optional().default(false),
});

export const adminBrandSortMoveSchema = z.object({
  direction: z.enum(['up', 'down', 'top', 'bottom']),
});

export const adminMachineListQuerySchema = z.object({
  q: z.string().max(100).optional(),
  brandId: z.string().uuid().optional(),
  brandCode: z.string().max(50).optional(),
  muscleGroup: z.string().max(50).optional(),
  isActive: z
    .enum(['true', 'false', 'all'])
    .optional()
    .default('all')
    .transform((v) => (v === 'all' ? undefined : v === 'true')),
  sort: z.enum(['name', 'createdAt', 'sortOrder', 'code']).optional().default('sortOrder'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const adminMachineUpsertSchema = z.object({
  brandId: z.string().uuid(),
  code: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[A-Za-z0-9_-]+$/, 'Code must be alphanumeric'),
  name: localizedNameSchema,
  muscleGroup: z.string().min(1).max(50),
  machineType: z
    .enum(['selectorized', 'plate_loaded', 'cable', 'free_weight', 'smith', 'bodyweight'])
    .optional()
    .default('selectorized'),
  description: localizedOptionalSchema,
  /** Link to standard machine type; null clears. */
  standardTypeId: z.union([z.string().uuid(), z.null()]).optional(),
  /** Manufacturer model / SKU; empty clears. */
  modelCode: z.union([z.literal(''), z.string().max(120)]).optional(),
  sortOrder: z.number().int().min(0).max(999999).optional().default(0),
  isActive: z.boolean().optional().default(true),
  hasSeat: z.boolean().optional(),
  hasBackPad: z.boolean().optional(),
  hasFootPlate: z.boolean().optional(),
  hasHandle: z.boolean().optional(),
  romType: z.union([z.literal(''), z.string().max(30)]).optional(),
  /**
   * Bodyweight estimated-load factor (admin only).
   * Null clears override (falls back to shared code default).
   */
  bodyweightLoadFactor: z
    .union([z.number().gt(0).lte(1.5), z.null()])
    .optional(),
});

export const adminToggleActiveBodySchema = z.object({
  isActive: z.boolean(),
});

const localizedLinesSchema = z.object({
  ko: z.array(z.string().max(500)).max(30).default([]),
  en: z.array(z.string().max(500)).max(30).default([]),
  ja: z.array(z.string().max(500)).max(30).optional(),
  zh: z.array(z.string().max(500)).max(30).optional(),
});

/** Admin: per-machine 주의사항 / 운동팁 (localized line arrays). */
export const adminMachineTipsUpdateSchema = z.object({
  tips: localizedLinesSchema,
  warnings: localizedLinesSchema,
});

export type AdminBrandListQuery = z.infer<typeof adminBrandListQuerySchema>;
export type AdminBrandUpsertInput = z.infer<typeof adminBrandUpsertSchema>;
export type AdminBrandSortMoveInput = z.infer<typeof adminBrandSortMoveSchema>;
export type AdminMachineListQuery = z.infer<typeof adminMachineListQuerySchema>;
export type AdminMachineUpsertInput = z.infer<typeof adminMachineUpsertSchema>;
export type AdminMachineTipsUpdateInput = z.infer<typeof adminMachineTipsUpdateSchema>;
