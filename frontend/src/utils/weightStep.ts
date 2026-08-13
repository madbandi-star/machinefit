import { isBodyweightMachineCode, MACHINE_CODES } from '@machinefit/shared';

/** Workout / machine weight increments (kg). Body profile weight uses 1 kg steps in ScrollPicker. */
export const WORKOUT_WEIGHT_STEP_KG = 5;

/**
 * Stepper increment by equipment:
 * - Bodyweight estimated load → 0.5 kg
 * - Dumbbell / kettlebell → 1 kg (common commercial increments)
 * - Barbell / smith / machines → 5 kg plate snap
 */
export function getWeightStepKg(machineCode?: string): number {
  if (machineCode && isBodyweightMachineCode(machineCode)) return 0.5;
  const code = (machineCode ?? '').toUpperCase();
  if (code === MACHINE_CODES.FW_DUMBBELL || code === MACHINE_CODES.FW_KETTLEBELL) {
    return 1;
  }
  return WORKOUT_WEIGHT_STEP_KG;
}

export function roundToWeightStep(value: number, step: number): number {
  if (!(step > 0) || !Number.isFinite(value)) return value;
  const snapped = Math.round(value / step) * step;
  const decimals = step % 1 === 0 ? 0 : String(step).split('.')[1]?.length ?? 1;
  return Number(snapped.toFixed(decimals));
}
