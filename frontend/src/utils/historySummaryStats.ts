import type { RecommendationSettings, WorkoutLog } from '@machinefit/shared';
import {
  computePerformedTotalWeightKg,
  getEffectiveWeight,
  resolveSessionAverageWeightKg,
} from '@machinefit/shared';
import { buildLoggedWorkoutKey } from '@/utils/historyLogStatus';
import type { HistoryRecordCard } from '@/utils/historyRecordsDisplay';

/** Rough minutes per set including rest — used when no timed session data exists. */
const ESTIMATED_MINUTES_PER_SET = 2;

export interface HistorySummaryStats {
  totalSets: number;
  totalWeightKg: number;
  totalVolumeKg: number;
  workoutMinutes: number;
}

export interface HistorySummaryLoadContext {
  /** Per-machine adjusted settings (조정중량 / 조정횟수). */
  preferencesByMachine?: Record<string, Partial<RecommendationSettings>>;
}

export function findWorkoutLogForCard(
  card: HistoryRecordCard,
  logs: WorkoutLog[]
): WorkoutLog | undefined {
  const key = buildLoggedWorkoutKey(
    card.machineCode,
    card.logDate,
    card.targetMuscleGroup
  );

  return logs.find(
    (log) =>
      buildLoggedWorkoutKey(log.machineCode, log.logDate, log.targetMuscleGroup) === key
  );
}

function resolveRecommendedReps(settings?: Partial<RecommendationSettings> | null): number | null {
  if (!settings) return null;
  if (settings.recommendedRepsMin != null && settings.recommendedRepsMin > 0) {
    return settings.recommendedRepsMin;
  }
  if (settings.recommendedRepsMax != null && settings.recommendedRepsMax > 0) {
    return settings.recommendedRepsMax;
  }
  return null;
}

/**
 * History summary totals.
 *
 * - 총 중량: Σ floor(로그 세트무게 합 / 세트수)  (로그별 평균의 합, 소수 절사)
 * - 총 볼륨: Σ(stepper weight × reps)
 */
export function computeHistorySummaryStats(
  cards: HistoryRecordCard[],
  logs: WorkoutLog[],
  context: HistorySummaryLoadContext = {}
): HistorySummaryStats {
  let totalSets = 0;
  let totalWeightKg = 0;
  let totalVolumeKg = 0;

  for (const card of cards) {
    const log = findWorkoutLogForCard(card, logs);
    if (!log) continue;

    const adjusted = context.preferencesByMachine?.[card.machineCode];
    const load = {
      adjustedWeight: adjusted?.recommendedWeightKg,
      recommendedWeight: card.settings.recommendedWeightKg,
      adjustedReps: resolveRecommendedReps(adjusted),
      recommendedReps: resolveRecommendedReps(card.settings),
      sets: log.setCount,
      setWeightsKg: log.setWeightsKg,
      setCompleted: log.setCompleted,
    };

    totalSets += log.setCount;
    totalWeightKg += resolveSessionAverageWeightKg(load);
    totalVolumeKg += computePerformedTotalWeightKg(load);
  }

  return {
    totalSets,
    totalWeightKg: Math.floor(totalWeightKg),
    totalVolumeKg: Math.round(totalVolumeKg * 100) / 100,
    workoutMinutes:
      totalSets > 0 ? Math.max(1, Math.round(totalSets * ESTIMATED_MINUTES_PER_SET)) : 0,
  };
}

/** Effective suggested seed weight for a history card (adjusted wins). */
export function getHistoryCardSuggestedWeightKg(
  card: HistoryRecordCard,
  adjustedSettings?: Partial<RecommendationSettings> | null
): number | undefined {
  const value = getEffectiveWeight(
    adjustedSettings?.recommendedWeightKg,
    card.settings.recommendedWeightKg
  );
  return value > 0 ? value : undefined;
}
