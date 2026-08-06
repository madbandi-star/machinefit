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

/** Denormalized users.subscription_status (lowercase Polar-facing cache). */
export const MEMBERSHIP_SUBSCRIPTION_STATUSES = [
  'inactive',
  'trial',
  'active',
  'cancelled',
  'expired',
  'refunded',
] as const;
export type MembershipSubscriptionStatus = (typeof MEMBERSHIP_SUBSCRIPTION_STATUSES)[number];

export const MEMBERSHIP_TYPES = ['FREE', 'PREMIUM'] as const;
export type MembershipType = (typeof MEMBERSHIP_TYPES)[number];

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

export const COUPON_KINDS = ['percent_off', 'amount_off', 'free_days'] as const;
export type CouponKind = (typeof COUPON_KINDS)[number];

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
  polarProductId?: string | null;
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
  providerCustomerId?: string | null;
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
  invoiceId?: string | null;
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
  cancelAt: string | null;
  /** Existing users.subscription_plan cache (free|premium). */
  entitlementPlan: 'free' | 'premium';
  membershipType: MembershipType;
  subscriptionStatus: MembershipSubscriptionStatus;
  autoRenew: boolean;
  daysRemaining: number | null;
  nextBillingAt: string | null;
  isPremium: boolean;
  paymentReady: boolean;
  checkoutLabel: string;
  provider: string;
  manageUrl: string | null;
};

export type CheckoutSessionResult = {
  checkoutUrl: string;
  orderId: string;
  provider: string;
  ready: boolean;
};

export type Coupon = {
  id: string;
  code: string;
  kind: CouponKind;
  value: number;
  maxRedemptions: number | null;
  redemptionCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
};

export type CouponHistoryItem = {
  id: string;
  userId: string;
  couponCode: string;
  discountAmount: number;
  freeDays: number;
  createdAt: string;
};

export type AdminSubscriptionRow = {
  userId: string;
  email: string;
  displayName: string;
  roleCode: string;
  entitlementPlan: string;
  membershipType: MembershipType | string;
  planCode: string | null;
  status: SubscriptionStatus | 'NONE';
  subscriptionStatus: MembershipSubscriptionStatus | string;
  isTrial: boolean;
  trialConsumed: boolean;
  expireAt: string | null;
  startAt: string | null;
};
