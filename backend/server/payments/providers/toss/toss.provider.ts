import { UnconfiguredPaymentProvider } from '../stub.provider.js';

/** Toss Payments adapter — implement when TOSS_* credentials are available. */
export class TossPaymentProvider extends UnconfiguredPaymentProvider {
  constructor() {
    super('toss');
  }
}
