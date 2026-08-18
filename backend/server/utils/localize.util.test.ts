import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { firstLocalizedRecord, pickLocalizedArray } from './localize.util.js';

describe('pickLocalizedArray', () => {
  it('skips empty locale arrays and falls back to Korean', () => {
    assert.deepEqual(
      pickLocalizedArray({ en: [], ko: ['허리를 굽히지 마세요'] }, 'en'),
      ['허리를 굽히지 마세요']
    );
  });

  it('returns empty for blank objects', () => {
    assert.deepEqual(pickLocalizedArray({}, 'ko'), []);
    assert.deepEqual(pickLocalizedArray({ ko: [], en: [] }, 'ko'), []);
  });
});

describe('firstLocalizedRecord', () => {
  it('ignores empty {} so catalog warnings are not shadowed', () => {
    const catalog = { ko: ['어깨가 아프면 멈추세요'] };
    assert.equal(firstLocalizedRecord({}, catalog), catalog);
    assert.equal(firstLocalizedRecord(undefined, catalog), catalog);
  });
});
