import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { oauthCompleteSchema, oauthCredentialSchema } from './auth.schema.js';

const base = {
  pendingToken: 'tok',
  agreeTerms: true,
  agreePrivacy: true,
  agreeAge14: true,
};

describe('oauthCompleteSchema', () => {
  it('rejects signup without birthDate even if agreeAge14 is true', () => {
    const parsed = oauthCompleteSchema.safeParse(base);
    assert.equal(parsed.success, false);
  });

  it('accepts YYYY-MM-DD birthDate with required consents', () => {
    const parsed = oauthCompleteSchema.safeParse({ ...base, birthDate: '2010-01-15' });
    assert.equal(parsed.success, true);
  });
});

describe('oauthCredentialSchema', () => {
  it('accepts Apple idToken with nonce', () => {
    const parsed = oauthCredentialSchema.safeParse({
      idToken: 'header.payload.sig',
      nonce: 'a'.repeat(32),
    });
    assert.equal(parsed.success, true);
  });

  it('rejects a too-short nonce', () => {
    const parsed = oauthCredentialSchema.safeParse({
      idToken: 'header.payload.sig',
      nonce: 'short',
    });
    assert.equal(parsed.success, false);
  });
});
