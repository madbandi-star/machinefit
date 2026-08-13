const RECOMMEND_WEIGHT_STEP_KG = 5;
/** Smaller progressive step for bodyweight estimated loads (not plate hardware). */
const BODYWEIGHT_PROGRESS_STEP_KG = 1;

import { clampWeightDifficulty } from '../constants/weight-difficulty.js';
import { roundBodyweightEstimatedLoadKg } from '../constants/bodyweight-load.js';

/** Round to integer kg, then up to the nearest 5 kg (e.g. 1→5, 6→10). */
export function roundRecommendWeightKg(value: number): number {
  const rounded = Math.round(value);
  if (rounded <= 0) return 0;
  return Math.ceil(rounded / RECOMMEND_WEIGHT_STEP_KG) * RECOMMEND_WEIGHT_STEP_KG;
}

/**
 * Snap helper that preserves bodyweight estimated-load precision (1 decimal)
 * and avoids forcing plate increments on BW movements.
 */
export function snapRecommendWeightKg(
  value: number,
  options?: { bodyweightEstimated?: boolean }
): number {
  if (options?.bodyweightEstimated) {
    return roundBodyweightEstimatedLoadKg(value);
  }
  return roundRecommendWeightKg(value);
}

/** Scale recommended weight by user difficulty (0.1×–10×, default 1×). */
export function applyWeightDifficultyMultiplier(
  weightKg: number | undefined,
  multiplier: number,
  options?: { bodyweightEstimated?: boolean }
): number | undefined {
  if (weightKg == null || weightKg <= 0) return weightKg;
  const factor = clampWeightDifficulty(multiplier);
  return snapRecommendWeightKg(weightKg * factor, options);
}

/** Progressive overload target: at least one 5 kg step above the current max. */
export function nextRecommendWeightKg(currentMaxKg: number): number {
  if (currentMaxKg <= 0) return roundRecommendWeightKg(20);

  const snapped = roundRecommendWeightKg(currentMaxKg);
  const roundedCurrent = Math.round(currentMaxKg);

  return snapped <= roundedCurrent ? snapped + RECOMMEND_WEIGHT_STEP_KG : snapped;
}

/**
 * Progressive step for bodyweight estimated loads — +1 kg (0.1 precision),
 * not plate 5 kg snaps.
 */
export function nextBodyweightRecommendKg(currentMaxKg: number): number {
  if (currentMaxKg <= 0) return 0;
  return roundBodyweightEstimatedLoadKg(currentMaxKg + BODYWEIGHT_PROGRESS_STEP_KG);
}

export { RECOMMEND_WEIGHT_STEP_KG, BODYWEIGHT_PROGRESS_STEP_KG };
