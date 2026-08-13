/**
 * Re-export bodyweight load helpers from constants for utils consumers.
 * Single source of truth remains `constants/bodyweight-load.ts`.
 */
export {
  BODYWEIGHT_LOAD_FACTOR_NOTE,
  BODYWEIGHT_LOAD_FACTORS,
  DEFAULT_BODYWEIGHT_LOAD_FACTOR,
  LOAD_TYPES,
  estimateBodyweightLoadKg,
  isBodyweightExercise,
  isBodyweightMachineCode,
  isBodyweightMachineType,
  isUsableBodyWeightKg,
  isValidBodyweightLoadFactor,
  resolveBodyweightLoadFactor,
  roundBodyweightEstimatedLoadKg,
  type LoadType,
} from '../constants/bodyweight-load.js';
