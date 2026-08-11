import assert from 'node:assert/strict';
import {
  USAGE_COLUMN_BY_FEATURE,
  USAGE_FEATURE_CODES,
  isUsageFeatureCode,
} from '../constants/usage.js';

assert.ok(USAGE_FEATURE_CODES.includes('exercise_card_create'));
assert.equal(isUsageFeatureCode('exercise_card_create'), true);
assert.equal(isUsageFeatureCode('not_a_real_feature'), false);
assert.equal(USAGE_COLUMN_BY_FEATURE.exercise_card_create, 'exercise_card_create_count');
assert.equal(USAGE_COLUMN_BY_FEATURE.insight_lifter_dna, undefined);

console.log('usage constants ok');
