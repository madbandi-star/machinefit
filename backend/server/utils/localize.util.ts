import type { LocalizedString } from '@machinefit/shared';

/**
 * Resolve LocalizedString JSONB for API responses.
 * Chain: locale → en → ko → any non-empty (never blank when data exists).
 */
export function pickLocalized(
  value: LocalizedString | string[] | null | undefined,
  locale = 'ko'
): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value[0];
  const short = String(locale).split('-')[0] as keyof LocalizedString;
  const candidates = [
    value[short],
    value.en,
    value.ko,
    value.ja,
    value.zh,
    ...Object.values(value),
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c;
  }
  return undefined;
}

export function pickLocalizedArray(
  value: LocalizedString | Record<string, string[]> | null | undefined,
  locale = 'ko'
): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  const record = value as Record<string, string[] | string>;
  const short = String(locale).split('-')[0];
  const arr = record[short] ?? record.en ?? record.ko;
  if (Array.isArray(arr)) return arr;
  if (typeof arr === 'string') return [arr];
  const first = Object.values(record)[0];
  if (Array.isArray(first)) return first;
  if (typeof first === 'string') return [first];
  return [];
}
