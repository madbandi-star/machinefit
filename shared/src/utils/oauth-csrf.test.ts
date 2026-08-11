import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateOAuthCsrfToken, oauthCsrfMatches } from './oauth-csrf.js';

describe('oauth CSRF helpers', () => {
  it('generates 64-char hex tokens', () => {
    const a = generateOAuthCsrfToken();
    const b = generateOAuthCsrfToken();
    assert.match(a, /^[0-9a-f]{64}$/);
    assert.match(b, /^[0-9a-f]{64}$/);
    assert.notEqual(a, b);
  });

  it('accepts matching state and rejects mismatch/missing', () => {
    assert.equal(oauthCsrfMatches('abc123', 'abc123'), true);
    assert.equal(oauthCsrfMatches('abc123', 'abc124'), false);
    assert.equal(oauthCsrfMatches('abc123', null), false);
    assert.equal(oauthCsrfMatches(null, 'abc123'), false);
    assert.equal(oauthCsrfMatches('ab', 'abc'), false);
  });
});
