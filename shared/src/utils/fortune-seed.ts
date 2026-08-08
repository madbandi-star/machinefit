/**
 * Deterministic PRNG for 「오늘의 헬창운세」.
 * Same inputs → same picks. Never use Math.random for fortune.
 */

function fnv1a32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Build stable seed string (birthTime omitted when unknown). */
export function buildFortuneSeedKey(input: {
  userId: string;
  birthDate: string;
  birthTime?: string | null;
  birthTimeUnknown?: boolean;
  dateKey: string;
}): string {
  const timePart =
    input.birthTimeUnknown || !input.birthTime?.trim()
      ? 'UNKNOWN'
      : input.birthTime.trim().slice(0, 5);
  return `${input.userId}|${input.birthDate}|${timePart}|${input.dateKey}`;
}

export function createFortuneRng(seedKey: string): () => number {
  let state = fnv1a32(seedKey) || 1;
  return () => {
    // xorshift32
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

export function fortunePickIndex(rng: () => number, length: number): number {
  if (length <= 0) return 0;
  return Math.min(length - 1, Math.floor(rng() * length));
}

export function fortunePickOne<T>(rng: () => number, items: T[]): T | undefined {
  if (!items.length) return undefined;
  return items[fortunePickIndex(rng, items.length)];
}

/** Map rng float to inclusive int range. */
export function fortuneInt(rng: () => number, min: number, max: number): number {
  if (max <= min) return min;
  return min + fortunePickIndex(rng, max - min + 1);
}
