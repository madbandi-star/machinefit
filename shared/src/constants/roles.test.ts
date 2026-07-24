import assert from 'node:assert/strict';
import {
  Role,
  ROLE_LEVEL,
  getRoleLevel,
  hasMinRole,
  lowestRole,
  roleGrantsPremiumPlan,
} from './roles.js';

assert.equal(ROLE_LEVEL[Role.GUEST], 0);
assert.equal(ROLE_LEVEL[Role.ADMIN], 6);
assert.equal(getRoleLevel('unknown'), 0);
assert.equal(hasMinRole(Role.ADMIN, Role.OWNER), true);
assert.equal(hasMinRole(Role.OWNER, Role.ADMIN), false);
assert.equal(hasMinRole(Role.TRAINER, Role.VIP_MEMBER), true);
assert.equal(hasMinRole(Role.MEMBER, Role.PREMIUM_MEMBER), false);
assert.equal(lowestRole([Role.ADMIN, Role.OWNER]), Role.OWNER);
assert.equal(roleGrantsPremiumPlan(Role.ADMIN), true);
assert.equal(roleGrantsPremiumPlan(Role.PREMIUM_MEMBER), true);
assert.equal(roleGrantsPremiumPlan(Role.VIP_MEMBER), true);
assert.equal(roleGrantsPremiumPlan(Role.OWNER), false);
assert.equal(roleGrantsPremiumPlan(Role.TRAINER), false);
assert.equal(roleGrantsPremiumPlan(Role.MEMBER), false);

console.log('roles.test.ts: ok');
