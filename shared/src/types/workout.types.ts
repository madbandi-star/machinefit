export interface WorkoutLog {
  id: string;
  machineCode: string;
  machineName?: string;
  recommendationId?: string;
  logDate: string;
  setCount: number;
  setWeightsKg: number[];
  setCompleted?: boolean[];
  diary?: string;
  createdAt: string;
  updatedAt: string;
}
