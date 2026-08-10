import type { RetentionPeriodUnit } from '../types/data-retention.types.js';

/** Server-side schedule helper (also safe for FE display of samples). */
export function addRetentionPeriod(
  start: Date,
  value: number,
  unit: RetentionPeriodUnit
): Date {
  const d = new Date(start.getTime());
  if (value <= 0) return d;
  if (unit === 'day') {
    d.setUTCDate(d.getUTCDate() + value);
  } else if (unit === 'month') {
    d.setUTCMonth(d.getUTCMonth() + value);
  } else {
    d.setUTCFullYear(d.getUTCFullYear() + value);
  }
  return d;
}

export function daysRemainingUntil(isoOrDate: string | Date, now = new Date()): number {
  const target = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  const ms = target.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}
