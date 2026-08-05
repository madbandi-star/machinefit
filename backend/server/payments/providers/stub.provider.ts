/**
 * Base stub for future PG adapters.
 * Register a concrete class in provider.factory.ts when credentials exist.
 */
import type {
  CheckoutInput,
  CheckoutResult,
  PaymentProvider,
  ProviderSubscriptionResult,
  RefundInput,
  SubscriptionInput,
  VerifyPaymentInput,
  VerifyPaymentResult,
  WebhookVerifyResult,
} from '../provider.interface.js';

export class UnconfiguredPaymentProvider implements PaymentProvider {
  constructor(readonly id: string) {}

  private notReady(): never {
    throw new Error(
      `Payment provider "${this.id}" is not configured. Set credentials and implement the adapter.`
    );
  }

  async createCheckout(_input: CheckoutInput): Promise<CheckoutResult> {
    this.notReady();
  }

  async verifyPayment(_input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    this.notReady();
  }

  async createSubscription(_input: SubscriptionInput): Promise<ProviderSubscriptionResult> {
    this.notReady();
  }

  async cancelSubscription(
    _providerSubscriptionId: string,
    _opts?: { atPeriodEnd?: boolean }
  ): Promise<{ ok: boolean }> {
    this.notReady();
  }

  async pauseSubscription(_providerSubscriptionId: string): Promise<{ ok: boolean }> {
    this.notReady();
  }

  async resumeSubscription(_providerSubscriptionId: string): Promise<{ ok: boolean }> {
    this.notReady();
  }

  async refund(_input: RefundInput): Promise<{ ok: boolean }> {
    this.notReady();
  }

  async getPayment(_providerPaymentId: string): Promise<Record<string, unknown> | null> {
    this.notReady();
  }

  async getSubscription(
    _providerSubscriptionId: string
  ): Promise<Record<string, unknown> | null> {
    this.notReady();
  }

  async verifyWebhook(): Promise<WebhookVerifyResult> {
    return { ok: false, reason: `Provider ${this.id} not configured`, events: [] };
  }
}
