import type { TargetMuscleGroup, WorkoutLog } from '@machinefit/shared';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { normalizeDateKey } from '@/utils/historyDate';

/** Must match between WorkoutLogPanel, useWorkoutLogSaved, and cache updates. */
export function getWorkoutLogQueryTargetMuscle(
  machineCode: string,
  targetMuscleGroup?: TargetMuscleGroup | null
): TargetMuscleGroup | undefined {
  return isFreeWeightMachineCode(machineCode) && targetMuscleGroup
    ? targetMuscleGroup
    : undefined;
}

export function matchesWorkoutLogEntry(
  log: WorkoutLog,
  params: {
    machineCode: string;
    logDate: string;
    targetMuscleGroup?: string;
  }
): boolean {
  return (
    log.machineCode === params.machineCode &&
    normalizeDateKey(log.logDate) === normalizeDateKey(params.logDate) &&
    (log.targetMuscleGroup ?? '') === (params.targetMuscleGroup ?? '')
  );
}

export function removeWorkoutLogFromCache(
  logs: WorkoutLog[] | undefined,
  params: {
    machineCode: string;
    logDate: string;
    targetMuscleGroup?: string;
  }
): WorkoutLog[] {
  if (!logs?.length) return [];
  return logs.filter((log) => !matchesWorkoutLogEntry(log, params));
}

export function upsertWorkoutLogInCache(
  logs: WorkoutLog[] | undefined,
  log: WorkoutLog,
  params: {
    machineCode: string;
    logDate: string;
    targetMuscleGroup?: string;
  }
): WorkoutLog[] {
  const normalizedLog = { ...log, logDate: normalizeDateKey(log.logDate) };
  return [...removeWorkoutLogFromCache(logs, params), normalizedLog];
}

/**
 * React Query updater for any `workout-logs` list cache.
 * Empty arrays must still accept the first saved log (Records summary depends on this).
 */
export function upsertWorkoutLogInListQueryData(
  old: WorkoutLog[] | undefined,
  log: WorkoutLog,
  params: {
    machineCode: string;
    logDate: string;
    targetMuscleGroup?: string;
  }
): WorkoutLog[] | undefined {
  if (old === undefined) return old;
  if (!Array.isArray(old)) return old;
  if (old.length > 0) {
    const sample = old[0];
    if (!sample || typeof sample !== 'object' || !('setWeightsKg' in sample)) {
      return old;
    }
  }
  return upsertWorkoutLogInCache(old, log, params);
}

/** React Query updater that drops a log from any `workout-logs` list cache. */
export function removeWorkoutLogInListQueryData(
  old: WorkoutLog[] | undefined,
  params: {
    machineCode: string;
    logDate: string;
    targetMuscleGroup?: string;
  }
): WorkoutLog[] | undefined {
  if (old === undefined) return old;
  if (!Array.isArray(old)) return old;
  if (old.length > 0) {
    const sample = old[0];
    if (!sample || typeof sample !== 'object' || !('setWeightsKg' in sample)) {
      return old;
    }
  }
  return removeWorkoutLogFromCache(old, params);
}
