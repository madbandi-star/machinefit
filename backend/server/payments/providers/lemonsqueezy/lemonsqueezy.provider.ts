import { UnconfiguredPaymentProvider } from '../stub.provider.js';

/** Lemon Squeezy adapter — implement when LEMONSQUEEZY_* credentials are available. */
export class LemonSqueezyPaymentProvider extends UnconfiguredPaymentProvider {
  constructor() {
    super('lemonsqueezy');
  }
}
