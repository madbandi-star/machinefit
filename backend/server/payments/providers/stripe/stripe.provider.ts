import { UnconfiguredPaymentProvider } from '../stub.provider.js';

/** Stripe adapter — implement when STRIPE_* credentials are available. */
export class StripePaymentProvider extends UnconfiguredPaymentProvider {
  constructor() {
    super('stripe');
  }
}
