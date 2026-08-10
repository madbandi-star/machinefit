import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  generateRandomUsername,
  looksLikeKoreanRealName,
  normalizeUsername,
  usernameMatchesProviderProfileName,
  usernameUniqueKey,
  validateUsername,
  USERNAME_RANDOM_PREFIXES,
} from './username.js';

describe('username privacy helpers', () => {
  it('generates MachineFit-style random usernames without PII inputs', () => {
    for (let i = 0; i < 40; i += 1) {
      const u = generateRandomUsername();
      assert.ok(USERNAME_RANDOM_PREFIXES.some((p) => u.startsWith(p)));
      assert.match(u, /\d{4}$/);
      assert.equal(validateUsername(u).ok, true);
    }
  });

  it('blocks obvious Korean real-name shapes but allows nicknames with surnames', () => {
    assert.equal(looksLikeKoreanRealName('홍길동'), true);
    assert.equal(looksLikeKoreanRealName('김철수'), true);
    assert.equal(looksLikeKoreanRealName('이영희'), true);
    assert.equal(looksLikeKoreanRealName('헬창김씨'), false);
    assert.equal(looksLikeKoreanRealName('운동하는박씨'), false);
    assert.equal(looksLikeKoreanRealName('김치맨'), false);
    assert.equal(looksLikeKoreanRealName('머신러너'), false);
    assert.equal(validateUsername('홍길동').ok, false);
    assert.equal(validateUsername('헬창김씨').ok, true);
  });

  it('blocks phone/email/reserved/space forms', () => {
    assert.equal(validateUsername('01012345678').ok, false);
    assert.equal(validateUsername('test@example.com').ok, false);
    assert.equal(validateUsername('admin').ok, false);
    assert.equal(validateUsername('홍 길 동').ok, false);
  });

  it('normalizes uniqueness keys case-insensitively for Latin', () => {
    assert.equal(usernameUniqueKey(normalizeUsername('MachineFit1')), 'machinefit1');
    assert.equal(
      usernameUniqueKey(normalizeUsername('MachineFit1')),
      usernameUniqueKey(normalizeUsername('machinefit1'))
    );
  });

  it('detects provider profile name equality without storing it', () => {
    assert.equal(usernameMatchesProviderProfileName('홍길동', '홍길동'), true);
    assert.equal(usernameMatchesProviderProfileName('홍길동', '홍 길 동'), true);
    assert.equal(usernameMatchesProviderProfileName('머신러너4821', '홍길동'), false);
  });
});
