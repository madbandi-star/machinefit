import assert from 'node:assert/strict';
import {
  isPointActionCode,
  isPointClientTrackableAction,
  POINT_ACTION_CODES,
  POINT_CLIENT_TRACKABLE_ACTIONS,
} from './points.js';
import { pointClientTrackSchema, adminPointAdjustSchema } from '../validators/points.schema.js';

assert.ok(POINT_ACTION_CODES.includes('workout_log_save'));
assert.ok(isPointActionCode('signup_complete'));
assert.equal(isPointActionCode('not_a_real_action'), false);

for (const code of POINT_CLIENT_TRACKABLE_ACTIONS) {
  assert.ok(isPointClientTrackableAction(code));
}
assert.equal(isPointClientTrackableAction('workout_log_save'), false);

{
  const parsed = pointClientTrackSchema.parse({
    actionCode: 'machine_detail_view',
    referenceId: 'machine-1',
  });
  assert.equal(parsed.actionCode, 'machine_detail_view');
}

assert.throws(() =>
  pointClientTrackSchema.parse({ actionCode: 'workout_log_save' })
);

{
  const parsed = adminPointAdjustSchema.parse({
    userId: '11111111-1111-4111-8111-111111111111',
    points: 50,
    direction: 'grant',
    description: 'event bonus',
  });
  assert.equal(parsed.direction, 'grant');
}

assert.throws(() =>
  adminPointAdjustSchema.parse({
    userId: '11111111-1111-4111-8111-111111111111',
    points: -1,
    direction: 'grant',
    description: 'bad',
  })
);

console.log('points.test.ts: ok');
