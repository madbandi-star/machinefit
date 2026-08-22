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

export const catalogImageTypeSchema = z.enum([
  'front',
  'side',
  'rear',
  'detail',
  'setting',
  'other',
]);

export const catalogImageSourceTypeSchema = z.enum([
  'official',
  'uploaded',
  'licensed',
  'generated',
  'other',
]);

export const adminStandardMachineListQuerySchema = z.object({
  q: z.string().max(100).optional(),
  muscleGroup: z.string().max(50).optional(),
  isActive: z
    .enum(['true', 'false', 'all'])
    .optional()
    .default('all')
    .transform((v) => (v === 'all' ? undefined : v === 'true')),
  sort: z.enum(['name', 'createdAt', 'sortOrder', 'code']).optional().default('sortOrder'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

export const adminStandardMachineUpsertSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[A-Za-z0-9_-]+$/, 'Code must be alphanumeric'),
  name: localizedNameSchema,
  description: localizedOptionalSchema,
  primaryMuscleGroup: z.string().min(1).max(50),
  muscleGroups: z.array(z.string().min(1).max(50)).max(20).optional(),
  aliases: z.array(z.string().min(1).max(120)).max(40).optional(),
  sortOrder: z.number().int().min(0).max(999999).optional().default(0),
  isActive: z.boolean().optional().default(true),
  /** Brand IDs to create/link catalog machines for (additive; skips already linked). */
  brandIds: z.array(z.string().uuid()).max(200).optional(),
});

export const adminStandardMachineImageMetaSchema = z.object({
  imageType: catalogImageTypeSchema.optional().default('other'),
  isPrimary: z.boolean().optional(),
  displayOrder: z.number().int().min(0).max(999999).optional(),
  sourceType: catalogImageSourceTypeSchema.optional(),
  sourceUrl: z.union([z.literal(''), z.string().url().max(500)]).optional(),
  copyrightNote: z.string().max(1000).optional(),
  licenseNote: z.string().max(1000).optional(),
});

export const adminStandardMachineImageReorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1).max(50),
});

export const adminBrandMachineImageMetaSchema = z.object({
  imageType: catalogImageTypeSchema.optional().default('other'),
  isPrimary: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999999).optional(),
  sourceType: catalogImageSourceTypeSchema.optional(),
  sourceUrl: z.union([z.literal(''), z.string().url().max(500)]).optional(),
  copyrightNote: z.string().max(1000).optional(),
  licenseNote: z.string().max(1000).optional(),
});

export const adminBrandMachineImageReorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1).max(50),
});

export type AdminStandardMachineListQuery = z.infer<typeof adminStandardMachineListQuerySchema>;
export type AdminStandardMachineUpsertInput = z.infer<typeof adminStandardMachineUpsertSchema>;
export type AdminStandardMachineImageMeta = z.infer<typeof adminStandardMachineImageMetaSchema>;
export type AdminBrandMachineImageMeta = z.infer<typeof adminBrandMachineImageMetaSchema>;
