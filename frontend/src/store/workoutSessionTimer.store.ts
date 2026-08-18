import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WorkoutSessionTimerStatus = 'idle' | 'running' | 'paused';

/** One stopwatch-style lap (split since previous lap / start). Pause gaps excluded. */
export type WorkoutSessionLap = {
  /** 1-based lap number within the session. */
  index: number;
  /** Interval since previous lap (or session start), excluding pause gaps. */
  splitMs: number;
  /** Cumulative elapsed at the lap mark, excluding pause gaps. */
  totalElapsedMs: number;
  /** Wall-clock when the lap was recorded (for future analytics). */
  recordedAtMs: number;
};

export type WorkoutSessionMachineMark = {
  machineCode: string;
  machineName?: string;
  workoutLogId?: string;
  recordedAtMs: number;
};

type WorkoutSessionTimerState = {
  status: WorkoutSessionTimerStatus;
  /** Wall-clock start of the current running segment (null when idle/paused). */
  segmentStartedAtMs: number | null;
  /** Elapsed ms from completed segments (excludes pause gaps). */
  accumulatedMs: number;
  /**
   * Laps for the current or last-ended session (newest first).
   * Cleared only when a new workout starts — kept after end for review.
   */
  laps: WorkoutSessionLap[];
  /** Cumulative elapsed at the last lap (0 before first lap). */
  lastLapTotalMs: number;
  /**
   * Final elapsed of the last ended session (pause gaps excluded).
   * Shown in the idle right panel until the next start.
   */
  lastEndedElapsedMs: number | null;
  /** Wall-clock when the current/last session started (for history persist). */
  sessionStartedAtMs: number | null;
  /** Idempotency key for saving history; generated on start. */
  clientSessionId: string | null;
  /** Machines recorded while this session was running or paused. */
  machineMarks: WorkoutSessionMachineMark[];
  start: () => void;
  pause: () => void;
  resume: () => void;
  lap: () => void;
  end: () => void;
  noteMachineUsed: (mark: WorkoutSessionMachineMark) => void;
};

function newClientSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const n = (Math.random() * 16) | 0;
    const v = ch === 'x' ? n : (n & 0x3) | 0x8;
    return v.toString(16);
  });
}

function flushRunningSegment(
  status: WorkoutSessionTimerStatus,
  segmentStartedAtMs: number | null,
  accumulatedMs: number,
  nowMs: number
): number {
  if (status !== 'running' || segmentStartedAtMs == null) return accumulatedMs;
  return Math.max(0, accumulatedMs + (nowMs - segmentStartedAtMs));
}

/** Elapsed workout time in ms (pause gaps excluded). Pure — safe for UI ticks. */
export function getWorkoutSessionElapsedMs(
  state: Pick<WorkoutSessionTimerState, 'status' | 'segmentStartedAtMs' | 'accumulatedMs'>,
  nowMs: number = Date.now()
): number {
  return flushRunningSegment(
    state.status,
    state.segmentStartedAtMs,
    state.accumulatedMs,
    nowMs
  );
}

export function formatWorkoutSessionElapsed(ms: number): string {
  const totalSec = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Lap split display: MM:SS under 1h, else HH:MM:SS (iPhone-style short splits). */
export function formatWorkoutSessionLap(ms: number): string {
  const totalSec = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const useWorkoutSessionTimerStore = create<WorkoutSessionTimerState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      segmentStartedAtMs: null,
      accumulatedMs: 0,
      laps: [],
      lastLapTotalMs: 0,
      lastEndedElapsedMs: null,
      sessionStartedAtMs: null,
      clientSessionId: null,
      machineMarks: [],

      start: () => {
        const { status } = get();
        if (status !== 'idle') return;
        const now = Date.now();
        set({
          status: 'running',
          segmentStartedAtMs: now,
          accumulatedMs: 0,
          laps: [],
          lastLapTotalMs: 0,
          lastEndedElapsedMs: null,
          sessionStartedAtMs: now,
          clientSessionId: newClientSessionId(),
          machineMarks: [],
        });
      },

      pause: () => {
        const { status, segmentStartedAtMs, accumulatedMs } = get();
        if (status !== 'running') return;
        const now = Date.now();
        set({
          status: 'paused',
          segmentStartedAtMs: null,
          accumulatedMs: flushRunningSegment(status, segmentStartedAtMs, accumulatedMs, now),
        });
      },

      resume: () => {
        const { status } = get();
        if (status !== 'paused') return;
        set({
          status: 'running',
          segmentStartedAtMs: Date.now(),
        });
      },

      lap: () => {
        const state = get();
        if (state.status !== 'running') return;
        const now = Date.now();
        const totalElapsedMs = getWorkoutSessionElapsedMs(state, now);
        const splitMs = Math.max(0, totalElapsedMs - state.lastLapTotalMs);
        const index = state.laps.length + 1;
        const entry: WorkoutSessionLap = {
          index,
          splitMs,
          totalElapsedMs,
          recordedAtMs: now,
        };
        set({
          laps: [entry, ...state.laps],
          lastLapTotalMs: totalElapsedMs,
        });
      },

      end: () => {
        const state = get();
        if (state.status === 'idle') return;
        const now = Date.now();
        const endedElapsedMs = getWorkoutSessionElapsedMs(state, now);
        set({
          status: 'idle',
          segmentStartedAtMs: null,
          accumulatedMs: 0,
          lastEndedElapsedMs: endedElapsedMs,
          // Keep laps / session metadata until the next start so history can persist.
        });
      },

      noteMachineUsed: (mark) => {
        const { status, machineMarks } = get();
        if (status !== 'running' && status !== 'paused') return;
        const code = mark.machineCode?.trim();
        if (!code) return;
        const recordedAtMs = mark.recordedAtMs || Date.now();
        const next: WorkoutSessionMachineMark = {
          machineCode: code,
          machineName: mark.machineName,
          workoutLogId: mark.workoutLogId,
          recordedAtMs,
        };
        const marks = Array.isArray(machineMarks) ? machineMarks : [];
        const last = marks[marks.length - 1];
        if (
          last &&
          last.machineCode === next.machineCode &&
          recordedAtMs - last.recordedAtMs < 2000
        ) {
          set({ machineMarks: [...marks.slice(0, -1), { ...last, ...next }] });
          return;
        }
        set({ machineMarks: [...marks, next].slice(-80) });
      },
    }),
    {
      name: 'machinefit-workout-session-timer',
      merge: (persisted, current) => {
        const saved =
          persisted && typeof persisted === 'object'
            ? (persisted as Partial<WorkoutSessionTimerState>)
            : {};
        return {
          ...current,
          ...saved,
          laps: Array.isArray(saved.laps) ? saved.laps : current.laps,
          machineMarks: Array.isArray(saved.machineMarks) ? saved.machineMarks : [],
          sessionStartedAtMs: saved.sessionStartedAtMs ?? current.sessionStartedAtMs ?? null,
          clientSessionId: saved.clientSessionId ?? current.clientSessionId ?? null,
        };
      },
    }
  )
);
