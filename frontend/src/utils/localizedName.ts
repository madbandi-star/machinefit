import type { LocalizedString } from '@machinefit/shared';

/**
 * Resolve DB LocalizedString JSONB.
 * Chain: current → en → ko → any non-empty → fallback (never blank).
 */
export function getLocalizedName(
  name: LocalizedString | undefined,
  lang: string,
  fallback: string
): string {
  if (!name) return fallback || '—';
  const shortLang = lang.split('-')[0] as keyof LocalizedString;
  const pick = (...vals: Array<string | undefined | null>) => {
    for (const v of vals) {
      if (typeof v === 'string' && v.trim()) return v;
    }
    return undefined;
  };
  return (
    pick(
      name[lang as keyof LocalizedString],
      name[shortLang],
      name.en,
      name.ko,
      name.ja,
      name.zh,
      ...Object.values(name)
    ) ??
    (fallback || '—')
  );
}
