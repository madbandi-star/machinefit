import type { WorkoutLog } from '@machinefit/shared';
import { computeMaxWeight, computeVolume } from '@/utils/workoutAnalytics';
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

export function computeHistorySummaryStats(
  cards: HistoryRecordCard[],
  logs: WorkoutLog[]
): HistorySummaryStats {
  let totalSets = 0;
  let totalWeightKg = 0;
  let totalVolumeKg = 0;

  for (const card of cards) {
    const log = findWorkoutLogForCard(card, logs);
    if (!log) continue;
    totalSets += log.setCount;
    totalWeightKg += computeMaxWeight(log.setWeightsKg);
    totalVolumeKg += computeVolume(log.setWeightsKg);
  }

  return {
    totalSets,
    totalWeightKg,
    totalVolumeKg,
    workoutMinutes:
      totalSets > 0 ? Math.max(1, Math.round(totalSets * ESTIMATED_MINUTES_PER_SET)) : 0,
  };
}
