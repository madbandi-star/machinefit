const RECOMMEND_WEIGHT_STEP_KG = 5;

import { clampWeightDifficulty } from '../constants/weight-difficulty.js';

/** Round to integer kg, then up to the nearest 5 kg (e.g. 1→5, 6→10). */
export function roundRecommendWeightKg(value: number): number {
  const rounded = Math.round(value);
  if (rounded <= 0) return 0;
  return Math.ceil(rounded / RECOMMEND_WEIGHT_STEP_KG) * RECOMMEND_WEIGHT_STEP_KG;
}

/** Scale recommended weight by user difficulty (0.1×–2×, default 1×). */
export function applyWeightDifficultyMultiplier(
  weightKg: number | undefined,
  multiplier: number
): number | undefined {
  if (weightKg == null || weightKg <= 0) return weightKg;
  const factor = clampWeightDifficulty(multiplier);
  return roundRecommendWeightKg(weightKg * factor);
}

/** Progressive overload target: at least one 5 kg step above the current max. */
export function nextRecommendWeightKg(currentMaxKg: number): number {
  if (currentMaxKg <= 0) return roundRecommendWeightKg(20);

  const snapped = roundRecommendWeightKg(currentMaxKg);
  const roundedCurrent = Math.round(currentMaxKg);

  return snapped <= roundedCurrent ? snapped + RECOMMEND_WEIGHT_STEP_KG : snapped;
}
