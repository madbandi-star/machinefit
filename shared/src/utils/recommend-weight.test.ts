import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  nextBodyweightRecommendKg,
  nextRecommendWeightKg,
  roundRecommendWeightKg,
  snapRecommendWeightKg,
} from './recommend-weight.js';

describe('roundRecommendWeightKg', () => {
  it('snaps up to 5 kg plates', () => {
    assert.equal(roundRecommendWeightKg(1), 5);
    assert.equal(roundRecommendWeightKg(28.5), 30);
    assert.equal(roundRecommendWeightKg(45.5), 50);
  });
});

describe('snapRecommendWeightKg', () => {
  it('preserves bodyweight estimated precision', () => {
    assert.equal(snapRecommendWeightKg(45.5, { bodyweightEstimated: true }), 45.5);
    assert.equal(snapRecommendWeightKg(45.5, { bodyweightEstimated: false }), 50);
  });
});

describe('nextRecommendWeightKg', () => {
  it('adds one plate step', () => {
    assert.equal(nextRecommendWeightKg(40), 45);
    assert.equal(nextRecommendWeightKg(0), 20);
  });
});

describe('nextBodyweightRecommendKg', () => {
  it('adds 1 kg without plate snap', () => {
    assert.equal(nextBodyweightRecommendKg(45.5), 46.5);
    assert.equal(nextBodyweightRecommendKg(70), 71);
  });
});
