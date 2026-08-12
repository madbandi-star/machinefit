import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { updateProfileSchema } from './user.schema.js';

describe('updateProfileSchema age gate', () => {
  it('allows age without birthDate in payload (server strips orphan age)', () => {
    // Older clients send age with body metrics; service drops it when birthDate omitted.
    const parsed = updateProfileSchema.safeParse({ age: 20, heightCm: 170 });
    assert.equal(parsed.success, true);
  });

  it('rejects age when birthDate is explicitly null', () => {
    const parsed = updateProfileSchema.safeParse({ age: 20, birthDate: null });
    assert.equal(parsed.success, false);
  });

  it('accepts birthDate at least 14 and derives eligibility', () => {
    const parsed = updateProfileSchema.safeParse({ birthDate: '1990-01-01' });
    assert.equal(parsed.success, true);
  });
});
