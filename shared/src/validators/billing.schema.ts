import { z } from 'zod';
import {
  BILLING_PLAN_CODES,
  COUPON_KINDS,
  PAYMENT_PROVIDER_IDS,
  SUBSCRIPTION_STATUSES,
} from '../types/billing.types.js';

export const startTrialSchema = z.object({
  planCode: z.enum(BILLING_PLAN_CODES).default('PREMIUM'),
  trialDays: z.number().int().min(1).max(30).optional(),
});
export type StartTrialInput = z.infer<typeof startTrialSchema>;

export const cancelSubscriptionSchema = z.object({
  reason: z.string().max(500).optional(),
});
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;

export const createCheckoutSchema = z.object({
  planCode: z.enum(BILLING_PLAN_CODES).default('PREMIUM'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  couponCode: z.string().trim().max(64).optional(),
});
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;

export const applyCouponSchema = z.object({
  code: z.string().trim().min(2).max(64),
});
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;

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

export const adminCreateCouponSchema = z.object({
  code: z.string().trim().min(2).max(64),
  kind: z.enum(COUPON_KINDS),
  value: z.number().positive(),
  maxRedemptions: z.number().int().positive().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
});
export type AdminCreateCouponInput = z.infer<typeof adminCreateCouponSchema>;

export const adminGrantTrialSchema = z.object({
  days: z.number().int().min(1).max(90).default(7),
  planCode: z.enum(BILLING_PLAN_CODES).default('PREMIUM'),
});
export type AdminGrantTrialInput = z.infer<typeof adminGrantTrialSchema>;

export const adminRefundSchema = z.object({
  paymentId: z.string().uuid().optional(),
  providerPaymentId: z.string().min(1).optional(),
  reason: z.string().max(500).optional(),
});
export type AdminRefundInput = z.infer<typeof adminRefundSchema>;

export const paymentProviderIdSchema = z.enum(PAYMENT_PROVIDER_IDS);
