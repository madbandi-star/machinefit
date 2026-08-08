import { describe, expect, it } from 'vitest';
import {
  buildFortuneSeedKey,
  createFortuneRng,
  fortunePickIndex,
} from './fortune-seed.js';

describe('fortune-seed', () => {
  it('is deterministic for the same key', () => {
    const key = buildFortuneSeedKey({
      userId: 'u1',
      birthDate: '1990-05-01',
      birthTime: '08:30',
      dateKey: '2026-08-08',
    });
    const a = createFortuneRng(key);
    const b = createFortuneRng(key);
    const seqA = Array.from({ length: 8 }, () => fortunePickIndex(a, 12));
    const seqB = Array.from({ length: 8 }, () => fortunePickIndex(b, 12));
    expect(seqA).toEqual(seqB);
  });

  it('changes when date changes', () => {
    const base = {
      userId: 'u1',
      birthDate: '1990-05-01',
      birthTime: '08:30',
    };
    const a = createFortuneRng(buildFortuneSeedKey({ ...base, dateKey: '2026-08-08' }));
    const b = createFortuneRng(buildFortuneSeedKey({ ...base, dateKey: '2026-08-09' }));
    const seqA = Array.from({ length: 6 }, () => fortunePickIndex(a, 20));
    const seqB = Array.from({ length: 6 }, () => fortunePickIndex(b, 20));
    expect(seqA).not.toEqual(seqB);
  });

  it('uses UNKNOWN time when birthTimeUnknown', () => {
    const withUnknown = buildFortuneSeedKey({
      userId: 'u1',
      birthDate: '1990-05-01',
      birthTimeUnknown: true,
      birthTime: '12:00',
      dateKey: '2026-08-08',
    });
    const withoutTime = buildFortuneSeedKey({
      userId: 'u1',
      birthDate: '1990-05-01',
      birthTimeUnknown: true,
      dateKey: '2026-08-08',
    });
    expect(withUnknown).toBe(withoutTime);
    expect(withUnknown).toContain('|UNKNOWN|');
  });
});
