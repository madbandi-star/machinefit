/** Payload for TODAY'S WORKOUT complete report (client-built, server-agnostic). */

export type WorkoutMvpKind = 'volume' | 'sets' | 'duration' | 'none';

export interface WorkoutDayExerciseMetric {
  machineCode: string;
  machineName: string;
  setCount: number;
  volumeKg: number;
  targetMuscleGroup?: string | null;
}

export interface WorkoutDaySummaryMetrics {
  dateKey: string;
  /** Session timer elapsed (ms); 0 if unknown. */
  durationMs: number;
  exerciseCount: number;
  setCount: number;
  totalVolumeKg: number;
  exercises: WorkoutDayExerciseMetric[];
}

export interface WorkoutDayMvp {
  kind: Exclude<WorkoutMvpKind, 'none'>;
  machineCode: string;
  machineName: string;
  valueLabel: string;
  /** i18n key suffix under workoutComplete.mvp.* */
  reasonKey: 'volume' | 'sets';
}

export interface WorkoutDayNewRecord {
  machineCode: string;
  machineName: string;
  todayVolumeKg: number;
  previousBestKg: number;
  deltaKg: number;
}

export interface WorkoutDayProgress {
  /** Percent vs 30-day average volume on days with logs; null if not comparable. */
  vsAvgPercent: number | null;
  avgVolumeKg: number;
  todayVolumeKg: number;
}

export type WorkoutOneLinerKey =
  | 'high_volume'
  | 'high_sets'
  | 'long_session'
  | 'new_record'
  | 'comeback'
  | 'light'
  | 'lower_body'
  | 'upper_body'
  | 'default';

export interface WorkoutCompletePowerSnapshot {
  balance: number;
  /** Sum of workout-related EARN points for the Seoul calendar day. */
  earnedToday: number;
}

/** Optional per-lap machines for the complete report (timer session only). */
export interface WorkoutCompleteLapExercise {
  machineCode: string;
  machineName: string;
  workoutLogId?: string;
}

export interface WorkoutCompleteLap {
  lapNumber: number;
  durationSeconds: number;
  exercises: WorkoutCompleteLapExercise[];
}

export interface WorkoutCompleteReport {
  event: 'WORKOUT_COMPLETED';
  completedAt: string;
  dateKey: string;
  summary: WorkoutDaySummaryMetrics;
  power: WorkoutCompletePowerSnapshot | null;
  mvp: WorkoutDayMvp | null;
  newRecord: WorkoutDayNewRecord | null;
  progress: WorkoutDayProgress | null;
  oneLinerKey: WorkoutOneLinerKey;
  shareTextKey: WorkoutOneLinerKey;
  /** Present only when this session has at least one lap with recorded machines. */
  laps?: WorkoutCompleteLap[] | null;
}
