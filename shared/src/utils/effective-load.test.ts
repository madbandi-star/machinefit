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

  it('multiplies each set weight by effective reps', () => {
    assert.equal(
      computePerformedTotalWeightKg({
        setWeightsKg: [35, 35, 35, 35, 35, 35, 35, 35, 35, 35],
        adjustedWeight: 50,
        recommendedWeight: 50,
        adjustedReps: 10,
        recommendedReps: 12,
        sets: 10,
      }),
      3500
    );
  });

  it('prefers adjusted reps over recommended when multiplying set weights', () => {
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

  it('only counts completed sets when any set is marked complete', () => {
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
