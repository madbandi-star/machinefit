import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  resolveFreeWeightLoadMode,
  resolveFreeWeightVolumeMultiplier,
} from './free-weight-load.js';
import { computePerformedTotalWeightKg } from './effective-load.js';

describe('free-weight load semantics', () => {
  it('classifies equipment modes', () => {
    assert.equal(resolveFreeWeightLoadMode('FW_BARBELL'), 'total_bar');
    assert.equal(resolveFreeWeightLoadMode('FW_DUMBBELL'), 'per_hand');
    assert.equal(resolveFreeWeightLoadMode('FW_KETTLEBELL'), 'implement');
    assert.equal(resolveFreeWeightLoadMode('FW_CABLE'), 'stack');
    assert.equal(resolveFreeWeightLoadMode('HS_LEG_PRESS'), null);
  });

  it('doubles dumbbell volume (both hands)', () => {
    assert.equal(resolveFreeWeightVolumeMultiplier('FW_DUMBBELL'), 2);
    assert.equal(
      computePerformedTotalWeightKg({
        setWeightsKg: [20, 20, 20],
        sets: 3,
        recommendedReps: 10,
        machineCode: 'FW_DUMBBELL',
      }),
      1200
    );
    assert.equal(
      computePerformedTotalWeightKg({
        setWeightsKg: [20, 20, 20],
        sets: 3,
        recommendedReps: 10,
        machineCode: 'FW_BARBELL',
      }),
      600
    );
  });
});
