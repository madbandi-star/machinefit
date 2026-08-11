import assert from 'node:assert/strict';
import {
  formatWorkoutSessionElapsed,
  getWorkoutSessionElapsedMs,
} from './workoutSessionTimer.store';

assert.equal(formatWorkoutSessionElapsed(0), '00:00:00');
assert.equal(formatWorkoutSessionElapsed(1_500), '00:00:01');
assert.equal(formatWorkoutSessionElapsed(90 * 60 * 1000), '01:30:00');

// start 10:00, pause 10:30 → 30m accumulated; resume 11:00, end 12:00 → +60m = 90m
const start = Date.parse('2026-08-11T10:00:00.000Z');
const pauseAt = Date.parse('2026-08-11T10:30:00.000Z');
const resumeAt = Date.parse('2026-08-11T11:00:00.000Z');
const endAt = Date.parse('2026-08-11T12:00:00.000Z');

const afterFirstSegment = getWorkoutSessionElapsedMs(
  { status: 'running', segmentStartedAtMs: start, accumulatedMs: 0 },
  pauseAt
);
assert.equal(afterFirstSegment, 30 * 60 * 1000);

const whilePaused = getWorkoutSessionElapsedMs(
  { status: 'paused', segmentStartedAtMs: null, accumulatedMs: afterFirstSegment },
  resumeAt
);
assert.equal(whilePaused, 30 * 60 * 1000);

const afterResume = getWorkoutSessionElapsedMs(
  {
    status: 'running',
    segmentStartedAtMs: resumeAt,
    accumulatedMs: afterFirstSegment,
  },
  endAt
);
assert.equal(afterResume, 90 * 60 * 1000);
assert.equal(formatWorkoutSessionElapsed(afterResume), '01:30:00');

console.log('workoutSessionTimer.store.test.ts: ok');
