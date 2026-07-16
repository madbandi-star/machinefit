export const MUSCLE_GROUPS = ['back', 'chest', 'legs', 'shoulders'] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
