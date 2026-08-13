import assert from 'node:assert/strict';
import {
  DEFAULT_BODYWEIGHT_LOAD_FACTOR,
  estimateBodyweightLoadKg,
  isBodyweightMachineCode,
  resolveBodyweightLoadFactor,
} from './bodyweight-load.ts';

assert.equal(isBodyweightMachineCode('BW_PUSH_UP'), true);
assert.equal(isBodyweightMachineCode('HS_CHEST_PRESS'), false);

assert.equal(resolveBodyweightLoadFactor({ machineCode: 'BW_PUSH_UP' }), 0.65);
assert.equal(resolveBodyweightLoadFactor({ machineCode: 'BW_PULL_UP' }), 1);
assert.equal(resolveBodyweightLoadFactor({ machineCode: 'BW_DIPS' }), 0.9);
assert.equal(
  resolveBodyweightLoadFactor({ machineCode: 'BW_PUSH_UP', dbFactor: 0.7 }),
  0.7
);
assert.equal(
  resolveBodyweightLoadFactor({
    machineCode: 'BW_UNKNOWN_MOVE',
    machineType: 'bodyweight',
  }),
  DEFAULT_BODYWEIGHT_LOAD_FACTOR
);
assert.equal(resolveBodyweightLoadFactor({ machineCode: 'HS_LEG_PRESS' }), null);

const push = estimateBodyweightLoadKg(70, 0.65);
assert.equal(push, 45.5);
assert.equal(push! * 10 * 3, 1365);

const pull = estimateBodyweightLoadKg(70, 1);
assert.equal(pull, 70);
assert.equal(pull! * 10 * 3, 2100);

const dips = estimateBodyweightLoadKg(70, 0.9);
assert.equal(dips, 63);
assert.equal(dips! * 10 * 3, 1890);

assert.equal(estimateBodyweightLoadKg(null, 0.65), null);
assert.equal(estimateBodyweightLoadKg(0, 0.65), null);
assert.equal(estimateBodyweightLoadKg(70, 0), null);

console.log('bodyweight-load.test.ts: ok');
