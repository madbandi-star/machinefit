import { randomUUID } from 'node:crypto';
import type {
  CheckoutInput,
  CheckoutResult,
  PaymentProvider,
  ProviderSubscriptionResult,
  RefundInput,
  SubscriptionInput,
  VerifyPaymentInput,
  VerifyPaymentResult,
  WebhookEvent,
  WebhookVerifyResult,
} from '../../provider.interface.js';

/** Mock provider — no external network calls. */
export class DummyPaymentProvider implements PaymentProvider {
  readonly id = 'dummy' as const;

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    return {
      provider: this.id,
      checkoutUrl: null,
      orderId: input.orderId,
      ready: false,
      message: '결제 준비중 — DummyPaymentProvider (실제 PG 미연동)',
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    return {
      ok: false,
      status: 'PENDING',
      raw: { orderId: input.orderId, mock: true },
    };
  }

  async createSubscription(input: SubscriptionInput): Promise<ProviderSubscriptionResult> {
    return {
      providerSubscriptionId: `dummy_sub_${randomUUID()}`,
      status: 'PENDING',
      raw: {
        userId: input.userId,
        planCode: input.planCode,
        trialDays: input.trialDays ?? 0,
        mock: true,
      },
    };
  }

  async cancelSubscription(_providerSubscriptionId: string): Promise<{ ok: boolean }> {
    return { ok: true };
  }

  async pauseSubscription(_providerSubscriptionId: string): Promise<{ ok: boolean }> {
    return { ok: true };
  }

  async resumeSubscription(_providerSubscriptionId: string): Promise<{ ok: boolean }> {
    return { ok: true };
  }

  async refund(_input: RefundInput): Promise<{ ok: boolean }> {
    return { ok: true };
  }

  async getPayment(_providerPaymentId: string): Promise<Record<string, unknown> | null> {
    return { mock: true, provider: this.id };
  }

  async getSubscription(_providerSubscriptionId: string): Promise<Record<string, unknown> | null> {
    return { mock: true, provider: this.id };
  }

  async verifyWebhook(
    _headers: Record<string, string | string[] | undefined>,
    rawBody: string
  ): Promise<WebhookVerifyResult> {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
    } catch {
      return { ok: false, reason: 'Invalid JSON body', events: [] };
    }

    const typeRaw = String(parsed.type ?? 'unknown');
    const allowed: WebhookEvent['type'][] = [
      'payment.succeeded',
      'payment.failed',
      'subscription.created',
      'subscription.updated',
      'subscription.canceled',
      'subscription.expired',
      'unknown',
    ];
    const type = (allowed.includes(typeRaw as WebhookEvent['type'])
      ? typeRaw
      : 'unknown') as WebhookEvent['type'];

    const event: WebhookEvent = {
      type,
      provider: this.id,
      userId: parsed.userId ? String(parsed.userId) : undefined,
      providerSubscriptionId: parsed.providerSubscriptionId
        ? String(parsed.providerSubscriptionId)
        : undefined,
      providerPaymentId: parsed.providerPaymentId
        ? String(parsed.providerPaymentId)
        : undefined,
      orderId: parsed.orderId ? String(parsed.orderId) : undefined,
      amountCents:
        typeof parsed.amountCents === 'number'
          ? parsed.amountCents
          : typeof parsed.amount === 'number'
            ? Math.round(parsed.amount * 100)
            : undefined,
      currency: parsed.currency ? String(parsed.currency) : 'KRW',
      raw: parsed,
    };

    return { ok: true, events: [event] };
  }
}
