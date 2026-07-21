import { z } from 'zod';
import { genderSchema } from './user.schema.js';
import { TARGET_MUSCLE_GROUPS, WORKOUT_GOALS } from '../constants/workout-goals.js';
import { gymIdSchema, memberIdSchema } from './gym-scope.schema.js';

export const recommendationSchema = z.object({
  machineCode: z.string().min(1).max(80),
  gender: genderSchema,
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(300),
  experienceLevel: z.enum([
    'beginner',
    'intermediate',
    'advanced',
    'professional',
  ]),
  unitHeight: z.enum(['cm', 'ft_in']).optional(),
  unitWeight: z.enum(['kg', 'lb']).optional(),
  targetMuscleGroup: z.enum(TARGET_MUSCLE_GROUPS).optional(),
  age: z.number().int().min(13).max(100).optional(),
  workoutGoal: z.enum(WORKOUT_GOALS).optional(),
  weightDifficulty: z.number().min(0.1).max(10).optional(),
  gymId: gymIdSchema.optional(),
  memberId: memberIdSchema.optional(),
});

export type RecommendationInputSchema = z.infer<typeof recommendationSchema>;
