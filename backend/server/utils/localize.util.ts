import type { LocalizedString } from '@machinefit/shared';

export function pickLocalized(
  value: LocalizedString | string[] | null | undefined,
  locale = 'en'
): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value[0];
  return value[locale as keyof LocalizedString] ?? value.en ?? Object.values(value)[0];
}

export function pickLocalizedArray(
  value: LocalizedString | Record<string, string[]> | null | undefined,
  locale = 'en'
): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  const record = value as Record<string, string[] | string>;
  const arr = record[locale] ?? record.en;
  if (Array.isArray(arr)) return arr;
  if (typeof arr === 'string') return [arr];
  const first = Object.values(record)[0];
  if (Array.isArray(first)) return first;
  if (typeof first === 'string') return [first];
  return [];
}
