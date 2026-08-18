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

function asNonEmptyLines(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const lines = value.map((item) => String(item).trim()).filter(Boolean);
    return lines.length > 0 ? lines : undefined;
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return undefined;
}

export function pickLocalizedArray(
  value: LocalizedString | Record<string, string[]> | null | undefined,
  locale = 'ko'
): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return asNonEmptyLines(value) ?? [];
  const record = value as Record<string, unknown>;
  const short = String(locale).split('-')[0];
  const keys = [short, 'en', 'ko', 'ja', 'zh', ...Object.keys(record)];
  const seen = new Set<string>();
  for (const key of keys) {
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const lines = asNonEmptyLines(record[key]);
    if (lines) return lines;
  }
  return [];
}

export function firstLocalizedRecord(
  ...candidates: Array<Record<string, string[]> | LocalizedString | null | undefined>
): Record<string, string[]> | null {
  for (const candidate of candidates) {
    if (candidate && pickLocalizedArray(candidate).length > 0) {
      return candidate as Record<string, string[]>;
    }
  }
  return null;
}
