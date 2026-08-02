import { describe, expect, it } from 'vitest';
import { buildPickerRange, findClosestPickerValue } from './pickerRange';

describe('findClosestPickerValue', () => {
  const reps = buildPickerRange(1, 30, 1);

  it('snaps finite values to the nearest option', () => {
    expect(findClosestPickerValue(reps, 12)).toBe(12);
    expect(findClosestPickerValue(reps, 12.4)).toBe(12);
  });

  it('uses fallback instead of range min for NaN/undefined-like values', () => {
    expect(findClosestPickerValue(reps, Number.NaN, 12)).toBe(12);
    expect(findClosestPickerValue(reps, Number.POSITIVE_INFINITY, 12)).toBe(12);
  });

  it('falls back to middle option when value and fallback are invalid', () => {
    const mid = reps[Math.floor(reps.length / 2)];
    expect(findClosestPickerValue(reps, Number.NaN)).toBe(mid);
  });
});
