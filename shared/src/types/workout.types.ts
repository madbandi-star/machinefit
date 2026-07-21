import type { TargetMuscleGroup } from '../constants/workout-goals.js';

export interface WorkoutLog {
  id: string;
  gymId: string;
  machineCode: string;
  machineName?: string;
  /** Localized brand label for disambiguating same-named machines (e.g. Cybex vs HS Leg Curl). */
  brandName?: string;
  recommendationId?: string;
  logDate: string;
  targetMuscleGroup?: TargetMuscleGroup;
  setCount: number;
  setWeightsKg: number[];
  setCompleted?: boolean[];
  diary?: string;
  createdAt: string;
  updatedAt: string;
}
