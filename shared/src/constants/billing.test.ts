import assert from 'node:assert/strict';
import {
  billingPlanToEntitlement,
  defaultTrialDays,
  hasAdminAccess,
  hasOwnerAccess,
  hasPremiumAccess,
  hasTrainerAccess,
  hasVipAccess,
  isLiveSubscriptionStatus,
} from './billing.js';
import { Role } from './roles.js';

assert.equal(billingPlanToEntitlement('FREE'), 'free');
assert.equal(billingPlanToEntitlement('PREMIUM'), 'premium');
assert.equal(billingPlanToEntitlement('VIP'), 'premium');
assert.equal(billingPlanToEntitlement(null), 'free');

assert.equal(isLiveSubscriptionStatus('ACTIVE'), true);
assert.equal(isLiveSubscriptionStatus('TRIAL'), true);
assert.equal(isLiveSubscriptionStatus('EXPIRED'), false);
assert.equal(isLiveSubscriptionStatus('CANCELED'), false);
assert.equal(isLiveSubscriptionStatus('PAUSED'), false);
assert.equal(isLiveSubscriptionStatus('PENDING'), false);
assert.equal(isLiveSubscriptionStatus('FAILED'), false);

assert.equal(
  hasPremiumAccess({
    entitlementPlan: 'premium',
  }),
  true
);
assert.equal(
  hasPremiumAccess({
    subscriptionStatus: 'TRIAL',
    planCode: 'PREMIUM',
  }),
  true
);
assert.equal(
  hasPremiumAccess({
    subscriptionStatus: 'EXPIRED',
    planCode: 'PREMIUM',
  }),
  false
);
assert.equal(
  hasPremiumAccess({
    roleCode: Role.ADMIN,
  }),
  true
);

assert.equal(
  hasVipAccess({
    planCode: 'VIP',
    subscriptionStatus: 'ACTIVE',
  }),
  true
);
assert.equal(
  hasVipAccess({
    planCode: 'PREMIUM',
    subscriptionStatus: 'ACTIVE',
  }),
  false
);
assert.equal(hasVipAccess({ roleCode: Role.VIP_MEMBER }), true);

assert.equal(hasTrainerAccess(Role.TRAINER), true);
assert.equal(hasTrainerAccess(Role.MEMBER), false);
assert.equal(hasOwnerAccess(Role.OWNER), true);
assert.equal(hasAdminAccess(Role.ADMIN), true);

assert.equal(defaultTrialDays('PREMIUM'), 7);
assert.equal(defaultTrialDays('VIP'), 14);
assert.equal(defaultTrialDays('FREE'), 0);

console.log('billing.test.ts: ok');
