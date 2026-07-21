import type { TargetMuscleGroup } from '../constants/workout-goals.js';

export function isFreeWeightMachineCode(machineCode: string): boolean {
  return machineCode.startsWith('FW_');
}

/**
 * Free-weight equipment can train any target muscle (incl. biceps/triceps/arms/core).
 * Catalog `muscle_group` is only a default label — search/filter must not hide FW_* machines.
 */
export function machineMatchesMuscleGroupFilter(
  machineCode: string,
  machineMuscleGroup: string,
  filterMuscleGroup: string
): boolean {
  if (machineMuscleGroup === filterMuscleGroup) return true;
  if (machineMuscleGroup === 'full_body') return true;
  if (isFreeWeightMachineCode(machineCode)) return true;
  return false;
}

export function normalizeWorkoutLogTargetMuscle(
  machineCode: string,
  targetMuscleGroup?: TargetMuscleGroup | null
): string {
  if (!isFreeWeightMachineCode(machineCode)) return '';
  return targetMuscleGroup ?? '';
}
