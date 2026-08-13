/** Canonical workout lifecycle events for cross-feature hooks. */
export const WORKOUT_EVENTS = {
  /** User confirmed end of today's workout session (timer + report). */
  COMPLETED: 'WORKOUT_COMPLETED',
} as const;

export type WorkoutEventName = (typeof WORKOUT_EVENTS)[keyof typeof WORKOUT_EVENTS];
