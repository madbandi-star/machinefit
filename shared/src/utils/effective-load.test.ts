/**
 * Regression tests for workout-log seed weight + totals from steppers.
 * Run: node --import tsx --test shared/src/utils/effective-load.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  computePerformedTotalWeightKg,
  computeTotalWeightKg,
  getEffectiveReps,
  getEffectiveWeight,
  resolveSessionAverageWeightKg,
  resolveSessionWorkingWeightKg,
  resolveSuggestedWeightKg,
  resolveWorkoutLogSeedWeightKg,
} from './effective-load.js';

describe('getEffectiveWeight', () => {
  it('prefers adjusted when > 0', () => {
    assert.equal(getEffectiveWeight(35, 50), 35);
  });

  it('falls back to recommended when adjusted is null/undefined/0/empty', () => {
    assert.equal(getEffectiveWeight(null, 50), 50);
    assert.equal(getEffectiveWeight(undefined, 50), 50);
    assert.equal(getEffectiveWeight(0, 50), 50);
  });
});

describe('getEffectiveReps', () => {
  it('prefers adjusted when > 0', () => {
    assert.equal(getEffectiveReps(12, 10), 12);
  });
});

describe('computeTotalWeightKg', () => {
  it('computes weight × reps × sets', () => {
    assert.equal(computeTotalWeightKg(35, 10, 10), 3500);
  });
});

describe('resolveWorkoutLogSeedWeightKg', () => {
  it('uses recommended for good rating', () => {
    assert.equal(
      resolveWorkoutLogSeedWeightKg({
        fitRating: 'good',
        adjustedWeight: 35,
        recommendedWeight: 50,
      }),
      50
    );
  });

  it('uses recommended when unselected (null)', () => {
    assert.equal(
      resolveWorkoutLogSeedWeightKg({
        fitRating: null,
        adjustedWeight: 35,
        recommendedWeight: 50,
      }),
      50
    );
  });

  it('uses adjusted for bad rating when adjusted exists', () => {
    assert.equal(
      resolveWorkoutLogSeedWeightKg({
        fitRating: 'bad',
        adjustedWeight: 35,
        recommendedWeight: 50,
      }),
      35
    );
  });

  it('falls back to recommended for bad rating without adjusted', () => {
    assert.equal(
      resolveWorkoutLogSeedWeightKg({
        fitRating: 'bad',
        adjustedWeight: null,
        recommendedWeight: 50,
      }),
      50
    );
  });
});

describe('computePerformedTotalWeightKg from steppers', () => {
  it('uses setWeights × reps even when adjusted differs', () => {
    assert.equal(
      computePerformedTotalWeightKg({
        setWeightsKg: [35, 35, 35, 35, 35, 35, 35, 35, 35, 35],
        adjustedWeight: 99,
        recommendedWeight: 50,
        adjustedReps: 10,
        sets: 10,
      }),
      3500
    );
  });

  it('falls back to seed × reps × sets when no setWeights', () => {
    assert.equal(
      computePerformedTotalWeightKg({
        adjustedWeight: 35,
        recommendedWeight: 50,
        adjustedReps: 10,
        sets: 3,
      }),
      1050
    );
  });

  it('keeps Σ(setWeights) when reps missing', () => {
    assert.equal(
      computePerformedTotalWeightKg({
        setWeightsKg: [35, 35, 35, 35, 35, 35, 35, 35, 35, 35],
        sets: 10,
      }),
      350
    );
  });
});

describe('resolveSessionAverageWeightKg', () => {
  it('uses floor(sum / setCount) per log', () => {
    assert.equal(
      resolveSessionAverageWeightKg({
        setWeightsKg: [40, 45, 50],
        sets: 3,
      }),
      45
    );
  });

  it('truncates decimals', () => {
    assert.equal(
      resolveSessionAverageWeightKg({
        setWeightsKg: [20, 25, 25],
        sets: 3,
      }),
      23
    );
  });

  it('only averages completed sets when any are marked complete', () => {
    assert.equal(
      resolveSessionAverageWeightKg({
        setWeightsKg: [40, 50, 60],
        setCompleted: [true, true, false],
        sets: 3,
      }),
      45
    );
  });
});

describe('resolveSessionWorkingWeightKg from steppers', () => {
  it('uses max set weight over adjusted preference', () => {
    assert.equal(
      resolveSessionWorkingWeightKg({
        adjustedWeight: 99,
        recommendedWeight: 50,
        setWeightsKg: [30, 40, 35],
      }),
      40
    );
  });
});

describe('history summary weight vs volume', () => {
  it('average working weight and volume differ when steppers + reps exist', () => {
    const load = {
      setWeightsKg: [35, 35, 35, 35, 35, 35, 35, 35, 35, 35],
      adjustedReps: 10,
      sets: 10,
    };
    assert.equal(resolveSessionAverageWeightKg(load), 35);
    assert.equal(computePerformedTotalWeightKg(load), 3500);
    assert.notEqual(resolveSessionAverageWeightKg(load), computePerformedTotalWeightKg(load));
  });

  it('sums per-log averages across logs', () => {
    const a = resolveSessionAverageWeightKg({ setWeightsKg: [40, 45, 50], sets: 3 });
    const b = resolveSessionAverageWeightKg({ setWeightsKg: [20, 25, 25], sets: 3 });
    assert.equal(a + b, 45 + 23);
  });
});
