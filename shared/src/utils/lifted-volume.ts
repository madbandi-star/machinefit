import { computePerformedTotalWeightKg } from './effective-load.js';

/**
 * Total weight/volume for a workout log.
 *
 * MachineFit product rule:
 *   total = effectiveWeight × effectiveReps × sets
 * When per-set weights exist, each set weight is the performed weight and is
 * multiplied by effective reps (if provided). Completed-set filtering is honored.
 *
 * @deprecated Prefer `computePerformedTotalWeightKg` when adjusted/recommended
 * settings are available. This wrapper remains for call sites that only have
 * setWeightsKg (+ optional reps).
 */
export function computeLogVolumeKg(
  setWeightsKg: number[],
  setCompleted?: boolean[] | null,
  repsPerSet?: number | null
): number {
  return computePerformedTotalWeightKg({
    setWeightsKg,
    setCompleted,
    adjustedReps: repsPerSet,
    recommendedReps: repsPerSet,
    sets: setWeightsKg?.length ?? 0,
  });
}

export function formatVolumeKg(kg: number, locale = 'ko'): string {
  const safe = Math.max(0, Math.floor(kg));
  return safe.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US');
}

export function kgToTons(kg: number): number {
  return Math.round((kg / 1000) * 100) / 100;
}
