import { env } from '../config/env.js';
import type { PaymentProvider } from './provider.interface.js';
import { DummyPaymentProvider } from './providers/dummy/dummy.provider.js';
import { PolarPaymentProvider } from './providers/polar/polar.provider.js';

const cache = new Map<string, PaymentProvider>();

export function isPolarConfigured(): boolean {
  return Boolean(env.POLAR_ACCESS_TOKEN?.trim() && env.POLAR_WEBHOOK_SECRET?.trim());
}

/**
 * Resolve payment provider from PAYMENT_PROVIDER env (or explicit id for webhooks).
 * Polar is only instantiated when credentials exist; otherwise falls back to dummy.
 */
export function getPaymentProvider(providerId?: string): PaymentProvider {
  const id = String(providerId || env.PAYMENT_PROVIDER || 'dummy').toLowerCase();
  const cached = cache.get(id);
  if (cached) return cached;

  let provider: PaymentProvider;
  switch (id) {
    case 'polar':
      provider = isPolarConfigured() ? new PolarPaymentProvider() : new DummyPaymentProvider();
      break;
    case 'dummy':
      provider = new DummyPaymentProvider();
      break;
    default:
      provider = new DummyPaymentProvider();
      break;
  }
  cache.set(id, provider);
  return provider;
}

export function listPaymentProviderMeta(): Array<{
  id: string;
  available: boolean;
  label: string;
}> {
  return [
    { id: 'dummy', available: true, label: 'Dummy (mock)' },
    { id: 'toss', available: false, label: 'Toss Payments' },
    { id: 'portone', available: false, label: 'PortOne' },
    { id: 'lemonsqueezy', available: false, label: 'Lemon Squeezy' },
    { id: 'polar', available: isPolarConfigured(), label: 'Polar.sh' },
    { id: 'stripe', available: false, label: 'Stripe' },
    { id: 'google', available: false, label: 'Google Play Billing' },
    { id: 'apple', available: false, label: 'Apple App Store IAP' },
  ];
}
