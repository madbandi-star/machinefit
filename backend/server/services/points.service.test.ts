import assert from 'node:assert/strict';
import { buildIdempotencyKey, policyInWindow } from './points.service.js';
import type { PointPolicy } from '@machinefit/shared';

{
  const key = buildIdempotencyKey({
    userId: 'u1',
    actionCode: 'workout_log_save',
    referenceType: 'workout_log',
    referenceId: 'log-1',
  });
  assert.equal(key, 'workout_log_save:workout_log:log-1');
}

{
  const key = buildIdempotencyKey({
    userId: 'u1',
    actionCode: 'workout_log_save',
    referenceType: 'workout_log',
    referenceId: 'log-1',
    idempotencyKey: 'custom-key',
  });
  assert.equal(key, 'custom-key');
}

{
  const sameA = buildIdempotencyKey({
    userId: 'u1',
    actionCode: 'community_like',
    referenceType: 'post',
    referenceId: 'p1',
  });
  const sameB = buildIdempotencyKey({
    userId: 'u2',
    actionCode: 'community_like',
    referenceType: 'post',
    referenceId: 'p1',
  });
  // Same event identity for a given action+ref (user scoping is in DB unique index).
  assert.equal(sameA, sameB);
}

const basePolicy: PointPolicy = {
  id: 'p1',
  actionCode: 'workout_complete',
  actionName: '운동 완료',
  points: 20,
  dailyLimit: 10,
  userLimit: null,
  cooldownSeconds: 5,
  enabled: true,
  startAt: null,
  endAt: null,
  description: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

assert.equal(policyInWindow(basePolicy), true);

assert.equal(
  policyInWindow({
    ...basePolicy,
    startAt: new Date(Date.now() + 60_000).toISOString(),
  }),
  false
);

assert.equal(
  policyInWindow({
    ...basePolicy,
    endAt: new Date(Date.now() - 60_000).toISOString(),
  }),
  false
);

console.log('points.service.test.ts: ok');
