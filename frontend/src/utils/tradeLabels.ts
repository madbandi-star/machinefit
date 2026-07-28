import type {
  LocalizedString,
  TradeCondition,
  TradeStatus,
  TradeType,
} from '@machinefit/shared';
import { getLocalizedName } from '@/utils/localizedName';

export function formatTradeLocalized(
  value: LocalizedString | string | undefined | null,
  lang: string,
  fallback = ''
): string {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  return getLocalizedName(value, lang, fallback);
}

export function formatTradePrice(price: number, currencyLabel = '원'): string {
  return `${price.toLocaleString()} ${currencyLabel}`;
}

export function formatTradeRemainingLabel(
  daysRemaining: number,
  isExpired: boolean,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  if (isExpired || daysRemaining < 0) return t('remaining.ended');
  if (daysRemaining === 0) return t('remaining.today');
  return t('remaining.days', { count: daysRemaining });
}

export function tradeConditionKey(condition: TradeCondition | null | undefined): string | null {
  return condition ? `conditions.${condition}` : null;
}

export function tradeStatusKey(status: TradeStatus, tradeType?: TradeType): string {
  // Buy listings reuse DB status `selling` but should read as "구매중" in UI.
  if (tradeType === 'buy' && status === 'selling') return 'statuses.buying';
  return `statuses.${status}`;
}

export function tradeTypeKey(tradeType: TradeType): 'buy' | 'sell' {
  return tradeType;
}

export function formatTradeDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale);
  } catch {
    return iso;
  }
}
