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
