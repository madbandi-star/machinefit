export interface TimerHistoryDaySummary {
  sessionCount: number;
  totalDurationSeconds: number;
  lapCount: number;
}

export type TimerHistoryMonthDays = Record<string, TimerHistoryDaySummary>;

export interface TimerHistoryMonthResponse {
  year: number;
  month: number;
  days: TimerHistoryMonthDays;
}

export interface TimerHistorySessionSummary {
  id: string;
  sessionDate: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  lapCount: number;
}

export interface TimerHistoryDayResponse {
  date: string;
  sessionCount: number;
  totalDurationSeconds: number;
  lapCount: number;
  sessions: TimerHistorySessionSummary[];
}

export interface TimerHistoryLapExercise {
  id: string;
  workoutLogId: string | null;
  machineId: string | null;
  machineCode: string | null;
  machineName: string;
  recordedAt: string | null;
  setCount?: number;
  setWeightsKg?: number[];
}

export interface TimerHistoryLap {
  id: string;
  lapNumber: number;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  exercises: TimerHistoryLapExercise[];
}

export interface TimerHistorySessionDetail extends TimerHistorySessionSummary {
  gymId: string | null;
  memberId: string | null;
  laps: TimerHistoryLap[];
}

export interface TimerHistoryCreateLapExerciseInput {
  workoutLogId?: string;
  machineCode?: string;
  machineName?: string;
  recordedAt?: string;
}

export interface TimerHistoryCreateLapInput {
  lapNumber: number;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  exercises?: TimerHistoryCreateLapExerciseInput[];
}

export interface TimerHistoryCreateInput {
  clientSessionId: string;
  sessionDate: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  gymId?: string;
  memberId?: string;
  laps: TimerHistoryCreateLapInput[];
}
