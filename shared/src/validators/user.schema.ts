import { z } from 'zod';
import { WORKOUT_GOALS } from '../constants/workout-goals.js';

export const experienceLevelSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
  'professional',
]);

export const genderSchema = z.enum(['male', 'female']);

export const workoutGoalSchema = z.enum(WORKOUT_GOALS);

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  gender: genderSchema.optional(),
  heightCm: z.number().min(100).max(250).optional(),
  weightKg: z.number().min(30).max(300).optional(),
  age: z.number().int().min(13).max(100).optional(),
  workoutGoal: workoutGoalSchema.optional(),
  homeGymId: z.string().uuid().nullable().optional(),
  homeGymName: z.string().min(1).max(120).nullable().optional(),
  unitHeight: z.enum(['cm', 'ft_in']).optional(),
  unitWeight: z.enum(['kg', 'lb']).optional(),
  experienceLevel: experienceLevelSchema.optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
