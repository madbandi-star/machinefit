import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WorkoutSessionTimerStatus = 'idle' | 'running' | 'paused';

type WorkoutSessionTimerState = {
  status: WorkoutSessionTimerStatus;
  /** Wall-clock start of the current running segment (null when idle/paused). */
  segmentStartedAtMs: number | null;
  /** Elapsed ms from completed segments (excludes pause gaps). */
  accumulatedMs: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
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

export const useWorkoutSessionTimerStore = create<WorkoutSessionTimerState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      segmentStartedAtMs: null,
      accumulatedMs: 0,

      start: () => {
        const { status } = get();
        if (status !== 'idle') return;
        set({
          status: 'running',
          segmentStartedAtMs: Date.now(),
          accumulatedMs: 0,
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

      end: () => {
        set({
          status: 'idle',
          segmentStartedAtMs: null,
          accumulatedMs: 0,
        });
      },
    }),
    { name: 'machinefit-workout-session-timer' }
  )
);
