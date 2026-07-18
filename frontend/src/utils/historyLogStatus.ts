import type { WorkoutLog } from '@machinefit/shared';
import { getLocalDateKey, normalizeDateKey } from '@/utils/historyDate';

export const HISTORY_LOG_STATUS_VALUES = ['all', 'saved', 'unsaved'] as const;
export type HistoryLogStatus = (typeof HISTORY_LOG_STATUS_VALUES)[number];

export function parseHistoryLogStatus(value: string | null): HistoryLogStatus {
  if (value === 'saved' || value === 'unsaved') return value;
  return 'all';
}

export function buildLoggedWorkoutKey(machineCode: string, logDate: string): string {
  return `${machineCode}:${logDate}`;
}

export function buildLoggedWorkoutKeys(logs: WorkoutLog[]): Set<string> {
  const keys = new Set<string>();
  for (const log of logs) {
    keys.add(buildLoggedWorkoutKey(log.machineCode, normalizeDateKey(log.logDate)));
  }
  return keys;
}

export function historyItemHasWorkoutLog<
  T extends { machineCode: string; viewedAt: string; recommendationId?: string },
>(item: T, loggedKeys: Set<string>, logs?: WorkoutLog[]): boolean {
  if (loggedKeys.has(buildLoggedWorkoutKey(item.machineCode, getLocalDateKey(item.viewedAt)))) {
    return true;
  }
  if (item.recommendationId && logs?.length) {
    return logs.some((log) => log.recommendationId === item.recommendationId);
  }
  return false;
}

export function filterHistoryByLogStatus<
  T extends { machineCode: string; viewedAt: string; recommendationId?: string },
>(items: T[], loggedKeys: Set<string>, status: HistoryLogStatus, logs?: WorkoutLog[]): T[] {
  if (status === 'all') return items;
  return items.filter((item) => {
    const hasLog = historyItemHasWorkoutLog(item, loggedKeys, logs);
    return status === 'saved' ? hasLog : !hasLog;
  });
}
