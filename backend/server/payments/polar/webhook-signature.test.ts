import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyPolarWebhookSignature } from './webhook-signature.js';

const secret = 'whsec_' + Buffer.from('test-secret-key-bytes!!').toString('base64');
const body = '{"type":"order.paid","data":{}}';
const id = 'msg_test_1';
const timestamp = String(Math.floor(Date.now() / 1000));
const key = Buffer.from(secret.slice('whsec_'.length), 'base64');
const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`, 'utf8').digest('base64');

const ok = verifyPolarWebhookSignature(
  secret,
  {
    'webhook-id': id,
    'webhook-timestamp': timestamp,
    'webhook-signature': `v1,${expected}`,
  },
  body
);
assert.equal(ok.ok, true);

const bad = verifyPolarWebhookSignature(
  secret,
  {
    'webhook-id': id,
    'webhook-timestamp': timestamp,
    'webhook-signature': 'v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  },
  body
);
assert.equal(bad.ok, false);

console.log('webhook-signature.test.ts: ok');
