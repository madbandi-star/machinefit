import { z } from 'zod';

export const recommendationSchema = z.object({
  machineCode: z.string().min(1).max(80),
  gender: z.enum(['male', 'female', 'other']),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(300).optional(),
  experienceLevel: z.enum([
    'beginner',
    'intermediate',
    'advanced',
    'professional',
  ]),
  unitHeight: z.enum(['cm', 'ft_in']).optional(),
  unitWeight: z.enum(['kg', 'lb']).optional(),
});

export type RecommendationInputSchema = z.infer<typeof recommendationSchema>;
