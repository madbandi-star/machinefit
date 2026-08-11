import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { oauthCompleteSchema } from './auth.schema.js';

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
