const BARBELL_LIKE_CODES = new Set(['FW_BARBELL', 'FW_SMITH']);

export function getWeightStepKg(machineCode?: string): number {
  if (machineCode && BARBELL_LIKE_CODES.has(machineCode)) {
    return 5;
  }
  return 2.5;
}

export function roundToWeightStep(value: number, step: number): number {
  const decimals = step % 1 === 0 ? 0 : 1;
  return Number(value.toFixed(decimals));
}
