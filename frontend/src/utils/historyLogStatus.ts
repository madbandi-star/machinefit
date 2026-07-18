import type { WorkoutLog } from '@machinefit/shared';
import { getLocalDateKey, normalizeDateKey } from '@/utils/historyDate';

export const HISTORY_LOG_STATUS_VALUES = ['all', 'saved', 'unsaved'] as const;
export type HistoryLogStatus = (typeof HISTORY_LOG_STATUS_VALUES)[number];

export function parseHistoryLogStatus(value: string | null): HistoryLogStatus {
  if (value === 'saved' || value === 'unsaved') return value;
  return 'all';
}

export function buildLoggedWorkoutKey(
  machineCode: string,
  logDate: string,
  targetMuscleGroup?: string
): string {
  return `${machineCode}:${logDate}:${targetMuscleGroup ?? ''}`;
}

export function buildLoggedWorkoutKeys(logs: WorkoutLog[]): Set<string> {
  const keys = new Set<string>();
  for (const log of logs) {
    keys.add(
      buildLoggedWorkoutKey(
        log.machineCode,
        normalizeDateKey(log.logDate),
        log.targetMuscleGroup
      )
    );
  }
  return keys;
}

export function historyItemHasWorkoutLog<
  T extends {
    machineCode: string;
    viewedAt: string;
    recommendationId?: string;
    targetMuscleGroup?: string;
  },
>(item: T, loggedKeys: Set<string>, logs?: WorkoutLog[]): boolean {
  const key = buildLoggedWorkoutKey(
    item.machineCode,
    getLocalDateKey(item.viewedAt),
    item.targetMuscleGroup
  );
  if (loggedKeys.has(key)) {
    return true;
  }
  if (item.recommendationId && logs?.length) {
    return logs.some((log) => log.recommendationId === item.recommendationId);
  }
  return false;
}

export function filterHistoryByLogStatus<
  T extends {
    machineCode: string;
    viewedAt: string;
    recommendationId?: string;
    targetMuscleGroup?: string;
  },
>(items: T[], loggedKeys: Set<string>, status: HistoryLogStatus, logs?: WorkoutLog[]): T[] {
  if (status === 'all') return items;
  return items.filter((item) => {
    const hasLog = historyItemHasWorkoutLog(item, loggedKeys, logs);
    return status === 'saved' ? hasLog : !hasLog;
  });
}
