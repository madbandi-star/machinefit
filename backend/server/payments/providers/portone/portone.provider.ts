import { UnconfiguredPaymentProvider } from '../stub.provider.js';

/** PortOne (I'mport) adapter — implement when PORTONE_* credentials are available. */
export class PortOnePaymentProvider extends UnconfiguredPaymentProvider {
  constructor() {
    super('portone');
  }
}
