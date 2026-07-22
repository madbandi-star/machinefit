import { z } from 'zod';
import { TARGET_MUSCLE_GROUPS } from '../constants/workout-goals.js';

export const muscleGroupImageKeySchema = z.enum(TARGET_MUSCLE_GROUPS);

export const muscleGroupImageUploadParamsSchema = z.object({
  muscleGroup: muscleGroupImageKeySchema,
});
