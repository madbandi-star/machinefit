/**
 * Auth matrix for role-based push audiences.
 * Run: `cd backend && npx tsx server/services/push-audience.service.test.ts`
 */
import assert from 'node:assert/strict';
import { Role, PUSH_AUDIENCE_TYPES, type PushAudienceType } from '@machinefit/shared';
import {
  authorizeAudienceType,
  filterRecipients,
  getPushComposeMeta,
  isMemberTierRole,
  ownerMayTargetGym,
  PUSH_CAPS,
} from './push-audience.service.js';

// --- compose meta / caps ---
assert.equal(getPushComposeMeta(Role.GUEST).canCompose, false);
assert.equal(getPushComposeMeta(Role.GUEST).maxRecipients, 0);

assert.equal(getPushComposeMeta(Role.MEMBER).canCompose, true);
assert.deepEqual(getPushComposeMeta(Role.MEMBER).allowedAudienceTypes, ['member_exact']);
assert.equal(getPushComposeMeta(Role.MEMBER).maxRecipients, PUSH_CAPS.member);

assert.equal(getPushComposeMeta(Role.PREMIUM_MEMBER).maxRecipients, PUSH_CAPS.member);
assert.equal(getPushComposeMeta(Role.VIP_MEMBER).maxRecipients, PUSH_CAPS.member);

assert.deepEqual(getPushComposeMeta(Role.TRAINER).allowedAudienceTypes, [
  'trainer_clients',
  'user_ids',
]);
assert.equal(getPushComposeMeta(Role.TRAINER).maxRecipients, PUSH_CAPS.trainer);

assert.deepEqual(getPushComposeMeta(Role.OWNER).allowedAudienceTypes, [
  'owner_gym_trainers',
  'owner_gym_members',
  'user_ids',
  'gym',
]);
assert.equal(getPushComposeMeta(Role.OWNER).maxRecipients, PUSH_CAPS.owner);

assert.deepEqual(
  getPushComposeMeta(Role.ADMIN).allowedAudienceTypes,
  [...PUSH_AUDIENCE_TYPES]
);
assert.equal(getPushComposeMeta(Role.ADMIN).maxRecipients, PUSH_CAPS.admin);

// --- authorizeAudienceType matrix ---
assert.equal(authorizeAudienceType(Role.MEMBER, 'all_users'), false);
assert.equal(authorizeAudienceType(Role.MEMBER, 'member_exact'), true);
assert.equal(authorizeAudienceType(Role.PREMIUM_MEMBER, 'all_users'), false);
assert.equal(authorizeAudienceType(Role.VIP_MEMBER, 'trainer_clients'), false);

assert.equal(authorizeAudienceType(Role.TRAINER, 'all_users'), false);
assert.equal(authorizeAudienceType(Role.TRAINER, 'owner_gym_members'), false);
assert.equal(authorizeAudienceType(Role.TRAINER, 'trainer_clients'), true);
assert.equal(authorizeAudienceType(Role.TRAINER, 'user_ids'), true);

assert.equal(authorizeAudienceType(Role.OWNER, 'all_users'), false);
assert.equal(authorizeAudienceType(Role.OWNER, 'gym'), true);
assert.equal(authorizeAudienceType(Role.OWNER, 'owner_gym_trainers'), true);
assert.equal(authorizeAudienceType(Role.OWNER, 'user_ids'), true);
assert.equal(authorizeAudienceType(Role.OWNER, 'member_exact'), false);

assert.equal(authorizeAudienceType(Role.ADMIN, 'all_users'), true);
assert.equal(authorizeAudienceType(Role.ADMIN, 'location'), true);
assert.equal(authorizeAudienceType(Role.ADMIN, 'member_exact'), true);

assert.equal(authorizeAudienceType(Role.GUEST, 'member_exact'), false);

// Member cannot use all_users (explicit product rule)
{
  const memberMeta = getPushComposeMeta(Role.MEMBER);
  assert.equal(memberMeta.allowedAudienceTypes.includes('all_users'), false);
  assert.equal(authorizeAudienceType(Role.MEMBER, 'all_users'), false);
}

// Trainer cannot target staff via filterRecipients + role gate (admin id not in clients)
{
  const trainerId = 'trainer-1';
  const clientId = 'client-1';
  const adminId = 'admin-1';
  const clientSet = new Set([clientId]);
  const { allowed, skipped } = filterRecipients(
    trainerId,
    [clientId, adminId, trainerId, clientId],
    { allowedIds: clientSet, maxRecipients: PUSH_CAPS.trainer }
  );
  assert.deepEqual(allowed, [clientId]);
  assert.equal(skipped, 3); // admin, self, duplicate
  assert.equal(allowed.includes(adminId), false);
}

// Owner cannot target foreign gymId
{
  const owned = ['gym-owned-1', 'gym-owned-2'];
  assert.equal(ownerMayTargetGym(owned, 'gym-owned-1'), true);
  assert.equal(ownerMayTargetGym(owned, 'gym-foreign'), false);
  // Service throws FORBIDDEN when this gate fails for type=gym / owner_* with gymId
  assert.equal(authorizeAudienceType(Role.OWNER, 'gym'), true);
}

// Owner scoped: foreign gym users dropped when allowedIds is owned-gym set
{
  const ownerId = 'owner-1';
  const ownedMember = 'member-owned';
  const foreignMember = 'member-foreign';
  const ownedSet = new Set([ownedMember]);
  const { allowed } = filterRecipients(
    ownerId,
    [ownedMember, foreignMember],
    { allowedIds: ownedSet, maxRecipients: PUSH_CAPS.owner }
  );
  assert.deepEqual(allowed, [ownedMember]);
  assert.equal(allowed.includes(foreignMember), false);
}

// Owner cannot use admin-only audience types (foreign gym targeting is service-level;
// type gate still blocks all_users / location)
assert.equal(authorizeAudienceType(Role.OWNER, 'location'), false);
assert.equal(authorizeAudienceType(Role.OWNER, 'role'), false);

// Caps respected
{
  const ids = Array.from({ length: 5 }, (_, i) => `u${i}`);
  const { allowed, skipped } = filterRecipients('sender', ids, {
    maxRecipients: 2,
  });
  assert.equal(allowed.length, 2);
  assert.equal(skipped, 3);
}

// Member-tier helpers
assert.equal(isMemberTierRole(Role.MEMBER), true);
assert.equal(isMemberTierRole(Role.TRAINER), false);
assert.equal(isMemberTierRole(Role.ADMIN), false);

// Owner elevated above trainer: owner meta (not trainer meta)
{
  // hasMinRole(owner, owner) → owner capabilities even if they could train
  const ownerTypes = new Set(getPushComposeMeta(Role.OWNER).allowedAudienceTypes);
  assert.equal(ownerTypes.has('trainer_clients'), false);
  assert.equal(ownerTypes.has('owner_gym_members'), true);
}

// Exhaustive: every audience type is authorized for at least admin
for (const t of PUSH_AUDIENCE_TYPES as readonly PushAudienceType[]) {
  assert.equal(authorizeAudienceType(Role.ADMIN, t), true, t);
}

console.log('push-audience.service.test.ts: ok');
