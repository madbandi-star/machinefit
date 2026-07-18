import type { WorkoutLog } from '@machinefit/shared';
import { computeVolume } from '@/utils/workoutAnalytics';
import { buildLoggedWorkoutKey } from '@/utils/historyLogStatus';
import type { HistoryRecordCard } from '@/utils/historyRecordsDisplay';

export const HISTORY_SUMMARY_VOLUME_DUMMY_KG = 3870;
export const HISTORY_SUMMARY_DURATION_DUMMY_MIN = 48;

export interface HistorySummaryStats {
  totalSets: number;
  totalWeightKg: number;
  totalVolumeDummyKg: number;
  workoutMinutesDummy: number;
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

  for (const card of cards) {
    const log = findWorkoutLogForCard(card, logs);
    if (!log) continue;
    totalSets += log.setCount;
    totalWeightKg += computeVolume(log.setWeightsKg);
  }

  return {
    totalSets,
    totalWeightKg,
    totalVolumeDummyKg: HISTORY_SUMMARY_VOLUME_DUMMY_KG,
    workoutMinutesDummy: HISTORY_SUMMARY_DURATION_DUMMY_MIN,
  };
}
