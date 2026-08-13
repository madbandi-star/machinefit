import { MACHINE_CODES } from './machine-codes.js';

/**
 * Bodyweight load factors for MachineFit volume consistency.
 *
 * These are estimated factors based on typical bodyweight distribution in each
 * movement — NOT measured external plate/dumbbell load.
 * ("맨몸운동 부하계수는 운동 자세와 체중 분포를 기반으로 한 추정값이며
 * 실제 외부 중량과 동일한 의미가 아닙니다.")
 */
export const BODYWEIGHT_LOAD_FACTOR_NOTE =
  '맨몸운동 부하계수는 운동 자세와 체중 분포를 기반으로 한 추정값이며 실제 외부 중량과 동일한 의미가 아닙니다.';

/** Fallback for bodyweight machines without a specific factor. */
export const DEFAULT_BODYWEIGHT_LOAD_FACTOR = 0.5;

/**
 * Canonical defaults keyed by machine code.
 * Admin/DB override (machines.bodyweight_load_factor) wins when present.
 */
export const BODYWEIGHT_LOAD_FACTORS: Readonly<Record<string, number>> = {
  [MACHINE_CODES.BW_PULL_UP]: 1.0,
  [MACHINE_CODES.BW_CHIN_UP]: 1.0,
  [MACHINE_CODES.BW_DIPS]: 0.9,
  [MACHINE_CODES.BW_BULGARIAN_SPLIT_SQUAT]: 0.85,
  [MACHINE_CODES.BW_LUNGE]: 0.8,
  [MACHINE_CODES.BW_SQUAT]: 0.75,
  [MACHINE_CODES.BW_PUSH_UP]: 0.65,
  [MACHINE_CODES.BW_STEP_UP]: 0.8,
  [MACHINE_CODES.BW_HINDU_SQUAT]: 0.75,
  [MACHINE_CODES.BW_PISTOL_SQUAT]: 0.75,
  [MACHINE_CODES.BW_INCLINE_PUSH_UP]: 0.55,
  [MACHINE_CODES.BW_DECLINE_PUSH_UP]: 0.7,
  [MACHINE_CODES.BW_PIKE_PUSH_UP]: 0.7,
  [MACHINE_CODES.BW_HANDSTAND_PUSH_UP]: 0.8,
  [MACHINE_CODES.BW_BENCH_DIPS]: 0.75,
  [MACHINE_CODES.BW_BURPEE]: 0.7,
  [MACHINE_CODES.BW_MOUNTAIN_CLIMBER]: 0.5,
  [MACHINE_CODES.BW_PLANK]: 0.5,
  [MACHINE_CODES.BW_SIDE_PLANK]: 0.5,
  [MACHINE_CODES.BW_CRUNCH]: 0.5,
  [MACHINE_CODES.BW_SIT_UP]: 0.5,
  [MACHINE_CODES.BW_LEG_RAISE]: 0.55,
  [MACHINE_CODES.BW_HANGING_LEG_RAISE]: 1.0,
  [MACHINE_CODES.BW_V_UP]: 0.5,
  [MACHINE_CODES.BW_RUSSIAN_TWIST]: 0.5,
  [MACHINE_CODES.BW_SUPERMAN]: 0.5,
  [MACHINE_CODES.BW_BACK_EXTENSION]: 0.6,
  [MACHINE_CODES.BW_GLUTE_BRIDGE]: 0.6,
  [MACHINE_CODES.BW_HIP_THRUST]: 0.6,
  [MACHINE_CODES.BW_CALF_RAISE]: 0.9,
  [MACHINE_CODES.BW_WALL_SIT]: 0.75,
} as const;

export const LOAD_TYPES = ['external_weight', 'bodyweight_estimated'] as const;
export type LoadType = (typeof LOAD_TYPES)[number];

export function isBodyweightMachineCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return code.toUpperCase().startsWith('BW_');
}

export function isBodyweightMachineType(machineType: string | null | undefined): boolean {
  return (machineType ?? '').toLowerCase() === 'bodyweight';
}

export function isBodyweightExercise(options: {
  machineCode?: string | null;
  machineType?: string | null;
}): boolean {
  return (
    isBodyweightMachineCode(options.machineCode) ||
    isBodyweightMachineType(options.machineType)
  );
}

/** Valid factor range for typical bodyweight moves (0 exclusive .. 1.5 inclusive). */
export function isValidBodyweightLoadFactor(value: unknown): value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false;
  return value > 0 && value <= 1.5;
}

/**
 * Resolve load factor: DB override → code map → default (bodyweight only).
 * Returns null when the exercise is not bodyweight.
 */
export function resolveBodyweightLoadFactor(options: {
  machineCode?: string | null;
  machineType?: string | null;
  dbFactor?: number | null;
}): number | null {
  if (!isBodyweightExercise(options)) return null;
  if (isValidBodyweightLoadFactor(options.dbFactor)) {
    return options.dbFactor;
  }
  const code = (options.machineCode ?? '').toUpperCase();
  const mapped = BODYWEIGHT_LOAD_FACTORS[code];
  if (isValidBodyweightLoadFactor(mapped)) return mapped;
  return DEFAULT_BODYWEIGHT_LOAD_FACTOR;
}

/** Usable body weight for estimation (rejects null/0/negative/out-of-range). */
export function isUsableBodyWeightKg(value: unknown): value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false;
  return value >= 30 && value <= 300;
}

/** Round estimated load to 1 decimal (do not snap to plate increments). */
export function roundBodyweightEstimatedLoadKg(kg: number): number {
  return Math.round(kg * 10) / 10;
}

/**
 * estimatedLoadKg = bodyWeightKg × loadFactor
 * Returns null when inputs are invalid (never invent 0 kg as a real load).
 */
export function estimateBodyweightLoadKg(
  bodyWeightKg: number | null | undefined,
  loadFactor: number | null | undefined
): number | null {
  if (!isUsableBodyWeightKg(bodyWeightKg)) return null;
  if (!isValidBodyweightLoadFactor(loadFactor)) return null;
  return roundBodyweightEstimatedLoadKg(bodyWeightKg * loadFactor);
}
