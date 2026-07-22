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

  it('falls back to adjusted then recommended when no setWeights', () => {
    assert.equal(
      resolveSessionWorkingWeightKg({
        adjustedWeight: 35,
        recommendedWeight: 50,
      }),
      35
    );
  });
});

describe('resolveSuggestedWeightKg', () => {
  it('seeds from adjusted when present', () => {
    assert.equal(resolveSuggestedWeightKg(35, 50), 35);
  });
});

describe('history summary weight vs volume', () => {
  it('working weight and volume differ when steppers + reps exist', () => {
    const load = {
      setWeightsKg: [35, 35, 35, 35, 35, 35, 35, 35, 35, 35],
      adjustedReps: 10,
      sets: 10,
    };
    assert.equal(resolveSessionWorkingWeightKg(load), 35);
    assert.equal(computePerformedTotalWeightKg(load), 3500);
    assert.notEqual(resolveSessionWorkingWeightKg(load), computePerformedTotalWeightKg(load));
  });
});
