import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  STANDARD_MACHINE_COACHING,
  resolveStandardMachineCoaching,
} from './standard-machine-coaching.js';
import { STANDARD_MACHINE_FIT_POSITIONS } from './standard-machine-fit.js';

describe('STANDARD_MACHINE_COACHING', () => {
  it('covers all 80 standard types with 3 warnings and 6 tips', () => {
    const codes = Object.keys(STANDARD_MACHINE_COACHING);
    assert.equal(codes.length, 80);
    for (const code of Object.keys(STANDARD_MACHINE_FIT_POSITIONS)) {
      const row = STANDARD_MACHINE_COACHING[code];
      assert.ok(row, `missing coaching for ${code}`);
      assert.equal(row.warnings.ko.length, 3, `${code} ko warnings`);
      assert.equal(row.warnings.en.length, 3, `${code} en warnings`);
      assert.equal(row.tips.ko.length, 6, `${code} ko tips`);
      assert.equal(row.tips.en.length, 6, `${code} en tips`);
    }
  });

  it('resolves branded machine codes to the standard type', () => {
    const row = resolveStandardMachineCoaching('CYBEX_CHEST_PRESS', 'STD_CHEST_PRESS');
    assert.equal(row?.warnings.ko[0], '시트를 조절해 손잡이가 가슴 중간 높이에 오도록 한다.');
  });
});
