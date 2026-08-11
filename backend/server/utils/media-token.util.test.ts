import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AppError } from '../middlewares/error.middleware.js';
import { assertMediaAccess, signMediaAccess } from './media-token.util.js';

describe('media access tokens', () => {
  it('accepts a fresh signature and rejects a wrong sig', () => {
    const { exp, sig } = signMediaAccess('photo', 'img-1');
    assert.doesNotThrow(() => assertMediaAccess('photo', 'img-1', String(exp), sig));
    try {
      assertMediaAccess('photo', 'img-1', String(exp), 'deadbeef');
      assert.fail('expected UNAUTHORIZED');
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 401);
    }
  });

  it('rejects expired tokens', () => {
    try {
      assertMediaAccess('photo', 'img-1', '1', '00');
      assert.fail('expected UNAUTHORIZED');
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.equal(err.code, 'UNAUTHORIZED');
    }
  });
});
