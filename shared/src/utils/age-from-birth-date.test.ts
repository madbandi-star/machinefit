import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AGE_CALC_TIMEZONE,
  MIN_PLATFORM_AGE,
  ageFromBirthDate,
  isBirthDateAtLeastMinAge,
  yearsSinceBirthDate,
} from './age-from-birth-date.js';

/** Instant that is `kst` wall time in Asia/Seoul. */
function atKst(ymd: string, hms: string): Date {
  return new Date(`${ymd}T${hms}+09:00`);
}

describe('yearsSinceBirthDate (Asia/Seoul)', () => {
  it('uses Asia/Seoul, not the Date local zone', () => {
    assert.equal(AGE_CALC_TIMEZONE, 'Asia/Seoul');
  });

  it('is 14 on the 14th birthday at KST midnight', () => {
    const now = atKst('2026-08-11', '00:00:00');
    assert.equal(yearsSinceBirthDate('2012-08-11', now), 14);
    assert.equal(isBirthDateAtLeastMinAge('2012-08-11', MIN_PLATFORM_AGE, now), true);
  });

  it('is 13 one second before KST midnight on the birthday', () => {
    const now = atKst('2026-08-10', '23:59:59');
    assert.equal(yearsSinceBirthDate('2012-08-11', now), 13);
    assert.equal(isBirthDateAtLeastMinAge('2012-08-11', MIN_PLATFORM_AGE, now), false);
  });

  it('treats UTC Aug 10 15:00 as KST Aug 11 (eligible)', () => {
    const now = new Date('2026-08-10T15:00:00.000Z');
    assert.equal(yearsSinceBirthDate('2012-08-11', now), 14);
  });

  it('treats UTC Aug 10 14:59 as KST Aug 10 (not yet 14)', () => {
    const now = new Date('2026-08-10T14:59:59.000Z');
    assert.equal(yearsSinceBirthDate('2012-08-11', now), 13);
  });

  it('rejects under-14 even on a later calendar day in UTC', () => {
    const now = atKst('2026-08-11', '12:00:00');
    assert.equal(yearsSinceBirthDate('2012-08-12', now), 13);
  });

  it('handles Feb 29 births as Mar 1 in a non-leap year', () => {
    assert.equal(yearsSinceBirthDate('2012-02-29', atKst('2026-02-28', '12:00:00')), 13);
    assert.equal(yearsSinceBirthDate('2012-02-29', atKst('2026-03-01', '00:00:00')), 14);
  });

  it('returns undefined for impossible calendar dates', () => {
    assert.equal(yearsSinceBirthDate('2012-02-30', atKst('2026-08-11', '12:00:00')), undefined);
    assert.equal(yearsSinceBirthDate('not-a-date', atKst('2026-08-11', '12:00:00')), undefined);
    assert.equal(yearsSinceBirthDate('', atKst('2026-08-11', '12:00:00')), undefined);
  });

  it('ageFromBirthDate clamps below MIN_PLATFORM_AGE to undefined', () => {
    const now = atKst('2026-08-11', '12:00:00');
    assert.equal(ageFromBirthDate('2013-08-11', { now }), undefined);
    assert.equal(ageFromBirthDate('2012-08-11', { now }), 14);
  });
});
