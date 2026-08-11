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
  start: () => void;
  pause: () => void;
  resume: () => void;
  lap: () => void;
  end: () => void;
};

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

      start: () => {
        const { status } = get();
        if (status !== 'idle') return;
        set({
          status: 'running',
          segmentStartedAtMs: Date.now(),
          accumulatedMs: 0,
          laps: [],
          lastLapTotalMs: 0,
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
        set({
          status: 'idle',
          segmentStartedAtMs: null,
          accumulatedMs: 0,
          // Keep laps until the next start so the session can be reviewed.
        });
      },
    }),
    { name: 'machinefit-workout-session-timer' }
  )
);
