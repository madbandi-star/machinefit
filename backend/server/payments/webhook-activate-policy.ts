import type { WebhookEvent } from './provider.interface.js';

export type PremiumActivateDecision =
  | { activate: true }
  | { activate: false; reason: string };

/**
 * Only a verified paid Polar event may grant/extend Premium.
 * Refunded users need a new order.paid. Withdrawn accounts never reactivate.
 */
export function decidePremiumActivation(input: {
  eventType: WebhookEvent['type'];
  membershipStatus?: string | null;
  accountWithdrawn?: boolean;
}): PremiumActivateDecision {
  if (input.accountWithdrawn) {
    return { activate: false, reason: 'account_withdrawn' };
  }

  if (input.eventType === 'payment.succeeded') {
    return { activate: true };
  }

  if (input.eventType === 'subscription.renewed') {
    if (input.membershipStatus === 'refunded') {
      return { activate: false, reason: 'refund_lock' };
    }
    return { activate: true };
  }

  return { activate: false, reason: 'not_a_paid_event' };
}
