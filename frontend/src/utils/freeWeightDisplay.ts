import { isFreeWeightMachineCode } from '@machinefit/shared';

export function getMachinePrimaryDisplayName(
  machineCode: string,
  localizedName: string,
  freeWeightLabel: string
): string {
  if (isFreeWeightMachineCode(machineCode)) {
    return freeWeightLabel;
  }
  return localizedName;
}

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

export function getHistoryEquipmentSubtitle(
  machineCode: string,
  localizedName: string
): string | undefined {
  if (!isFreeWeightMachineCode(machineCode)) {
    return undefined;
  }
  return localizedName;
}
