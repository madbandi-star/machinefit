import { isFreeWeightMachineCode } from '@machinefit/shared';

/** Free-weight machines use user-selected target muscle, not the machine's default muscleGroup. */
export function shouldShowDefaultMachineMuscle(machineCode: string): boolean {
  return !isFreeWeightMachineCode(machineCode);
}

function normalizeLabelPart(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** True when machineName already begins with the brand (common/standard catalogs often bake it in). */
export function machineNameIncludesBrand(
  machineName: string,
  brandName?: string | null
): boolean {
  const brand = brandName?.trim();
  if (!brand) return false;
  const nameNorm = normalizeLabelPart(machineName);
  const brandNorm = normalizeLabelPart(brand);
  if (!nameNorm || !brandNorm) return false;
  if (nameNorm === brandNorm) return true;
  if (nameNorm.startsWith(`${brandNorm} `)) return true;
  if (nameNorm.startsWith(`${brandNorm}·`)) return true;
  if (nameNorm.startsWith(`${brandNorm} ·`)) return true;
  return false;
}

/**
 * Drop a leading brand prefix from catalog names that bake brand into `name`
 * (e.g. "아스날 스트렝스 어브도미널" → "어브도미널"). Brand stays visible separately in list UI.
 */
export function stripBrandFromMachineName(
  machineName: string,
  brandName?: string | null
): string {
  const name = machineName.trim().replace(/\s+/g, ' ');
  const brand = brandName?.trim().replace(/\s+/g, ' ');
  if (!name || !brand) return name;
  if (!machineNameIncludesBrand(name, brand)) return name;
  if (normalizeLabelPart(name) === normalizeLabelPart(brand)) return name;

  const nameLower = name.toLowerCase();
  const brandLower = brand.toLowerCase();
  const separators = [`${brandLower} · `, `${brandLower} ·`, `${brandLower}· `, `${brandLower}·`, `${brandLower} `];
  for (const prefix of separators) {
    if (nameLower.startsWith(prefix)) {
      const rest = name.slice(prefix.length).trim();
      return rest || name;
    }
  }
  return name;
}

/**
 * Prefix brand for selectorized/plate machines so same-named models
 * (e.g. Cybex vs Hammer Strength "레그 컬") stay distinguishable in records.
 * Free-weight labels stay equipment-only (muscle is appended separately).
 * Skips the prefix when the machine name already starts with the brand
 * (e.g. common equipment: "아스날 스트렝스 45° 레그 프레스").
 */
export function formatBrandedMachineLabel(
  machineName: string,
  brandName?: string | null,
  machineCode?: string
): string {
  if (!brandName?.trim()) return machineName;
  if (machineCode && isFreeWeightMachineCode(machineCode)) return machineName;
  if (machineNameIncludesBrand(machineName, brandName)) return machineName.trim();
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
