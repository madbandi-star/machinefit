/**
 * Effective working load helpers.
 *
 * Product rule for seeding workout-log weight steppers:
 * - 추천값 잘맞음 / 미선택 → 추천중량
 * - 셋팅값 조정 필요 / 그 외 → 조정중량(있으면) else 추천중량
 *
 * Totals from -무게kg+ stepper values (`setWeightsKg`):
 * - 총 중량: Σ floor(로그 세트무게 합 / 세트수)
 * - 총 볼륨: Σ(세트무게 × 횟수)
 *   횟수는 중량 시드와 같은 fit 규칙:
 *   - 추천값 잘맞음 / 미선택 → 추천횟수
 *   - 셋팅값 조정 필요 → 조정횟수(있으면) else 추천횟수
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

export type FitRatingLike = 'good' | 'bad' | null | undefined;

export interface EffectiveLoadInput {
  /** User-adjusted working weight (preference / 조정중량). */
  adjustedWeight?: number | null;
  /** AI / recommendation working weight (추천중량). */
  recommendedWeight?: number | null;
  /** User-adjusted reps (조정횟수). */
  adjustedReps?: number | null;
  /** AI / recommendation reps (추천횟수). */
  recommendedReps?: number | null;
  /**
   * Fit feedback — same rule as weight steppers for volume reps.
   * When set (including null), reps follow `resolveWorkoutLogSeedReps`.
   * When omitted, falls back to `getEffectiveReps` (adjusted wins if present).
   */
  fitRating?: FitRatingLike;
  /** Number of sets performed. */
  sets?: number | null;
  /** Per-set working weights from -무게kg+ steppers / workout log. */
  setWeightsKg?: number[] | null;
  setCompleted?: boolean[] | null;
}

/**
 * Weight to put into workout-log steppers (-무게kg+) for incomplete sets.
 *
 * Callers should pass live on-screen values (not only last DB row):
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

/**
 * Reps for 총 볼륨 — same fit rule as `resolveWorkoutLogSeedWeightKg`.
 *
 * - 추천값 잘맞음 (`good`) or 미선택 (`null`) → 추천횟수
 * - 셋팅값 조정 필요 (`bad`) or other → 조정횟수 if present, else 추천횟수
 */
export function resolveWorkoutLogSeedReps(options: {
  fitRating?: FitRatingLike;
  adjustedReps?: number | null;
  recommendedReps?: number | null;
}): number {
  const recommended = toPositiveNumber(options.recommendedReps) ?? 0;
  const adjusted = toPositiveNumber(options.adjustedReps) ?? undefined;

  if (options.fitRating === 'good' || options.fitRating == null) {
    return recommended;
  }

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
 *
 * When `fitRating` is provided (including null): same rule as weight steppers
 * (good/미선택 → 추천횟수, bad → 조정횟수).
 * When omitted: 조정횟수 if present, else 추천횟수.
 */
export function computePerformedTotalWeightKg(input: EffectiveLoadInput): number {
  const reps =
    input.fitRating !== undefined
      ? resolveWorkoutLogSeedReps({
          fitRating: input.fitRating,
          adjustedReps: input.adjustedReps,
          recommendedReps: input.recommendedReps,
        })
      : getEffectiveReps(input.adjustedReps, input.recommendedReps);
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
 * Per-log average: floor(Σ setWeights / setCount). Completed-set filter honored.
 * Fallback when no set weights: seed weight (adjusted → recommended).
 */
export function resolveSessionAverageWeightKg(input: EffectiveLoadInput): number {
  const weights = Array.isArray(input.setWeightsKg) ? input.setWeightsKg : [];
  if (weights.length > 0) {
    const useCompleted = shouldUseCompletedFilter(weights, input.setCompleted);
    let sum = 0;
    let count = 0;
    for (let i = 0; i < weights.length; i += 1) {
      if (useCompleted && input.setCompleted![i] !== true) continue;
      const w = weights[i];
      if (typeof w !== 'number' || !Number.isFinite(w) || w <= 0) continue;
      sum += w;
      count += 1;
    }
    if (count > 0) return Math.floor(sum / count);
  }

  const seed = getEffectiveWeight(input.adjustedWeight, input.recommendedWeight);
  return seed > 0 ? Math.floor(seed) : 0;
}

/**
 * @deprecated Prefer `resolveSessionAverageWeightKg` for 총 중량.
 * Kept for callers that still need max-set working weight.
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
