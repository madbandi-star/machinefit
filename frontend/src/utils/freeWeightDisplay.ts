import { isFreeWeightMachineCode } from '@machinefit/shared';

/** Free-weight machines use user-selected target muscle, not the machine's default muscleGroup. */
export function shouldShowDefaultMachineMuscle(machineCode: string): boolean {
  return !isFreeWeightMachineCode(machineCode);
}

/**
 * Prefix brand for selectorized/plate machines so same-named models
 * (e.g. Cybex vs Hammer Strength "레그 컬") stay distinguishable in records.
 * Free-weight labels stay equipment-only (muscle is appended separately).
 */
export function formatBrandedMachineLabel(
  machineName: string,
  brandName?: string | null,
  machineCode?: string
): string {
  if (!brandName?.trim()) return machineName;
  if (machineCode && isFreeWeightMachineCode(machineCode)) return machineName;
  return `${brandName.trim()} · ${machineName}`;
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

export function formatFreeWeightRecordLabel(
  machineName: string,
  targetMuscleGroup: string | undefined,
  translateMuscleGroup: (group: string) => string
): string {
  if (!targetMuscleGroup) return machineName;
  return `${machineName} · ${translateMuscleGroup(targetMuscleGroup)}`;
}
