/**
 * Polar.sh payment adapter — Checkout Sessions + Subscriptions + Webhooks.
 * Credentials: POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_SECRET, POLAR_ORGANIZATION_ID,
 * POLAR_PREMIUM_PRODUCT_ID (or plan_master.polar_product_id).
 */
import { env } from '../../../config/env.js';
import { mapPolarEventType } from '../../polar/polar-event-map.js';
import { verifyPolarWebhookSignature } from '../../polar/webhook-signature.js';
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

type PolarJson = Record<string, unknown>;

function apiBase(): string {
  return env.POLAR_SERVER === 'sandbox'
    ? 'https://sandbox-api.polar.sh/v1'
    : 'https://api.polar.sh/v1';
}

function asRecord(v: unknown): PolarJson {
  return v && typeof v === 'object' ? (v as PolarJson) : {};
}

function pickString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v;
  }
  return undefined;
}

function pickAmountCents(data: PolarJson): number | undefined {
  const amount = data.amount ?? data.total_amount ?? data.net_amount;
  if (typeof amount === 'number') return Math.round(amount);
  return undefined;
}

export class PolarPaymentProvider implements PaymentProvider {
  readonly id = 'polar' as const;

  private get token(): string {
    const t = env.POLAR_ACCESS_TOKEN?.trim();
    if (!t) throw new Error('POLAR_ACCESS_TOKEN is not configured');
    return t;
  }

