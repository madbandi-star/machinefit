/**
 * Effective working load helpers.
 *
 * Product rule for seeding workout-log weight steppers:
 * - 추천값 잘맞음 / 미선택 → 추천중량
 * - 셋팅값 조정 필요 / 그 외 → 조정중량(있으면) else 추천중량
 *
 * Totals (총 중량 / 총 볼륨) are computed from the -무게kg+ stepper values
 * (`setWeightsKg`), not by overriding them with preference fields.
 */

function toPositiveNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** Prefer adjusted weight when present (> 0); otherwise fall back to recommended. */
export function getEffectiveWeight(
  adjustedWeight?: number | null,
  recommendedWeight?: number | null
): number {
  return toPositiveNumber(adjustedWeight) ?? toPositiveNumber(recommendedWeight) ?? 0;
}

/** Prefer adjusted reps when present (> 0); otherwise fall back to recommended. */
export function getEffectiveReps(
  adjustedReps?: number | null,
  recommendedReps?: number | null
): number {
  return toPositiveNumber(adjustedReps) ?? toPositiveNumber(recommendedReps) ?? 0;
}

/** Classic session load: weight × reps × sets. */
export function computeTotalWeightKg(weight: number, reps: number, sets: number): number {
  const w = toPositiveNumber(weight) ?? 0;
  const r = toPositiveNumber(reps) ?? 0;
  const s = toPositiveNumber(sets) ?? 0;
  if (w <= 0 || r <= 0 || s <= 0) return 0;
  return Math.round(w * r * s * 100) / 100;
}

export interface EffectiveLoadInput {
  /** User-adjusted working weight (preference / 조정중량). */
  adjustedWeight?: number | null;
  /** AI / recommendation working weight (추천중량). */
  recommendedWeight?: number | null;
  /** User-adjusted reps (조정횟수). */
  adjustedReps?: number | null;
  /** AI / recommendation reps (추천횟수). */
  recommendedReps?: number | null;
  /** Number of sets performed. */
  sets?: number | null;
  /** Per-set working weights from -무게kg+ steppers / workout log. */
  setWeightsKg?: number[] | null;
  setCompleted?: boolean[] | null;
}

export type FitRatingLike = 'good' | 'bad' | null | undefined;

/**
 * Weight to put into workout-log steppers (-무게kg+).
 *
 * - 추천값 잘맞음 (`good`) or 미선택 (`null`) → 추천중량
 * - 셋팅값 조정 필요 (`bad`) or other → 조정중량 if present, else 추천중량
 */
export function resolveWorkoutLogSeedWeightKg(options: {
  fitRating?: FitRatingLike;
  adjustedWeight?: number | null;
  recommendedWeight?: number | null;
}): number | undefined {
  const recommended = toPositiveNumber(options.recommendedWeight) ?? undefined;
  const adjusted = toPositiveNumber(options.adjustedWeight) ?? undefined;

  if (options.fitRating === 'good' || options.fitRating == null) {
    return recommended;
  }

  // bad / other: prefer adjusted when available
  return adjusted ?? recommended;
}

function shouldUseCompletedFilter(
  setWeightsKg: number[],
  setCompleted?: boolean[] | null
): boolean {
  return (
    Array.isArray(setCompleted) &&
    setCompleted.length === setWeightsKg.length &&
    setCompleted.some((v) => v === true)
  );
}

function resolveSetCount(input: EffectiveLoadInput): number {
  const weights = Array.isArray(input.setWeightsKg) ? input.setWeightsKg : [];
  if (weights.length > 0 && shouldUseCompletedFilter(weights, input.setCompleted)) {
    return weights.filter((_, i) => input.setCompleted![i] === true).length;
  }
  const fromInput = toPositiveNumber(input.sets);
  if (fromInput != null) return fromInput;
  return weights.filter((w) => typeof w === 'number' && Number.isFinite(w) && w > 0).length;
}

/**
 * Session / log **volume** (총 볼륨) from stepper weights:
 * Σ(setWeight_i × effectiveReps), or effectiveWeight × reps × sets when no steppers yet.
 */
export function computePerformedTotalWeightKg(input: EffectiveLoadInput): number {
  const reps = getEffectiveReps(input.adjustedReps, input.recommendedReps);
  const sets = resolveSetCount(input);
  const weights = Array.isArray(input.setWeightsKg) ? input.setWeightsKg : [];

  const positiveWeights = weights.filter(
    (w) => typeof w === 'number' && Number.isFinite(w) && w > 0
  );

  // Primary: -무게kg+ stepper / logged set weights
  if (positiveWeights.length > 0) {
    const useCompleted = shouldUseCompletedFilter(weights, input.setCompleted);
    let total = 0;
    for (let i = 0; i < weights.length; i += 1) {
      if (useCompleted && input.setCompleted![i] !== true) continue;
      const w = weights[i];
      if (typeof w !== 'number' || !Number.isFinite(w) || w <= 0) continue;
      total += reps > 0 ? w * reps : w;
    }
    return Math.round(total * 100) / 100;
  }

  // Fallback before steppers are filled: seed weight × reps × sets
  const seedWeight = getEffectiveWeight(input.adjustedWeight, input.recommendedWeight);
  if (seedWeight > 0 && reps > 0 && sets > 0) {
    return computeTotalWeightKg(seedWeight, reps, sets);
  }
  if (seedWeight > 0 && sets > 0) {
    return Math.round(seedWeight * sets * 100) / 100;
  }

  return 0;
}

/**
 * Working weight for a session (총 중량 카드용) from stepper weights.
 * max(setWeights) first; else seed (adjusted → recommended). No × reps/sets.
 */
export function resolveSessionWorkingWeightKg(input: EffectiveLoadInput): number {
  const weights = Array.isArray(input.setWeightsKg) ? input.setWeightsKg : [];
  if (weights.length > 0) {
    const useCompleted = shouldUseCompletedFilter(weights, input.setCompleted);
    let max = 0;
    for (let i = 0; i < weights.length; i += 1) {
      if (useCompleted && input.setCompleted![i] !== true) continue;
      const w = weights[i];
      if (typeof w === 'number' && Number.isFinite(w) && w > max) max = w;
    }
    if (max > 0) return max;
  }

  return getEffectiveWeight(input.adjustedWeight, input.recommendedWeight);
}

/**
 * @deprecated Prefer `resolveWorkoutLogSeedWeightKg` with fitRating.
 * Kept for call sites that only have adjusted/recommended.
 */
export function resolveSuggestedWeightKg(
  adjustedWeight?: number | null,
  recommendedWeight?: number | null
): number | undefined {
  const value = getEffectiveWeight(adjustedWeight, recommendedWeight);
  return value > 0 ? value : undefined;
}
