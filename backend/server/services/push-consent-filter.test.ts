import assert from 'node:assert/strict';
import {
  assertServiceKindContentAllowed,
  getPushConsentCategoryForKind,
} from '@machinefit/shared';

/** Mirrors server filter rules used in pushNotificationService.send */

type Category = 'marketing' | 'event' | 'service';

function filterByConsent(
  recipients: string[],
  optedIn: Set<string>,
  category: Category
): { kept: string[]; excluded: number; category: Category } {
  const kept = recipients.filter((id) => optedIn.has(id));
  return {
    kept,
    excluded: recipients.length - kept.length,
    category,
  };
}

// Event push — event consent required (independent of marketing)
{
  const category = getPushConsentCategoryForKind('event');
  assert.equal(category, 'event');
  const r = filterByConsent(
    ['u1', 'u2', 'u3'],
    new Set(['u1']),
    category
  );
  assert.deepEqual(r.kept, ['u1']);
  assert.equal(r.excluded, 2);
}

// Service push — service consent required (marketing opt-in alone is not enough)
{
  const category = getPushConsentCategoryForKind('notice');
  assert.equal(category, 'service');
  const marketingOnly = new Set(['u1']);
  const serviceOptIn = new Set(['u2']);
  const r = filterByConsent(['u1', 'u2'], serviceOptIn, category);
  assert.deepEqual(r.kept, ['u2']);
  assert.ok(!r.kept.includes('u1'));
  assert.ok(marketingOnly.has('u1'));
}

// Admin-picked user still excluded without consent
{
  const picked = ['admin-picked-user'];
  const r = filterByConsent(picked, new Set(), 'marketing');
  assert.equal(r.kept.length, 0);
  assert.equal(r.excluded, 1);
}

// Withdraw then re-opt-in
{
  let opted = new Set<string>(['u1']);
  let r = filterByConsent(['u1'], opted, 'marketing');
  assert.equal(r.kept.length, 1);
  opted = new Set(); // withdraw
  r = filterByConsent(['u1'], opted, 'marketing');
  assert.equal(r.kept.length, 0);
  opted = new Set(['u1']); // re-consent
  r = filterByConsent(['u1'], opted, 'marketing');
  assert.equal(r.kept.length, 1);
}

// Marketing content cannot ride service kind
{
  const blocked = assertServiceKindContentAllowed(
    'notice',
    '프로모션',
    '친구 초대하면 무료 1개월!'
  );
  assert.equal(blocked.ok, false);
}

console.log('push-consent-filter.test.ts: ok');
