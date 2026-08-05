import { UnconfiguredPaymentProvider } from '../stub.provider.js';

/** Polar.sh adapter — implement when POLAR_* credentials are available. */
export class PolarPaymentProvider extends UnconfiguredPaymentProvider {
  constructor() {
    super('polar');
  }
}
