import { z } from 'zod';
import { experienceLevelSchema, genderSchema } from './user.schema.js';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(2).max(100),
  gender: genderSchema,
  languageCode: z.enum(['ko', 'en', 'ja', 'zh']).optional(),
  unitHeight: z.enum(['cm', 'ft_in']).optional(),
  unitWeight: z.enum(['kg', 'lb']).optional(),
  heightCm: z.coerce.number().min(100).max(250),
  weightKg: z.coerce.number().min(30).max(300),
  experienceLevel: experienceLevelSchema,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
