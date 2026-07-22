/**
 * Effective working load helpers.
 *
 * Product rule: user-adjusted values always win over AI recommendations.
 * Total weight = effectiveWeight × effectiveReps × sets.
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
  /**
   * Optional per-set working weights from a workout log.
   * When present with positive values, each set weight is treated as the actual
   * performed weight for that set (already “adjusted”), then multiplied by effective reps.
   */
  setWeightsKg?: number[] | null;
  setCompleted?: boolean[] | null;
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

/**
 * Session / log total weight using the product rule:
 * - weight = adjusted > 0 ? adjusted : recommended
 * - reps = adjusted > 0 ? adjusted : recommended
 * - total = weight × reps × sets
 *
 * When `setWeightsKg` is provided, total = Σ(setWeight_i × effectiveReps) for
 * completed (or all) sets — equivalent to weight×reps×sets when weights are uniform.
 * If reps are missing (legacy rows), falls back to Σ(setWeight_i) for compatibility.
 */
export function computePerformedTotalWeightKg(input: EffectiveLoadInput): number {
  const reps = getEffectiveReps(input.adjustedReps, input.recommendedReps);
  const weights = Array.isArray(input.setWeightsKg) ? input.setWeightsKg : [];
  const positiveWeights = weights.filter(
    (w) => typeof w === 'number' && Number.isFinite(w) && w > 0
  );

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

  const weight = getEffectiveWeight(input.adjustedWeight, input.recommendedWeight);
  const sets = toPositiveNumber(input.sets) ?? 0;
  return computeTotalWeightKg(weight, reps, sets);
}

/**
 * Resolve effective weight for seeding workout logs / UI defaults.
 * Same rule as getEffectiveWeight; exposed for call-site clarity.
 */
export function resolveSuggestedWeightKg(
  adjustedWeight?: number | null,
  recommendedWeight?: number | null
): number | undefined {
  const value = getEffectiveWeight(adjustedWeight, recommendedWeight);
  return value > 0 ? value : undefined;
}
