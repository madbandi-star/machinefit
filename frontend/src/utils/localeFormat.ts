/**
 * Locale-aware date / number / currency formatters.
 * Uses BCP-47 tags mapped from app Locale (ko|en|ja|zh).
 */
import type { Locale } from '@machinefit/shared';

const BCP47: Record<Locale, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
};

const DEFAULT_CURRENCY: Record<Locale, string> = {
  ko: 'KRW',
  en: 'USD',
  ja: 'JPY',
  zh: 'CNY',
};

export function toBcp47(locale: string | undefined | null): string {
  const short = String(locale ?? 'ko').split('-')[0] as Locale;
  return BCP47[short] ?? BCP47.ko;
}

export function resolveAppLocale(locale: string | undefined | null): Locale {
  const short = String(locale ?? 'ko').split('-')[0];
  if (short === 'en' || short === 'ja' || short === 'zh' || short === 'ko') return short;
  return 'ko';
}

/** e.g. 2026년 8월 6일 / Aug 6, 2026 / 2026年8月6日 */
export function formatLocaleDate(
  value: string | number | Date | null | undefined,
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (value == null || value === '') return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(toBcp47(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(d);
}

export function formatLocaleDateTime(
  value: string | number | Date | null | undefined,
  locale?: string
): string {
  return formatLocaleDate(value, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatLocaleNumber(
  value: number | null | undefined,
  locale?: string,
  options?: Intl.NumberFormatOptions
): string {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(toBcp47(locale), options).format(value);
}

/**
 * Currency display. Defaults to locale-typical currency; pass `currency` to force (e.g. KRW for Premium).
 */
export function formatLocaleCurrency(
  amount: number,
  locale?: string,
  currency?: string,
  options?: Intl.NumberFormatOptions
): string {
  const app = resolveAppLocale(locale);
  const cur = currency || DEFAULT_CURRENCY[app];
  try {
    return new Intl.NumberFormat(toBcp47(locale), {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: cur === 'KRW' || cur === 'JPY' ? 0 : 2,
      ...options,
    }).format(amount);
  } catch {
    return `${amount} ${cur}`;
  }
}
