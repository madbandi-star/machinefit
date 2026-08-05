import { z } from 'zod';
import { BILLING_PLAN_CODES, PAYMENT_PROVIDER_IDS, SUBSCRIPTION_STATUSES } from '../types/billing.types.js';

export const startTrialSchema = z.object({
  planCode: z.enum(BILLING_PLAN_CODES).default('PREMIUM'),
  trialDays: z.number().int().min(1).max(30).optional(),
});
export type StartTrialInput = z.infer<typeof startTrialSchema>;

export const cancelSubscriptionSchema = z.object({
  reason: z.string().max(500).optional(),
});
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;

export const adminExtendSubscriptionSchema = z.object({
  days: z.number().int().min(1).max(365),
  planCode: z.enum(BILLING_PLAN_CODES).optional(),
});
export type AdminExtendSubscriptionInput = z.infer<typeof adminExtendSubscriptionSchema>;

export const adminSetSubscriptionSchema = z.object({
  planCode: z.enum(BILLING_PLAN_CODES),
  status: z.enum(SUBSCRIPTION_STATUSES),
  days: z.number().int().min(1).max(365).optional(),
});
export type AdminSetSubscriptionInput = z.infer<typeof adminSetSubscriptionSchema>;

export const adminListSubscriptionsQuerySchema = z.object({
  q: z.string().max(120).optional(),
  status: z.enum([...SUBSCRIPTION_STATUSES, 'NONE', 'expiring'] as const).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type AdminListSubscriptionsQuery = z.infer<typeof adminListSubscriptionsQuerySchema>;

export const paymentProviderIdSchema = z.enum(PAYMENT_PROVIDER_IDS);
