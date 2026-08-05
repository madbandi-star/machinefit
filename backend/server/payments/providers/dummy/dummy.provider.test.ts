import assert from 'node:assert/strict';
import { DummyPaymentProvider } from './dummy.provider.js';

const provider = new DummyPaymentProvider();

const checkout = await provider.createCheckout({
  userId: 'u1',
  planCode: 'PREMIUM',
  amountCents: 9900,
  currency: 'KRW',
  orderId: 'order_1',
});
assert.equal(checkout.ready, false);
assert.equal(checkout.checkoutUrl, null);
assert.equal(checkout.provider, 'dummy');

const sub = await provider.createSubscription({
  userId: 'u1',
  planCode: 'PREMIUM',
  trialDays: 7,
});
assert.ok(sub.providerSubscriptionId.startsWith('dummy_sub_'));

const cancel = await provider.cancelSubscription(sub.providerSubscriptionId);
assert.equal(cancel.ok, true);

const webhook = await provider.verifyWebhook({}, JSON.stringify({
  type: 'payment.succeeded',
  userId: 'u1',
  orderId: 'order_mock_1',
  amountCents: 9900,
  currency: 'KRW',
}));
assert.equal(webhook.ok, true);
assert.equal(webhook.events.length, 1);
assert.equal(webhook.events[0]?.type, 'payment.succeeded');

const bad = await provider.verifyWebhook({}, 'not-json');
assert.equal(bad.ok, false);

console.log('dummy.provider.test.ts: ok');
