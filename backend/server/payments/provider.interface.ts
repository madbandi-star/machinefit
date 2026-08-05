/**
 * Payment provider interface — swap implementations via PAYMENT_PROVIDER env.
 */
import type { PaymentProviderId } from '@machinefit/shared';

export type CheckoutInput = {
  userId: string;
  email?: string;
  displayName?: string;
  planCode: string;
  amountCents: number;
  currency: string;
  orderId: string;
  successUrl?: string;
  cancelUrl?: string;
  /** Polar product id override (from plan_master.polar_product_id). */
  polarProductId?: string | null;
  metadata?: Record<string, string>;
};

export type CheckoutResult = {
  provider: PaymentProviderId | string;
  checkoutUrl: string | null;
  orderId: string;
  ready: boolean;
  message: string;
};

export type SubscriptionInput = {
  userId: string;
  planCode: string;
  providerCustomerId?: string;
  trialDays?: number;
};

export type ProviderSubscriptionResult = {
  providerSubscriptionId: string;
  status: string;
  raw?: Record<string, unknown>;
};

export type VerifyPaymentInput = {
  orderId: string;
  paymentKey?: string;
  providerPaymentId?: string;
};

export type VerifyPaymentResult = {
  ok: boolean;
  status: string;
  amountCents?: number;
  raw?: Record<string, unknown>;
};

export type RefundInput = {
  providerPaymentId: string;
  amountCents?: number;
  reason?: string;
};

/** Normalized webhook event after provider-specific verification/parsing. */
export type WebhookEvent = {
  type:
    | 'payment.succeeded'
    | 'payment.failed'
    | 'payment.refunded'
    | 'subscription.created'
    | 'subscription.updated'
    | 'subscription.canceled'
    | 'subscription.revoked'
    | 'subscription.renewed'
    | 'subscription.expired'
    | 'unknown';
  provider: PaymentProviderId | string;
  eventId?: string;
  userId?: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  providerPaymentId?: string;
  orderId?: string;
  amountCents?: number;
  currency?: string;
  /** Period end / next billing (ISO). */
  currentPeriodEnd?: string | null;
  status?: string;
  cancelAtPeriodEnd?: boolean;
  raw?: Record<string, unknown>;
};

export type WebhookVerifyResult = {
  ok: boolean;
  reason?: string;
  events: WebhookEvent[];
};

export interface PaymentProvider {
  readonly id: PaymentProviderId | string;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
  createSubscription(input: SubscriptionInput): Promise<ProviderSubscriptionResult>;
  cancelSubscription(
    providerSubscriptionId: string,
    opts?: { atPeriodEnd?: boolean }
  ): Promise<{ ok: boolean }>;
  pauseSubscription(providerSubscriptionId: string): Promise<{ ok: boolean }>;
  resumeSubscription(providerSubscriptionId: string): Promise<{ ok: boolean }>;
  refund(input: RefundInput): Promise<{ ok: boolean }>;
  getPayment(providerPaymentId: string): Promise<Record<string, unknown> | null>;
  getSubscription(providerSubscriptionId: string): Promise<Record<string, unknown> | null>;
  /**
   * Verify signature + parse into normalized events.
   * Service layer applies events — providers only verify/parse.
   */
  verifyWebhook(
    headers: Record<string, string | string[] | undefined>,
    rawBody: string
  ): Promise<WebhookVerifyResult>;
}
