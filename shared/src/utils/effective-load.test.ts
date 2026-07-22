/**
 * Regression tests for adjusted-weight-first total weight calculation.
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
} from './effective-load.js';

describe('getEffectiveWeight', () => {
  it('prefers adjusted when > 0', () => {
    assert.equal(getEffectiveWeight(35, 50), 35);
  });

  it('falls back to recommended when adjusted is null/undefined/0/empty', () => {
    assert.equal(getEffectiveWeight(null, 50), 50);
    assert.equal(getEffectiveWeight(undefined, 50), 50);
    assert.equal(getEffectiveWeight(0, 50), 50);
    assert.equal(getEffectiveWeight(Number.NaN, 50), 50);
  });

  it('returns 0 when both missing', () => {
    assert.equal(getEffectiveWeight(null, null), 0);
    assert.equal(getEffectiveWeight(0, 0), 0);
  });
});

describe('getEffectiveReps', () => {
  it('prefers adjusted when > 0', () => {
    assert.equal(getEffectiveReps(12, 10), 12);
  });

  it('falls back to recommended when adjusted missing', () => {
    assert.equal(getEffectiveReps(null, 10), 10);
    assert.equal(getEffectiveReps(0, 8), 8);
  });
});

describe('computeTotalWeightKg', () => {
  it('computes weight × reps × sets', () => {
    assert.equal(computeTotalWeightKg(35, 10, 10), 3500);
    assert.equal(computeTotalWeightKg(20, 8, 3), 480);
  });

  it('returns 0 when any factor is invalid', () => {
    assert.equal(computeTotalWeightKg(35, 0, 10), 0);
    assert.equal(computeTotalWeightKg(0, 10, 10), 0);
    assert.equal(computeTotalWeightKg(35, 10, 0), 0);
  });
});

describe('computePerformedTotalWeightKg', () => {
  it('uses adjusted weight/reps × sets when no setWeightsKg', () => {
    assert.equal(
      computePerformedTotalWeightKg({
        adjustedWeight: 35,
        recommendedWeight: 50,
        adjustedReps: 10,
        recommendedReps: 12,
        sets: 10,
      }),
      3500
    );
  });

  it('falls back to recommended weight/reps when adjusted absent', () => {
    assert.equal(
      computePerformedTotalWeightKg({
        recommendedWeight: 40,
        recommendedReps: 8,
        sets: 3,
      }),
      960
    );
  });

  it('adjusted weight overrides stale setWeightsKg seeded from AI', () => {
    assert.equal(
      computePerformedTotalWeightKg({
        setWeightsKg: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
        adjustedWeight: 35,
        recommendedWeight: 50,
        adjustedReps: 10,
        recommendedReps: 12,
        sets: 10,
      }),
      3500
    );
  });

  it('changing adjusted weight changes total even when setWeights stay the same', () => {
    const base = {
      setWeightsKg: [50, 50, 50],
      recommendedWeight: 50,
      recommendedReps: 10,
      sets: 3,
    };
    assert.equal(
      computePerformedTotalWeightKg({ ...base, adjustedWeight: 40, adjustedReps: 10 }),
      1200
    );
    assert.equal(
      computePerformedTotalWeightKg({ ...base, adjustedWeight: 60, adjustedReps: 10 }),
      1800
    );
  });

  it('without adjusted weight, uses setWeights × adjusted reps', () => {
    assert.equal(
      computePerformedTotalWeightKg({
        setWeightsKg: [20, 20, 20],
        recommendedReps: 10,
        adjustedReps: 8,
      }),
      480
    );
  });

  it('keeps Σ(setWeights) when reps are missing (legacy compatibility)', () => {
    assert.equal(
      computePerformedTotalWeightKg({
        setWeightsKg: [35, 35, 35, 35, 35, 35, 35, 35, 35, 35],
        sets: 10,
      }),
      350
    );
  });

  it('adjusted weight with completed-set filter uses completed set count', () => {
    assert.equal(
      computePerformedTotalWeightKg({
        setWeightsKg: [40, 40, 40],
        setCompleted: [true, true, false],
        adjustedWeight: 40,
        adjustedReps: 10,
        sets: 3,
      }),
      800
    );
  });

  it('without adjusted weight, only counts completed sets', () => {
    assert.equal(
      computePerformedTotalWeightKg({
        setWeightsKg: [40, 40, 40],
        setCompleted: [true, true, false],
        adjustedReps: 10,
      }),
      800
    );
  });
});

describe('resolveSuggestedWeightKg', () => {
  it('seeds from adjusted when present', () => {
    assert.equal(resolveSuggestedWeightKg(35, 50), 35);
  });

  it('seeds from recommended when adjusted missing', () => {
    assert.equal(resolveSuggestedWeightKg(null, 50), 50);
    assert.equal(resolveSuggestedWeightKg(0, 50), 50);
  });

  it('returns undefined when neither is usable', () => {
    assert.equal(resolveSuggestedWeightKg(null, null), undefined);
  });
});

describe('resolveSessionWorkingWeightKg', () => {
  it('prefers adjusted over setWeights and recommended', () => {
    assert.equal(
      resolveSessionWorkingWeightKg({
        adjustedWeight: 35,
        recommendedWeight: 50,
        setWeightsKg: [50, 50, 50],
      }),
      35
    );
  });

  it('uses max set weight when adjusted absent', () => {
    assert.equal(
      resolveSessionWorkingWeightKg({
        recommendedWeight: 50,
        setWeightsKg: [30, 40, 35],
      }),
      40
    );
  });

  it('falls back to recommended when no adjusted or setWeights', () => {
    assert.equal(
      resolveSessionWorkingWeightKg({
        recommendedWeight: 45,
        sets: 3,
      }),
      45
    );
  });
});

describe('history summary weight vs volume', () => {
  it('working weight and volume differ (weight vs weight×reps×sets)', () => {
    const load = {
      adjustedWeight: 35,
      recommendedWeight: 50,
      adjustedReps: 10,
      recommendedReps: 12,
      sets: 10,
      setWeightsKg: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
    };
    assert.equal(resolveSessionWorkingWeightKg(load), 35);
    assert.equal(computePerformedTotalWeightKg(load), 3500);
    assert.notEqual(resolveSessionWorkingWeightKg(load), computePerformedTotalWeightKg(load));
  });
});
