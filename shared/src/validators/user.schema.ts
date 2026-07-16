import { z } from 'zod';

export const experienceLevelSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
  'professional',
]);

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  heightCm: z.number().min(100).max(250).optional(),
  weightKg: z.number().min(30).max(300).optional(),
  unitHeight: z.enum(['cm', 'ft_in']).optional(),
  unitWeight: z.enum(['kg', 'lb']).optional(),
  experienceLevel: experienceLevelSchema.optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
