import assert from 'node:assert/strict';
import { mapPolarEventType } from './polar/polar-event-map.js';
import { decidePremiumActivation } from './webhook-activate-policy.js';

function activate(type: string, membershipStatus?: string, withdrawn = false) {
  return decidePremiumActivation({
    eventType: mapPolarEventType(type),
    membershipStatus,
    accountWithdrawn: withdrawn,
  });
}

// Unpaid checkout: order.created must not grant Premium.
assert.equal(activate('order.created').activate, false);
assert.equal(activate('subscription.created').activate, false);
assert.equal(activate('subscription.updated').activate, false);

// Money-in.
assert.equal(activate('order.paid').activate, true);
assert.equal(activate('subscription.cycled').activate, true);

// Refund then later updated/renewed must not restore; a new paid order may.
assert.equal(activate('order.refunded', 'active').activate, false);
assert.equal(activate('subscription.updated', 'refunded').activate, false);
assert.equal(activate('subscription.cycled', 'refunded').activate, false);
assert.equal(activate('order.paid', 'refunded').activate, true);

// Out-of-order: refund then paid (new order) vs paid then refund mapping.
assert.equal(activate('subscription.revoked').activate, false);
assert.equal(activate('subscription.renewed', 'refunded').activate, false);

// Withdrawn account never reactivates, even on order.paid.
assert.equal(activate('order.paid', 'cancelled', true).activate, false);

console.log('polar-webhook-scenarios.test.ts: ok');
