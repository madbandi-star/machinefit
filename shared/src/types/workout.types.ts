import type { TargetMuscleGroup } from '../constants/workout-goals.js';
import type { LoadType } from '../constants/bodyweight-load.js';

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
  /** Body weight (kg) snapshotted at first BW save — not updated when profile weight changes. */
  bodyweightKgAtRecord?: number | null;
  /** Load factor applied at first BW save. */
  appliedLoadFactor?: number | null;
  /** external_weight vs bodyweight_estimated */
  loadType?: LoadType;
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
