import { UnconfiguredPaymentProvider } from '../stub.provider.js';

/** Google Play Billing adapter — implement when GOOGLE_PLAY_* credentials are available. */
export class GooglePlayPaymentProvider extends UnconfiguredPaymentProvider {
  constructor() {
    super('google');
  }
}
