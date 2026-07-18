import type { WorkoutGoal } from '../constants/workout-goals.js';

const REST_SECONDS_BY_GOAL: Record<WorkoutGoal, number> = {
  hypertrophy: 90,
  strength: 180,
  diet: 60,
  conditioning: 45,
  rehab: 120,
  posture: 90,
};

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
