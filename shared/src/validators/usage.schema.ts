import { z } from 'zod';
import { USAGE_FEATURE_CODES } from '../constants/usage.js';

export const usageTrackEventSchema = z.object({
  featureCode: z.enum(USAGE_FEATURE_CODES),
  amount: z.number().int().min(1).max(100).optional().default(1),
});

export const usageTrackBodySchema = z.object({
  events: z.array(usageTrackEventSchema).min(1).max(40),
});

export const usagePolicyUpdateSchema = z.object({
  featureName: z.string().min(1).max(160).optional(),
  description: z.string().max(2000).optional(),
  freeAllowed: z.boolean().optional(),
  freeDailyLimit: z.number().int().min(0).nullable().optional(),
  freeMonthlyLimit: z.number().int().min(0).nullable().optional(),
  freeStockLimit: z.number().int().min(0).nullable().optional(),
  premiumAllowed: z.boolean().optional(),
  premiumDailyLimit: z.number().int().min(0).nullable().optional(),
  premiumMonthlyLimit: z.number().int().min(0).nullable().optional(),
  premiumStockLimit: z.number().int().min(0).nullable().optional(),
  limitsEnforced: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const usageSummaryQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const usageUsersQuerySchema = z.object({
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const usageTimeseriesQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const usageHistoryQuerySchema = z.object({
  policyId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
});

export type UsageTrackBody = z.infer<typeof usageTrackBodySchema>;
export type UsagePolicyUpdateInput = z.infer<typeof usagePolicyUpdateSchema>;
