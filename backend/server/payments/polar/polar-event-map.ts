import type { WebhookEvent } from '../provider.interface.js';

/**
 * Polar webhook type → MachineFit event.
 * Money-in is only order.paid and subscription cycle/renew.
 * order.created and subscription.updated must not grant Premium.
 */
export function mapPolarEventType(type: string): WebhookEvent['type'] {
  switch (type) {
    case 'subscription.created':
      return 'subscription.created';
    case 'subscription.updated':
    case 'subscription.active':
    case 'subscription.uncanceled':
    case 'subscription.resumed':
      return 'subscription.updated';
    case 'subscription.canceled':
      return 'subscription.canceled';
    case 'subscription.revoked':
      return 'subscription.revoked';
    case 'subscription.cycled':
    case 'subscription.renewed':
      return 'subscription.renewed';
    case 'order.paid':
      return 'payment.succeeded';
    case 'order.created':
      return 'unknown';
    case 'order.refunded':
    case 'refund.created':
      return 'payment.refunded';
    case 'order.failed':
    case 'subscription.past_due':
      return 'payment.failed';
    default:
      return 'unknown';
  }
}
