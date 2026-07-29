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
  websiteUrl: z.union([z.literal(''), z.string().url().max(500)]).optional(),
  countryCode: z.union([z.literal(''), z.string().length(2)]).optional(),
  sortOrder: z.number().int().min(0).max(999999).optional().default(0),
  isActive: z.boolean().optional().default(true),
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
    .regex(/^[A-Za-z0-9_]+$/, 'Code must be alphanumeric/underscore'),
  name: localizedNameSchema,
  muscleGroup: z.string().min(1).max(50),
  machineType: z
    .enum(['selectorized', 'plate_loaded', 'cable', 'free_weight', 'smith', 'bodyweight'])
    .optional()
    .default('selectorized'),
  description: localizedOptionalSchema,
  sortOrder: z.number().int().min(0).max(999999).optional().default(0),
  isActive: z.boolean().optional().default(true),
  hasSeat: z.boolean().optional(),
  hasBackPad: z.boolean().optional(),
  hasFootPlate: z.boolean().optional(),
  hasHandle: z.boolean().optional(),
  romType: z.union([z.literal(''), z.string().max(30)]).optional(),
});

export const adminToggleActiveBodySchema = z.object({
  isActive: z.boolean(),
});

export type AdminBrandListQuery = z.infer<typeof adminBrandListQuerySchema>;
export type AdminBrandUpsertInput = z.infer<typeof adminBrandUpsertSchema>;
export type AdminMachineListQuery = z.infer<typeof adminMachineListQuerySchema>;
export type AdminMachineUpsertInput = z.infer<typeof adminMachineUpsertSchema>;
