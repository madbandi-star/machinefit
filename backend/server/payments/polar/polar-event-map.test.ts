import assert from 'node:assert/strict';
import { mapPolarEventType } from './polar-event-map.js';

assert.equal(mapPolarEventType('order.paid'), 'payment.succeeded');
assert.equal(mapPolarEventType('order.created'), 'unknown');
assert.equal(mapPolarEventType('subscription.updated'), 'subscription.updated');
assert.equal(mapPolarEventType('subscription.active'), 'subscription.updated');
assert.equal(mapPolarEventType('subscription.created'), 'subscription.created');
assert.equal(mapPolarEventType('subscription.cycled'), 'subscription.renewed');
assert.equal(mapPolarEventType('subscription.renewed'), 'subscription.renewed');
assert.equal(mapPolarEventType('order.refunded'), 'payment.refunded');
assert.equal(mapPolarEventType('subscription.revoked'), 'subscription.revoked');

console.log('polar-event-map.test.ts: ok');
