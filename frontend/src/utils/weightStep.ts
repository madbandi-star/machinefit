/** Workout / machine weight increments (kg). Body profile weight uses 1 kg steps in ScrollPicker. */
export const WORKOUT_WEIGHT_STEP_KG = 5;

export function getWeightStepKg(_machineCode?: string): number {
  return WORKOUT_WEIGHT_STEP_KG;
}

export function roundToWeightStep(value: number, step: number): number {
  const decimals = step % 1 === 0 ? 0 : 1;
  return Number(value.toFixed(decimals));
}
