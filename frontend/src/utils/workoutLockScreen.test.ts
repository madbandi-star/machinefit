import assert from 'node:assert/strict';
import { formatRestLockClock } from './workoutLockScreen.js';

assert.equal(formatRestLockClock(0), '0:00');
assert.equal(formatRestLockClock(5), '0:05');
assert.equal(formatRestLockClock(65), '1:05');
assert.equal(formatRestLockClock(90.9), '1:30');

console.log('workoutLockScreen.test.ts: ok');
