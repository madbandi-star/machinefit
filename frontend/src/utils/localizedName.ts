import type { LocalizedString } from '@machinefit/shared';

export function getLocalizedName(
  name: LocalizedString | undefined,
  lang: string,
  fallback: string
): string {
  if (!name) return fallback;
  const shortLang = lang.split('-')[0];
  return name[lang as keyof LocalizedString]
    ?? name[shortLang as keyof LocalizedString]
    ?? name.ko
    ?? name.en
    ?? Object.values(name).find(Boolean)
    ?? fallback;
}
