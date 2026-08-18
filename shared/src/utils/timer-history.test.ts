import assert from 'node:assert/strict';
import {
  assignMarksToLaps,
  buildTimerHistoryLaps,
  msToDurationSeconds,
} from './timer-history.js';

assert.equal(msToDurationSeconds(0), 0);
assert.equal(msToDurationSeconds(499), 0);
assert.equal(msToDurationSeconds(500), 1);
assert.equal(msToDurationSeconds(1_500), 2);
assert.equal(msToDurationSeconds(90 * 60 * 1000), 5400);

const start = Date.parse('2026-08-18T10:12:00.000Z');
const lap1At = Date.parse('2026-08-18T10:24:31.000Z');
const lap2At = Date.parse('2026-08-18T10:35:13.000Z');
const endAt = Date.parse('2026-08-18T11:38:00.000Z');

const built = buildTimerHistoryLaps({
  sessionStartedAtMs: start,
  endedAtMs: endAt,
  durationMs: 5160_000,
  laps: [
    { index: 2, splitMs: 642_000, totalElapsedMs: 1393_000, recordedAtMs: lap2At },
    { index: 1, splitMs: 751_000, totalElapsedMs: 751_000, recordedAtMs: lap1At },
  ],
});

assert.equal(built.length, 3);
assert.equal(built[0].lapNumber, 1);
assert.equal(built[0].startedAtMs, start);
assert.equal(built[0].endedAtMs, lap1At);
assert.equal(built[0].durationSeconds, 751);
assert.equal(built[1].lapNumber, 2);
assert.equal(built[1].startedAtMs, lap1At);
assert.equal(built[2].lapNumber, 3);
assert.equal(built[2].endedAtMs, endAt);
assert.ok(built[2].durationSeconds > 0);

const noLaps = buildTimerHistoryLaps({
  sessionStartedAtMs: start,
  endedAtMs: endAt,
  durationMs: 60_000,
  laps: [],
});
assert.equal(noLaps.length, 1);
assert.equal(noLaps[0].durationSeconds, 60);

const marks = assignMarksToLaps(built, [
  { recordedAtMs: start + 60_000, machineCode: 'chest' },
  { recordedAtMs: lap1At + 10_000, machineCode: 'incline' },
  { recordedAtMs: endAt - 5_000, machineCode: 'lat' },
]);
assert.equal(marks.get(1)?.[0]?.machineCode, 'chest');
assert.equal(marks.get(2)?.[0]?.machineCode, 'incline');
assert.equal(marks.get(3)?.[0]?.machineCode, 'lat');

console.log('timer-history.test.ts: ok');
