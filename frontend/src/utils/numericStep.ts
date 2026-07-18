export function getDecimalPlaces(step: number): number {
  const fraction = step.toString().split('.')[1];
  return fraction?.length ?? 0;
}

export function roundToStep(value: number, step: number): number {
  const decimals = getDecimalPlaces(step);
  return Number(value.toFixed(decimals));
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function stepNumber(
  value: number,
  step: number,
  direction: 1 | -1,
  min: number,
  max: number
): number {
  const next = roundToStep(value + step * direction, step);
  return clampNumber(next, min, max);
}

export function formatNumericValue(value: number, decimalPlaces?: number): string {
  if (decimalPlaces != null && decimalPlaces > 0) {
    return value.toFixed(decimalPlaces);
  }
  return Number.isInteger(value) ? String(value) : String(value);
}
