import { UnconfiguredPaymentProvider } from '../stub.provider.js';

/** Apple App Store IAP adapter — implement when APPLE_IAP_* credentials are available. */
export class ApplePaymentProvider extends UnconfiguredPaymentProvider {
  constructor() {
    super('apple');
  }
}
