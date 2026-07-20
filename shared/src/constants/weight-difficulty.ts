/** User preference: scales algorithmic recommended weight (1.0 = as calculated). */
export const WEIGHT_DIFFICULTY_MIN = 0.1;
export const WEIGHT_DIFFICULTY_MAX = 2;
export const WEIGHT_DIFFICULTY_DEFAULT = 1;
export const WEIGHT_DIFFICULTY_STEP = 0.1;

export function clampWeightDifficulty(value: number): number {
  const stepped = Math.round(value / WEIGHT_DIFFICULTY_STEP) * WEIGHT_DIFFICULTY_STEP;
  return Math.min(
    WEIGHT_DIFFICULTY_MAX,
    Math.max(WEIGHT_DIFFICULTY_MIN, Math.round(stepped * 10) / 10)
  );
}
