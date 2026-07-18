import type { TargetMuscleGroup } from '../constants/workout-goals.js';

export interface WorkoutLog {
  id: string;
  machineCode: string;
  machineName?: string;
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
