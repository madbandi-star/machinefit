import type { ApiResponse, WorkoutLog } from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';
import { normalizeDateKey } from '@/utils/historyDate';

interface FetchWorkoutLogsOptions {
  gymId: string;
  memberId: string;
  from?: string;
  to?: string;
  limit?: number;
  signal?: AbortSignal;
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

/**
 * List workout logs in one request. Failures propagate so callers can toast/retry —
 * do not fan out per-machine GETs (N+1) on timeout/5xx.
 */
export async function fetchWorkoutLogs(options: FetchWorkoutLogsOptions): Promise<WorkoutLog[]> {
  const { signal, ...params } = options;
  const res = await apiClient.get<ApiResponse<WorkoutLog[]>>('/workout-logs', {
    params,
    signal,
  });
  return dedupeWorkoutLogs(res.data.data ?? []);
}

/** @deprecated Prefer fetchWorkoutLogs with explicit bounds and limit. */
export function fetchAllWorkoutLogs(gymId: string, memberId: string): Promise<WorkoutLog[]> {
  return fetchWorkoutLogs({ gymId, memberId, limit: 200 });
}
