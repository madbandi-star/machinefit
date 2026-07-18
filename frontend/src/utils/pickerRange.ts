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

export function findClosestPickerValue(options: number[], value: number): number {
  if (options.length === 0) return value;

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
