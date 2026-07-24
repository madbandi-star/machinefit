import assert from 'node:assert/strict';
import {
  buildCountPaceSchedule,
  resolveTurboCount,
  DEFAULT_VOICE_COUNT_MODE,
} from './aiCountPace.js';

assert.equal(DEFAULT_VOICE_COUNT_MODE, 'ai_accel_turbo');

assert.equal(resolveTurboCount(10), 3);
assert.equal(resolveTurboCount(30), 5);
assert.equal(resolveTurboCount(45), 8);
assert.equal(resolveTurboCount(60), 10);
assert.ok(resolveTurboCount(90) >= Math.round(90 * 0.15));
assert.ok(resolveTurboCount(90) <= Math.round(90 * 0.2));
assert.ok(resolveTurboCount(120) >= Math.round(120 * 0.15));
assert.ok(resolveTurboCount(120) <= Math.round(120 * 0.2));

function assertNonIncreasingGaps(gaps: number[]) {
  for (let i = 1; i < gaps.length; i += 1) {
    assert.ok(
      gaps[i] <= gaps[i - 1] + 1,
      `gap rose abruptly at ${i}: ${gaps[i - 1]} → ${gaps[i]}`
    );
  }
}

for (const total of [10, 30, 45, 60, 90, 120]) {
  const normal = buildCountPaceSchedule({
    totalCounts: total,
    baseGapMs: 2000,
    mode: 'normal',
  });
  assert.equal(normal.length, total);
  assert.ok(normal.every((s) => !s.turbo));
  assert.ok(normal.slice(0, -1).every((s) => s.gapAfterMs === 2000));

  const accel = buildCountPaceSchedule({
    totalCounts: total,
    baseGapMs: 2000,
    mode: 'ai_accel',
  });
  assert.equal(accel.length, total);
  assert.ok(accel.every((s) => !s.turbo));
  assertNonIncreasingGaps(accel.slice(0, -1).map((s) => s.gapAfterMs));
  assert.ok(accel[0].gapAfterMs >= accel[accel.length - 2]?.gapAfterMs);

  const turbo = buildCountPaceSchedule({
    totalCounts: total,
    baseGapMs: 2000,
    mode: 'ai_accel_turbo',
  });
  const turboN = resolveTurboCount(total);
  const turboSteps = turbo.filter((s) => s.turbo);
  assert.equal(turboSteps.length, turboN);
  assert.ok(turbo[turbo.length - 1].turbo || turboN === 0);
  // Turbo gaps should be shorter than early accel gaps
  if (total >= 10) {
    assert.ok(turbo[0].gapAfterMs >= turbo[turbo.length - 2].gapAfterMs);
    assert.ok(turbo[turbo.length - 2].gapAfterMs < turbo[0].gapAfterMs);
  }
}

console.log('aiCountPace.test.ts: ok');
