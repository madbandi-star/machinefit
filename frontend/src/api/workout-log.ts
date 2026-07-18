import type { ApiResponse, WorkoutLog } from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';
import type { FavoriteItem, HistoryItem } from '@/api/index';
import { normalizeDateKey } from '@/utils/historyDate';

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

async function listWorkoutLogsForMachine(machineCode: string): Promise<WorkoutLog[]> {
  const res = await apiClient.get<ApiResponse<WorkoutLog[]>>('/workout-logs', {
    params: { machineCode },
  });
  return res.data.data ?? [];
}

async function listWorkoutLogsViaKnownMachines(): Promise<WorkoutLog[]> {
  const [historyRes, favoritesRes] = await Promise.all([
    apiClient.get<ApiResponse<HistoryItem[]>>('/history', { params: { limit: 200 } }),
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
        return await listWorkoutLogsForMachine(machineCode);
      } catch {
        return [];
      }
    })
  );

  return dedupeWorkoutLogs(batches.flat());
}

/** List all workout logs; falls back to per-machine fetch when bulk list is unavailable. */
export async function fetchAllWorkoutLogs(): Promise<WorkoutLog[]> {
  try {
    const res = await apiClient.get<ApiResponse<WorkoutLog[]>>('/workout-logs');
    return dedupeWorkoutLogs(res.data.data ?? []);
  } catch {
    return dedupeWorkoutLogs(await listWorkoutLogsViaKnownMachines());
  }
}
