import type { WorkoutGoal } from '../constants/workout-goals.js';

/** Default rest between sets: 1 min 30 sec (matches prior hypertrophy baseline). */
export const REST_DURATION = {
  defaultSeconds: 90,
  minSeconds: 0,
  /** Cap at 30 minutes. */
  maxSeconds: 30 * 60,
  maxMinutes: 30,
} as const;

export function clampRestDurationSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return REST_DURATION.defaultSeconds;
  return Math.min(
    REST_DURATION.maxSeconds,
    Math.max(REST_DURATION.minSeconds, Math.round(seconds))
  );
}

export function restDurationParts(totalSeconds: number): { minutes: number; seconds: number } {
  const clamped = clampRestDurationSeconds(totalSeconds);
  return {
    minutes: Math.floor(clamped / 60),
    seconds: clamped % 60,
  };
}

export function restDurationFromParts(minutes: number, seconds: number): number {
  const m = Number.isFinite(minutes) ? Math.round(minutes) : 0;
  const s = Number.isFinite(seconds) ? Math.round(seconds) : 0;
  return clampRestDurationSeconds(m * 60 + s);
}

const REST_SECONDS_BY_GOAL: Record<WorkoutGoal, number> = {
  hypertrophy: REST_DURATION.defaultSeconds,
  strength: 180,
  diet: 60,
  conditioning: 45,
  rehab: 120,
  posture: REST_DURATION.defaultSeconds,
};

/** @deprecated Prefer user `restDurationSeconds` from settings. Kept for callers that still pass goal. */
export function recommendRestSeconds(options: {
  workoutGoal?: WorkoutGoal;
  setIndex: number;
  weightKg?: number;
}): number {
  const base = REST_SECONDS_BY_GOAL[options.workoutGoal ?? 'hypertrophy'];
  if (options.setIndex >= 2) {
    return Math.round(base * 1.1);
  }
  return base;
}
