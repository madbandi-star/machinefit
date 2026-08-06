export const WORKOUT_CARD_STATUSES = [
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'SKIPPED',
] as const;

export type WorkoutCardStatus = (typeof WORKOUT_CARD_STATUSES)[number];

/** Statuses that count toward lifted volume / completion stats. */
export const WORKOUT_CARD_STATS_STATUSES: readonly WorkoutCardStatus[] = ['COMPLETED'];
