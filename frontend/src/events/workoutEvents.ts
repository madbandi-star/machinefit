import { WORKOUT_EVENTS, type WorkoutCompleteReport } from '@machinefit/shared';

export type WorkoutCompletedDetail = {
  report: WorkoutCompleteReport;
};

type Listener = (detail: WorkoutCompletedDetail) => void;

const listeners = new Set<Listener>();

/** Subscribe to WORKOUT_COMPLETED (session end report ready). */
export function onWorkoutCompleted(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Emit WORKOUT_COMPLETED for future hooks (streak, ads, achievements, …). */
export function emitWorkoutCompleted(detail: WorkoutCompletedDetail): void {
  for (const listener of listeners) {
    try {
      listener(detail);
    } catch {
      /* isolate subscriber failures */
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(WORKOUT_EVENTS.COMPLETED, { detail })
    );
  }
}

export { WORKOUT_EVENTS };
