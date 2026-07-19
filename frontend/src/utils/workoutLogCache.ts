import type { WorkoutLog } from '@machinefit/shared';
import { normalizeDateKey } from '@/utils/historyDate';

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
