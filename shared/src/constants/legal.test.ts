import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LEGAL_DOC_VERSIONS, legalVersionSatisfies } from './legal.js';

describe('legalVersionSatisfies', () => {
  it('rejects missing stored version', () => {
    assert.equal(legalVersionSatisfies(null, LEGAL_DOC_VERSIONS.terms), false);
    assert.equal(legalVersionSatisfies('', LEGAL_DOC_VERSIONS.terms), false);
  });

  it('accepts equal or newer ISO dates', () => {
    assert.equal(legalVersionSatisfies('2026-08-14', '2026-08-14'), true);
    assert.equal(legalVersionSatisfies('2026-08-14', '2026-08-13'), true);
    assert.equal(legalVersionSatisfies('2026-08-12', '2026-08-14'), false);
  });
});
