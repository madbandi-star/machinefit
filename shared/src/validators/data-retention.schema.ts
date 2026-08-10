import { z } from 'zod';

const categorySchema = z.enum([
  'personal',
  'payment',
  'service',
  'log',
  'community',
  'workout',
  'auth',
  'other',
]);
const reasonSchema = z.enum([
  'legal',
  'contract',
  'consent',
  'operations',
  'security',
  'dispute',
  'other',
]);
const unitSchema = z.enum(['day', 'month', 'year']);
const basisSchema = z.enum([
  'signup_at',
  'withdrawn_at',
  'created_at',
  'updated_at',
  'transaction_at',
  'paid_at',
  'contract_end_at',
  'last_used_at',
  'admin_set',
  'other',
]);
const methodSchema = z.enum(['hard_delete', 'anonymize', 'soft_delete', 'archive']);

export const retentionPolicyCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z][a-z0-9_]*$/),
  name: z.string().trim().min(1).max(160),
  description: z.string().max(4000).optional().default(''),
  dataCategory: categorySchema,
  tableNames: z.array(z.string().min(1).max(80)).max(40).optional().default([]),
  retentionReason: reasonSchema.optional().default('operations'),
  isLegalHold: z.boolean().optional().default(false),
  legalBasisNote: z.string().max(4000).optional().default(''),
  relatedPolicyDoc: z.string().max(120).optional().default(''),
  relatedTermsDoc: z.string().max(120).optional().default(''),
  consentCatalogId: z.string().uuid().nullable().optional(),
  periodValue: z.number().int().min(0).max(36500),
  periodUnit: unitSchema,
  startBasis: basisSchema,
  autoDelete: z.boolean().optional().default(true),
  deletionMethod: methodSchema.optional().default('hard_delete'),
  retryLimit: z.number().int().min(0).max(20).optional().default(3),
  isActive: z.boolean().optional().default(true),
  changeReason: z.string().trim().min(1).max(500).optional().default('create'),
});

export const retentionPolicyUpdateSchema = retentionPolicyCreateSchema
  .omit({ code: true })
  .partial()
  .extend({
    changeReason: z.string().trim().min(1).max(500),
    /** Required when changing period to acknowledge impact preview. */
    confirmImpact: z.boolean().optional(),
  });

export const retentionPolicyListQuerySchema = z.object({
  q: z.string().max(100).optional(),
  dataCategory: categorySchema.optional(),
  retentionReason: reasonSchema.optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  autoDelete: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const retentionScheduledQuerySchema = z.object({
  policyCode: z.string().max(80).optional(),
  status: z.string().max(40).optional(),
  window: z.enum(['today', '7d', '30d', '90d', 'all']).optional().default('30d'),
  hold: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const retentionHoldSchema = z.object({
  hold: z.boolean(),
  holdReason: z.string().trim().max(1000).optional().default(''),
  holdUntil: z.string().datetime().nullable().optional(),
});

export const retentionConsentCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/),
  nameKo: z.string().trim().min(1).max(120),
  nameEn: z.string().trim().max(120).optional().default(''),
  consentKind: z.string().trim().min(1).max(40),
  isRequired: z.boolean().optional().default(false),
  withdrawable: z.boolean().optional().default(true),
  description: z.string().max(2000).optional().default(''),
});

export type RetentionPolicyCreateInput = z.infer<typeof retentionPolicyCreateSchema>;
export type RetentionPolicyUpdateInput = z.infer<typeof retentionPolicyUpdateSchema>;
export type RetentionPolicyListQuery = z.infer<typeof retentionPolicyListQuerySchema>;
export type RetentionScheduledQuery = z.infer<typeof retentionScheduledQuerySchema>;
export type RetentionHoldInput = z.infer<typeof retentionHoldSchema>;
export type RetentionConsentCreateInput = z.infer<typeof retentionConsentCreateSchema>;
