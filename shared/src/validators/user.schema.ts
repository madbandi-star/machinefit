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

const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')
  .nullable();
const birthTimeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'HH:mm')
  .nullable();

export const updateProfileSchema = z
  .object({
    displayName: z.string().min(2).max(100).optional(),
    gender: genderSchema.optional(),
    heightCm: z.number().min(100).max(250).optional(),
    weightKg: z.number().min(30).max(300).optional(),
    age: z.number().int().min(13).max(100).optional(),
    birthDate: birthDateSchema.optional(),
    birthTime: birthTimeSchema.optional(),
    birthTimeUnknown: z.boolean().optional(),
    workoutGoal: workoutGoalSchema.optional(),
    homeGymId: z.string().uuid().nullable().optional(),
    homeGymName: z.string().min(1).max(120).nullable().optional(),
    unitHeight: z.enum(['cm', 'ft_in']).optional(),
    unitWeight: z.enum(['kg', 'lb']).optional(),
    experienceLevel: experienceLevelSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.birthTimeUnknown === true && data.birthTime != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'birthTime must be null when birthTimeUnknown is true',
        path: ['birthTime'],
      });
    }
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** Profile is ready for 헬창운세 when birth date + (time or unknown). */
export function hasFortuneBirthProfile(input: {
  birthDate?: string | null;
  birthTime?: string | null;
  birthTimeUnknown?: boolean;
}): boolean {
  if (!input.birthDate) return false;
  if (input.birthTimeUnknown) return true;
  return Boolean(input.birthTime && /^\d{2}:\d{2}/.test(input.birthTime));
}
