export const WORKOUT_GOALS = [
  'hypertrophy',
  'strength',
  'diet',
  'conditioning',
  'rehab',
  'posture',
] as const;

export type WorkoutGoal = (typeof WORKOUT_GOALS)[number];

export const TARGET_MUSCLE_GROUPS = [
  'back',
  'chest',
  'legs',
  'shoulders',
  'biceps',
  'triceps',
] as const;

export type TargetMuscleGroup = (typeof TARGET_MUSCLE_GROUPS)[number];
