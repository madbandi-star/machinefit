import { roundToStep } from '@/utils/numericStep';

export function buildPickerRange(min: number, max: number, step: number): number[] {
  if (step <= 0 || max < min) return [];

  const values: number[] = [];
  let current = min;
  const limit = max + step / 2;

  while (current <= limit) {
    values.push(roundToStep(current, step));
    current = roundToStep(current + step, step);
  }

  return values;
}

/**
 * Snap `value` to the nearest option.
 * Non-finite / missing values must NOT fall through to `options[0]` (range min) —
 * that caused voice-count pickers to flash/reset to minimums when settings failed
 * to resolve. Prefer `fallback`, else the middle option.
 */
export function findClosestPickerValue(
  options: number[],
  value: number,
  fallback?: number
): number {
  if (options.length === 0) {
    return Number.isFinite(value) ? value : (fallback ?? 0);
  }

  if (!Number.isFinite(value)) {
    if (fallback != null && Number.isFinite(fallback)) {
      return findClosestPickerValue(options, fallback);
    }
    return options[Math.floor(options.length / 2)] ?? options[0];
  }

  let closest = options[0];
  let smallestDiff = Math.abs(value - closest);

  for (const option of options) {
    const diff = Math.abs(value - option);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closest = option;
    }
  }

  return closest;
}
