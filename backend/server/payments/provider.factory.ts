import { env } from '../config/env.js';
import { AppError } from '../middlewares/error.middleware.js';
import type { PaymentProvider } from './provider.interface.js';
import { DummyPaymentProvider } from './providers/dummy/dummy.provider.js';
import { PolarPaymentProvider } from './providers/polar/polar.provider.js';

const cache = new Map<string, PaymentProvider>();

export function isPolarConfigured(): boolean {
  return Boolean(env.POLAR_ACCESS_TOKEN?.trim() && env.POLAR_WEBHOOK_SECRET?.trim());
}

function allowDummyProvider(): boolean {
  // Never expose unsigned Dummy webhooks / checkout in production.
  return env.NODE_ENV !== 'production';
}

/**
 * Resolve payment provider from PAYMENT_PROVIDER env (or explicit id for webhooks).
 * Polar is only instantiated when credentials exist — no silent Dummy fallback in production.
 */
export function getPaymentProvider(providerId?: string): PaymentProvider {
  const id = String(providerId || env.PAYMENT_PROVIDER || 'dummy').toLowerCase();
  const cached = cache.get(id);
  if (cached) return cached;

  let provider: PaymentProvider;
  switch (id) {
    case 'polar': {
      if (!isPolarConfigured()) {
        if (allowDummyProvider()) {
          provider = new DummyPaymentProvider();
          break;
        }
        throw new AppError(
          503,
          'PAYMENT_NOT_CONFIGURED',
          'Polar payment provider is not configured'
        );
      }
      provider = new PolarPaymentProvider();
      break;
    }
    case 'dummy': {
      if (!allowDummyProvider()) {
        throw new AppError(404, 'UNKNOWN_PROVIDER', 'Dummy payment provider disabled in production');
      }
      provider = new DummyPaymentProvider();
      break;
    }
    default: {
      if (allowDummyProvider()) {
        provider = new DummyPaymentProvider();
        break;
      }
      throw new AppError(404, 'UNKNOWN_PROVIDER', `Unknown payment provider: ${id}`);
    }
  }
  cache.set(id, provider);
  return provider;
}

/** Webhook-only resolver: never falls back to unsigned Dummy in production. */
export function getWebhookPaymentProvider(providerId: string): PaymentProvider {
  const id = String(providerId || '').toLowerCase();
  if (id === 'dummy' && !allowDummyProvider()) {
    throw new AppError(404, 'UNKNOWN_PROVIDER', 'Dummy webhooks are disabled in production');
  }
  if (id === 'polar' && !isPolarConfigured()) {
    throw new AppError(503, 'PAYMENT_NOT_CONFIGURED', 'Polar webhook secret is not configured');
  }
  return getPaymentProvider(id);
}

export function listPaymentProviderMeta(): Array<{
  id: string;
  available: boolean;
  label: string;
}> {
  const dummyAvailable = allowDummyProvider();
  return [
    { id: 'dummy', available: dummyAvailable, label: 'Dummy (mock)' },
    { id: 'toss', available: false, label: 'Toss Payments' },
    { id: 'portone', available: false, label: 'PortOne' },
    { id: 'lemonsqueezy', available: false, label: 'Lemon Squeezy' },
    { id: 'polar', available: isPolarConfigured(), label: 'Polar.sh' },
    { id: 'stripe', available: false, label: 'Stripe' },
    { id: 'google', available: false, label: 'Google Play Billing' },
    { id: 'apple', available: false, label: 'Apple App Store IAP' },
  ];
}
