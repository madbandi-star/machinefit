import { BRAND_CODES } from '@machinefit/shared';
import type { Machine } from '@machinefit/shared';

export type EquipmentScope = 'machines_only' | 'all';

export const NON_MACHINE_BRAND_CODES: readonly string[] = [
  BRAND_CODES.BODYWEIGHT,
  BRAND_CODES.FREE_WEIGHT,
];

export function isMachineOnlyEquipment(machine: Machine): boolean {
  if (machine.code.startsWith('BW_') || machine.code.startsWith('FW_')) {
    return false;
  }
  if (machine.machineType === 'bodyweight' || machine.machineType === 'free_weight') {
    return false;
  }
  return true;
}

export function filterMachinesByEquipmentScope(
  machines: Machine[],
  scope: EquipmentScope
): Machine[] {
  if (scope === 'all') return machines;
  return machines.filter(isMachineOnlyEquipment);
}

export function isNonMachineBrandCode(brandCode: string): boolean {
  return NON_MACHINE_BRAND_CODES.includes(brandCode);
}
