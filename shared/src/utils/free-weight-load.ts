import { MACHINE_CODES } from '../constants/machine-codes.js';

/**
 * Free-weight load semantics for MachineFit.
 *
 * - Barbell / Smith: logged & recommended kg = **total bar load** (bar + plates).
 *   The bar is NOT added on top of the number — users enter the total they lift.
 * - Dumbbell: logged & recommended kg = **per hand**. Volume multiplies by 2
 *   (both hands) when computing session volume.
 * - Kettlebell / Cable: logged kg = the implement / stack weight as used
 *   (single implement; no bilateral multiplier).
 */
export type FreeWeightLoadMode = 'total_bar' | 'per_hand' | 'implement' | 'stack';

export function resolveFreeWeightLoadMode(
  machineCode: string | null | undefined
): FreeWeightLoadMode | null {
  if (!machineCode || !machineCode.toUpperCase().startsWith('FW_')) return null;
  const code = machineCode.toUpperCase();
  if (code === MACHINE_CODES.FW_BARBELL || code === MACHINE_CODES.FW_SMITH) {
    return 'total_bar';
  }
  if (code === MACHINE_CODES.FW_DUMBBELL) return 'per_hand';
  if (code === MACHINE_CODES.FW_KETTLEBELL) return 'implement';
  if (code === MACHINE_CODES.FW_CABLE) return 'stack';
  return 'implement';
}

/** Bilateral volume multiplier (dumbbell per-hand → both hands). */
export function resolveFreeWeightVolumeMultiplier(
  machineCode: string | null | undefined
): number {
  return resolveFreeWeightLoadMode(machineCode) === 'per_hand' ? 2 : 1;
}

/** i18n key suffix under machines:workoutLog.loadSemantics.* */
export function freeWeightLoadSemanticsKey(
  machineCode: string | null | undefined
): string | null {
  const mode = resolveFreeWeightLoadMode(machineCode);
  if (!mode) return null;
  return mode;
}
