export const LOCALES = ['ko', 'en', 'ja', 'zh'] as const;
export type Locale = (typeof LOCALES)[number];

/** App UI language switcher options (header + settings). Catalog still may use ja/zh. */
export const UI_LOCALES = ['ko', 'en'] as const;
export type UiLocale = (typeof UI_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ko';

export const LOCALE_LABELS: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '中文',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  ko: '🇰🇷',
  en: '🇺🇸',
  ja: '🇯🇵',
  zh: '🇨🇳',
};

export function isUiLocale(value: string): value is UiLocale {
  return (UI_LOCALES as readonly string[]).includes(value);
}

/** Map unsupported UI locales (ja/zh) onto a selectable option. */
export function clampToUiLocale(locale: string | null | undefined): UiLocale {
  const base = (locale ?? DEFAULT_LOCALE).split('-')[0]?.toLowerCase() ?? DEFAULT_LOCALE;
  if (base === 'ko') return 'ko';
  if (base === 'en') return 'en';
  // ja/zh and anything else → English for UI until those packs are offered again.
  if (base === 'ja' || base === 'zh') return 'en';
  return isUiLocale(base) ? base : 'en';
}

export function formatLocaleLabel(locale: Locale): string {
  return `${LOCALE_FLAGS[locale]} ${LOCALE_LABELS[locale]}`;
}
