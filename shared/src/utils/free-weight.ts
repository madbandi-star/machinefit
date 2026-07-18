import type { TargetMuscleGroup } from '../constants/workout-goals.js';

export function isFreeWeightMachineCode(machineCode: string): boolean {
  return machineCode.startsWith('FW_');
}

export function normalizeWorkoutLogTargetMuscle(
  machineCode: string,
  targetMuscleGroup?: TargetMuscleGroup | null
): string {
  if (!isFreeWeightMachineCode(machineCode)) return '';
  return targetMuscleGroup ?? '';
}
