import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { updateProfileSchema } from './user.schema.js';

describe('updateProfileSchema age gate', () => {
  it('rejects age without birthDate', () => {
    const parsed = updateProfileSchema.safeParse({ age: 20 });
    assert.equal(parsed.success, false);
  });

  it('accepts birthDate at least 14 and derives eligibility', () => {
    const parsed = updateProfileSchema.safeParse({ birthDate: '1990-01-01' });
    assert.equal(parsed.success, true);
  });
});
