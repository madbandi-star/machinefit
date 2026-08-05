import { env } from '../config/env.js';
import type { PaymentProvider } from './provider.interface.js';
import { DummyPaymentProvider } from './providers/dummy/dummy.provider.js';

const cache = new Map<string, PaymentProvider>();

/**
 * Resolve payment provider from PAYMENT_PROVIDER env (or explicit id for webhooks).
 * Unknown / unconfigured ids fall back to dummy so local/dev never charges.
 */
export function getPaymentProvider(providerId?: string): PaymentProvider {
  const id = String(providerId || env.PAYMENT_PROVIDER || 'dummy').toLowerCase();
  const cached = cache.get(id);
  if (cached) return cached;

  let provider: PaymentProvider;
  switch (id) {
    case 'dummy':
      provider = new DummyPaymentProvider();
      break;
    // Future: case 'toss': provider = new TossPaymentProvider(); break;
    // Future: case 'portone': ...
    default:
      // Safe default — never instantiate unconfigured live PGs
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
    { id: 'polar', available: false, label: 'Polar.sh' },
    { id: 'stripe', available: false, label: 'Stripe' },
    { id: 'google', available: false, label: 'Google Play Billing' },
    { id: 'apple', available: false, label: 'Apple App Store IAP' },
  ];
}
