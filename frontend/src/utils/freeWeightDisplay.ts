import { isFreeWeightMachineCode } from '@machinefit/shared';

/** Free-weight machines use user-selected target muscle, not the machine's default muscleGroup. */
export function shouldShowDefaultMachineMuscle(machineCode: string): boolean {
  return !isFreeWeightMachineCode(machineCode);
}

export function getHistoryMuscleGroup(
  machineCode: string,
  machineMuscleGroup?: string,
  targetMuscleGroup?: string
): string | undefined {
  if (isFreeWeightMachineCode(machineCode)) {
    return targetMuscleGroup ?? undefined;
  }
  return machineMuscleGroup;
}
