import type { TargetMuscleGroup } from '../constants/workout-goals.js';

export interface WorkoutLog {
  id: string;
  gymId: string;
  memberId: string;
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

/** Persisted per-day card position for the records screen. */
export interface WorkoutRecordDisplayOrder {
  gymId: string;
  memberId: string;
  logDate: string;
  machineCode: string;
  targetMuscleGroup?: TargetMuscleGroup;
  displayOrder: number;
}
