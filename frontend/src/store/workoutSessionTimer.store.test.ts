import assert from 'node:assert/strict';
import {
  formatWorkoutSessionElapsed,
  formatWorkoutSessionLap,
  getWorkoutSessionElapsedMs,
  useWorkoutSessionTimerStore,
} from './workoutSessionTimer.store';

assert.equal(formatWorkoutSessionElapsed(0), '00:00:00');
assert.equal(formatWorkoutSessionElapsed(1_500), '00:00:01');
assert.equal(formatWorkoutSessionElapsed(90 * 60 * 1000), '01:30:00');

assert.equal(formatWorkoutSessionLap(0), '00:00');
assert.equal(formatWorkoutSessionLap(30_000), '00:30');
assert.equal(formatWorkoutSessionLap(15_000), '00:15');
assert.equal(formatWorkoutSessionLap(28_000), '00:28');
assert.equal(formatWorkoutSessionLap(3661_000), '01:01:01');

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

// Lap split math (pause-aware elapsed): 32s, +15s, +28s → totals 32 / 47 / 75
const t0 = Date.parse('2026-08-11T10:00:00.000Z');
const lap1At = t0 + 32_000;
const lap2At = t0 + 47_000;
const lap3At = t0 + 75_000;

const e1 = getWorkoutSessionElapsedMs(
  { status: 'running', segmentStartedAtMs: t0, accumulatedMs: 0 },
  lap1At
);
assert.equal(e1, 32_000);
assert.equal(e1 - 0, 32_000);

const e2 = getWorkoutSessionElapsedMs(
  { status: 'running', segmentStartedAtMs: t0, accumulatedMs: 0 },
  lap2At
);
assert.equal(e2 - e1, 15_000);

const e3 = getWorkoutSessionElapsedMs(
  { status: 'running', segmentStartedAtMs: t0, accumulatedMs: 0 },
  lap3At
);
assert.equal(e3 - e2, 28_000);
assert.equal(e3, 75_000);

// Pause between laps must not inflate next split
const runStart = Date.parse('2026-08-11T12:00:00.000Z');
const beforePause = Date.parse('2026-08-11T12:00:20.000Z');
const afterLongPause = Date.parse('2026-08-11T12:10:00.000Z');
const afterResumeLap = Date.parse('2026-08-11T12:10:10.000Z');
const elapsedBeforePause = getWorkoutSessionElapsedMs(
  { status: 'running', segmentStartedAtMs: runStart, accumulatedMs: 0 },
  beforePause
);
assert.equal(elapsedBeforePause, 20_000);
const elapsedAfterResume = getWorkoutSessionElapsedMs(
  {
    status: 'running',
    segmentStartedAtMs: afterLongPause,
    accumulatedMs: elapsedBeforePause,
  },
  afterResumeLap
);
assert.equal(elapsedAfterResume, 30_000);
assert.equal(elapsedAfterResume - elapsedBeforePause, 10_000);

// End stores final elapsed for the right-side summary
const endStart = Date.parse('2026-08-11T13:00:00.000Z');
const sessionEndAt = Date.parse('2026-08-11T13:05:30.000Z');
const originalNow = Date.now;
Date.now = () => sessionEndAt;
useWorkoutSessionTimerStore.setState({
  status: 'running',
  segmentStartedAtMs: endStart,
  accumulatedMs: 0,
  lastEndedElapsedMs: null,
  laps: [],
});
useWorkoutSessionTimerStore.getState().end();
const ended = useWorkoutSessionTimerStore.getState();
assert.equal(ended.status, 'idle');
assert.equal(ended.lastEndedElapsedMs, 330_000);
assert.equal(ended.segmentStartedAtMs, null);
assert.equal(ended.accumulatedMs, 0);

// Start clears ended summary
Date.now = () => Date.parse('2026-08-11T13:06:00.000Z');
useWorkoutSessionTimerStore.getState().start();
assert.equal(useWorkoutSessionTimerStore.getState().lastEndedElapsedMs, null);
Date.now = originalNow;

console.log('workoutSessionTimer.store.test.ts: ok');
