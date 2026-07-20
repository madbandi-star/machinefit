import type { ApiResponse, WorkoutLog } from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';
import type { FavoriteItem, HistoryItem } from '@/api/index';
import { normalizeDateKey } from '@/utils/historyDate';

interface FetchWorkoutLogsOptions {
  from?: string;
  to?: string;
  limit?: number;
}

function dedupeWorkoutLogs(logs: WorkoutLog[]): WorkoutLog[] {
  const byKey = new Map<string, WorkoutLog>();

  for (const log of logs) {
    const key = `${log.machineCode}:${normalizeDateKey(log.logDate)}:${log.targetMuscleGroup ?? ''}`;
    const existing = byKey.get(key);
    const normalizedLog = { ...log, logDate: normalizeDateKey(log.logDate) };

    if (!existing || normalizedLog.updatedAt > existing.updatedAt) {
      byKey.set(key, normalizedLog);
    }
  }

  return [...byKey.values()];
}

function sortWorkoutLogsAscending(logs: WorkoutLog[]): WorkoutLog[] {
  return [...logs].sort((left, right) => {
    const dateCompare = normalizeDateKey(left.logDate).localeCompare(normalizeDateKey(right.logDate));
    if (dateCompare !== 0) return dateCompare;
    return left.createdAt.localeCompare(right.createdAt);
  });
}

function limitToMostRecent(logs: WorkoutLog[], limit?: number): WorkoutLog[] {
  if (!limit || logs.length <= limit) return sortWorkoutLogsAscending(logs);
  return sortWorkoutLogsAscending(
    [...logs]
      .sort((left, right) => {
        const dateCompare = normalizeDateKey(right.logDate).localeCompare(normalizeDateKey(left.logDate));
        if (dateCompare !== 0) return dateCompare;
        return right.createdAt.localeCompare(left.createdAt);
      })
      .slice(0, limit)
  );
}

async function listWorkoutLogsForMachine(
  machineCode: string,
  options?: FetchWorkoutLogsOptions
): Promise<WorkoutLog[]> {
  const res = await apiClient.get<ApiResponse<WorkoutLog[]>>('/workout-logs', {
    params: { machineCode, from: options?.from, to: options?.to },
  });
  return res.data.data ?? [];
}

async function listWorkoutLogsViaKnownMachines(options?: FetchWorkoutLogsOptions): Promise<WorkoutLog[]> {
  const [historyRes, favoritesRes] = await Promise.all([
    apiClient.get<ApiResponse<HistoryItem[]>>('/history', { params: { limit: 100 } }),
    apiClient.get<ApiResponse<FavoriteItem[]>>('/favorites'),
  ]);

  const machineCodes = new Set<string>();
  for (const item of historyRes.data.data ?? []) {
    machineCodes.add(item.machineCode);
  }
  for (const item of favoritesRes.data.data ?? []) {
    machineCodes.add(item.machineCode);
  }

  if (machineCodes.size === 0) return [];

  const batches = await Promise.all(
    [...machineCodes].map(async (machineCode) => {
      try {
        return await listWorkoutLogsForMachine(machineCode, options);
      } catch {
        return [];
      }
    })
  );

  return limitToMostRecent(dedupeWorkoutLogs(batches.flat()), options?.limit);
}

export async function fetchWorkoutLogs(options?: FetchWorkoutLogsOptions): Promise<WorkoutLog[]> {
  try {
    const res = await apiClient.get<ApiResponse<WorkoutLog[]>>('/workout-logs', {
      params: options,
    });
    return dedupeWorkoutLogs(res.data.data ?? []);
  } catch {
    return dedupeWorkoutLogs(await listWorkoutLogsViaKnownMachines(options));
  }
}

/** @deprecated Prefer fetchWorkoutLogs with explicit bounds and limit. */
export function fetchAllWorkoutLogs(): Promise<WorkoutLog[]> {
  return fetchWorkoutLogs({ limit: 200 });
}
