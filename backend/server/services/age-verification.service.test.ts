import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AppError } from '../middlewares/error.middleware.js';
import { assertPlatformAgeEligible } from './age-verification.service.js';

function atKst(ymd: string, hms: string): Date {
  return new Date(`${ymd}T${hms}+09:00`);
}

describe('assertPlatformAgeEligible', () => {
  it('returns self_declared age when 14+ in KST', () => {
    const result = assertPlatformAgeEligible('2012-08-11', atKst('2026-08-11', '00:00:00'));
    assert.equal(result.ageYears, 14);
    assert.equal(result.method, 'self_declared');
  });

  it('throws AGE_RESTRICTED without creating an eligible result when under 14', () => {
    try {
      assertPlatformAgeEligible('2012-08-12', atKst('2026-08-11', '12:00:00'));
      assert.fail('expected AGE_RESTRICTED');
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.equal(err.code, 'AGE_RESTRICTED');
      assert.equal(err.statusCode, 403);
      assert.equal(err.message.includes('2012'), false);
    }
  });

  it('throws VALIDATION_ERROR for invalid calendar dates', () => {
    try {
      assertPlatformAgeEligible('2012-02-30', atKst('2026-08-11', '12:00:00'));
      assert.fail('expected VALIDATION_ERROR');
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.equal(err.code, 'VALIDATION_ERROR');
      assert.equal(err.statusCode, 400);
    }
  });
});
