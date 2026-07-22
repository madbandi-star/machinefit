import { z } from 'zod';
import { locationInputSchema } from './location.schema.js';

/** Member-created gyms must include country/state/city. Internal defaults may omit. */
export function assertGymLocationRequired(input: {
  countryCode?: string | null;
  stateId?: string | null;
  cityId?: string | null;
}): string | null {
  if (!input.countryCode) return 'countryCode is required';
  if (!input.stateId) return 'stateId is required';
  if (!input.cityId) return 'cityId is required';
  return null;
}

/** Allow host-only URLs like "naver.com" by prefixing https://. */
function normalizeWebsiteUrl(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

const websiteUrlSchema = z.preprocess(
  normalizeWebsiteUrl,
  z
    .string()
    .max(500)
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^https?:\/\//i.test(v), 'Invalid URL')
);

const websiteUrlUpdateSchema = z.preprocess(
  normalizeWebsiteUrl,
  z
    .string()
    .max(500)
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine((v) => v == null || v === '' || /^https?:\/\//i.test(v), 'Invalid URL')
);

export const createUserGymSchema = z
  .object({
    name: z.string().min(1).max(200),
    address: z.string().max(500).optional().or(z.literal('')),
    brandName: z.string().max(100).optional().or(z.literal('')),
    phone: z.string().max(30).optional().or(z.literal('')),
    websiteUrl: websiteUrlSchema,
    setActive: z.boolean().optional().default(true),
    setDefault: z.boolean().optional().default(false),
    requireLocation: z.boolean().optional().default(true),
  })
  .and(locationInputSchema)
  .superRefine((val, ctx) => {
    if (val.requireLocation === false) return;
    const err = assertGymLocationRequired(val);
    if (err?.includes('country')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: err, path: ['countryCode'] });
    } else if (err?.includes('state')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: err, path: ['stateId'] });
    } else if (err?.includes('city')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: err, path: ['cityId'] });
    }
  });

export const updateUserGymSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    address: z.string().max(500).optional().nullable().or(z.literal('')),
    brandName: z.string().max(100).optional().nullable().or(z.literal('')),
    phone: z.string().max(30).optional().nullable().or(z.literal('')),
    websiteUrl: websiteUrlUpdateSchema,
    isDefault: z.boolean().optional(),
  })
  .and(locationInputSchema.partial());

export type CreateUserGymInput = z.infer<typeof createUserGymSchema>;
export type UpdateUserGymInput = z.infer<typeof updateUserGymSchema>;
