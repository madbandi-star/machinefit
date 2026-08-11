import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { AppError } from '../middlewares/error.middleware.js';
import { assertCsrfOrigin } from './csrf-origin.util.js';

function fakeReq(headers: Record<string, string>): Request {
  return {
    get: (name: string) => headers[name.toLowerCase()] ?? headers[name] ?? undefined,
  } as Request;
}

describe('assertCsrfOrigin', () => {
  it('allows an Origin in CORS_ORIGIN', () => {
    assert.doesNotThrow(() =>
      assertCsrfOrigin(fakeReq({ origin: 'http://localhost:5173' }))
    );
  });

  it('rejects a foreign Origin', () => {
    try {
      assertCsrfOrigin(fakeReq({ origin: 'https://evil.example' }));
      assert.fail('expected CSRF_REJECTED');
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.equal(err.code, 'CSRF_REJECTED');
      assert.equal(err.statusCode, 403);
    }
  });
});