  private async request(
    method: string,
    path: string,
    body?: unknown
  ): Promise<PolarJson> {
    const res = await fetch(`${apiBase()}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json: PolarJson = {};
    try {
      json = text ? (JSON.parse(text) as PolarJson) : {};
    } catch {
      json = { raw: text };
    }
    if (!res.ok) {
      const detail =
        pickString(json.detail, json.error, json.message) ?? `Polar API ${res.status}`;
      throw new Error(detail);
    }
    return json;
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const productId =
      input.polarProductId?.trim() || env.POLAR_PREMIUM_PRODUCT_ID?.trim() || '';
    if (!productId) {
      return {
        provider: this.id,
        checkoutUrl: null,
        orderId: input.orderId,
        ready: false,
        message: 'POLAR_PREMIUM_PRODUCT_ID (or plan polar_product_id) is required',
      };
    }

    const successUrl =
      input.successUrl ||
      env.POLAR_SUCCESS_URL ||
      `${env.FRONTEND_BASE_URL || 'https://machine-fit.com/machinefit'}/my-page?billing=success`;
    const returnUrl =
      input.cancelUrl ||
      env.POLAR_RETURN_URL ||
      `${env.FRONTEND_BASE_URL || 'https://machine-fit.com/machinefit'}/my-page?billing=cancel`;

    const payload: PolarJson = {
      products: [productId],
      success_url: successUrl.includes('{CHECKOUT_ID}')
        ? successUrl
        : `${successUrl}${successUrl.includes('?') ? '&' : '?'}checkout_id={CHECKOUT_ID}`,
      return_url: returnUrl,
      customer_email: input.email,
      customer_name: input.displayName,
      external_customer_id: input.userId,
      metadata: {
        userId: input.userId,
        planCode: input.planCode,
        orderId: input.orderId,
        ...(input.metadata ?? {}),
      },
    };

    if (env.POLAR_ORGANIZATION_ID) {
      // Some Polar API versions accept organization_id on checkout create
      payload.organization_id = env.POLAR_ORGANIZATION_ID;
    }

    const data = await this.request('POST', '/checkouts/', payload);
    const url = pickString(data.url);
    if (!url) {
      return {
        provider: this.id,
        checkoutUrl: null,
        orderId: input.orderId,
        ready: false,
        message: 'Polar checkout response missing url',
      };
    }

    return {
      provider: this.id,
      checkoutUrl: url,
      orderId: input.orderId,
      ready: true,
      message: 'ok',
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    if (!input.providerPaymentId && !input.orderId) {
      return { ok: false, status: 'PENDING' };
    }
    return { ok: true, status: 'PAID', raw: { orderId: input.orderId } };
  }

  async createSubscription(input: SubscriptionInput): Promise<ProviderSubscriptionResult> {
    // Trials are granted in-app; Polar subscription is created via Checkout.
    return {
      providerSubscriptionId: `polar_pending_${input.userId}`,
      status: 'PENDING',
      raw: { note: 'Use createCheckout for Polar subscriptions' },
    };
  }

  async cancelSubscription(
    providerSubscriptionId: string,
    opts?: { atPeriodEnd?: boolean }
  ): Promise<{ ok: boolean }> {
    const atPeriodEnd = opts?.atPeriodEnd !== false;
    if (atPeriodEnd) {
      await this.request('PATCH', `/subscriptions/${providerSubscriptionId}`, {
        cancel_at_period_end: true,
      });
      return { ok: true };
    }
    // Immediate revoke so withdrawn accounts are not billed again.
    await this.request('DELETE', `/subscriptions/${providerSubscriptionId}`);
    return { ok: true };
  }

  async pauseSubscription(providerSubscriptionId: string): Promise<{ ok: boolean }> {
    await this.request('PATCH', `/subscriptions/${providerSubscriptionId}`, {
      // Polar pause — best-effort; ignore if unsupported
    });
    void providerSubscriptionId;
    return { ok: true };
  }

  async resumeSubscription(providerSubscriptionId: string): Promise<{ ok: boolean }> {
    await this.request('PATCH', `/subscriptions/${providerSubscriptionId}`, {
      cancel_at_period_end: false,
    });
    return { ok: true };
  }

  async refund(input: RefundInput): Promise<{ ok: boolean }> {
    // Polar refunds via order refund endpoint
    await this.request('POST', `/refunds/`, {
      order_id: input.providerPaymentId,
      reason: input.reason ?? 'customer_request',
      amount: input.amountCents,
    });
    return { ok: true };
  }

  async getPayment(providerPaymentId: string): Promise<Record<string, unknown> | null> {
    try {
      return await this.request('GET', `/orders/${providerPaymentId}`);
    } catch {
      return null;
    }
  }

  async getSubscription(providerSubscriptionId: string): Promise<Record<string, unknown> | null> {
    try {
      return await this.request('GET', `/subscriptions/${providerSubscriptionId}`);
    } catch {
      return null;
    }
  }

  async verifyWebhook(
    headers: Record<string, string | string[] | undefined>,
    rawBody: string
  ): Promise<WebhookVerifyResult> {
    const verified = verifyPolarWebhookSignature(env.POLAR_WEBHOOK_SECRET, headers, rawBody);
    if (!verified.ok) {
      return { ok: false, reason: verified.reason, events: [] };
    }

    let parsed: PolarJson = {};
    try {
      parsed = JSON.parse(rawBody) as PolarJson;
    } catch {
      return { ok: false, reason: 'Invalid JSON body', events: [] };
    }

    const type = String(parsed.type ?? 'unknown');
    const data = asRecord(parsed.data);
    const meta = asRecord(data.metadata);
    const customer = asRecord(data.customer);
    const subscription = asRecord(data.subscription ?? data);

    const userId = pickString(
      meta.userId,
      meta.user_id,
      data.external_customer_id,
      customer.external_id
    );
    const providerSubscriptionId = pickString(
      subscription.id,
      data.subscription_id,
      data.id && type.startsWith('subscription.') ? data.id : undefined
    );
    const providerCustomerId = pickString(customer.id, data.customer_id);
    const providerPaymentId = pickString(
      data.id && (type.startsWith('order.') || type.startsWith('refund.'))
        ? data.id
        : undefined,
      data.order_id
    );
    const periodEnd = pickString(
      data.current_period_end,
      subscription.current_period_end,
      data.ends_at
    );

    const event: WebhookEvent = {
      type: mapPolarEventType(type),
      provider: this.id,
      eventId: verified.webhookId || pickString(parsed.id) || `${type}:${providerPaymentId ?? providerSubscriptionId ?? Date.now()}`,
      userId,
      providerCustomerId,
      providerSubscriptionId,
      providerPaymentId,
      orderId: pickString(meta.orderId, meta.order_id, data.id),
      amountCents: pickAmountCents(data),
      currency: pickString(data.currency) ?? 'KRW',
      currentPeriodEnd: periodEnd ?? null,
      status: pickString(data.status, subscription.status),
      cancelAtPeriodEnd: Boolean(
        data.cancel_at_period_end ?? subscription.cancel_at_period_end
      ),
      raw: { type, data, polarType: type },
    };

    return { ok: true, events: [event] };
  }
}
