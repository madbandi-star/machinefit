/** Billing / SaaS subscription types (additive; does not replace Role ladder). */

export const BILLING_PLAN_CODES = ['FREE', 'PREMIUM', 'VIP'] as const;
export type BillingPlanCode = (typeof BILLING_PLAN_CODES)[number];

export const SUBSCRIPTION_STATUSES = [
  'ACTIVE',
  'TRIAL',
  'EXPIRED',
  'CANCELED',
  'PAUSED',
  'PENDING',
  'FAILED',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'CANCELED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PROVIDER_IDS = [
  'dummy',
  'toss',
  'portone',
  'lemonsqueezy',
  'polar',
  'stripe',
  'google',
  'apple',
] as const;
export type PaymentProviderId = (typeof PAYMENT_PROVIDER_IDS)[number];

export type BillingPlan = {
  id: string;
  code: BillingPlanCode | string;
  name: Record<string, string>;
  description: Record<string, string>;
  priceCents: number;
  currency: string;
  billingPeriod: string;
  trialDays: number;
  maxGyms: number;
  maxMembersPerGym: number;
  displayOrder: number;
  isActive: boolean;
};

export type UserSubscription = {
  id: string;
  userId: string;
  planId: string;
  planCode: string;
  status: SubscriptionStatus;
  startAt: string | null;
  expireAt: string | null;
  trialEndAt: string | null;
  cancelAt: string | null;
  paymentProvider: string;
  providerSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentHistoryItem = {
  id: string;
  userId: string;
  subscriptionId: string | null;
  paymentProvider: string;
  paymentKey: string | null;
  providerPaymentId: string | null;
  orderId: string;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
};

export type SubscriptionStatusView = {
  planCode: string;
  planLabel: string;
  status: SubscriptionStatus | 'NONE';
  isTrial: boolean;
  trialConsumed: boolean;
  trialEndAt: string | null;
  startAt: string | null;
  expireAt: string | null;
  /** Existing users.subscription_plan cache (free|premium). */
  entitlementPlan: 'free' | 'premium';
  paymentReady: false;
  checkoutLabel: '준비중' | 'Coming soon';
};

export type AdminSubscriptionRow = {
  userId: string;
  email: string;
  displayName: string;
  roleCode: string;
  entitlementPlan: string;
  planCode: string | null;
  status: SubscriptionStatus | 'NONE';
  isTrial: boolean;
  trialConsumed: boolean;
  expireAt: string | null;
  startAt: string | null;
};
