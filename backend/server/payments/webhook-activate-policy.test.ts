import assert from 'node:assert/strict';
import { decidePremiumActivation } from './webhook-activate-policy.js';

assert.deepEqual(decidePremiumActivation({ eventType: 'payment.succeeded' }), {
  activate: true,
});
assert.equal(
  decidePremiumActivation({ eventType: 'subscription.updated' }).activate,
  false
);
assert.equal(
  decidePremiumActivation({ eventType: 'subscription.created' }).activate,
  false
);
assert.equal(
  decidePremiumActivation({
    eventType: 'subscription.renewed',
    membershipStatus: 'refunded',
  }).activate,
  false
);
assert.deepEqual(
  decidePremiumActivation({
    eventType: 'subscription.renewed',
    membershipStatus: 'active',
  }),
  { activate: true }
);
assert.equal(
  decidePremiumActivation({
    eventType: 'payment.succeeded',
    accountWithdrawn: true,
  }).activate,
  false
);
assert.equal(
  decidePremiumActivation({
    eventType: 'payment.succeeded',
    membershipStatus: 'refunded',
  }).activate,
  true
);

console.log('webhook-activate-policy.test.ts: ok');
