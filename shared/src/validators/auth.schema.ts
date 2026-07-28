import { z } from 'zod';
import { LEGAL_DOC_VERSION } from '../constants/legal.js';
import { experienceLevelSchema, genderSchema, workoutGoalSchema } from './user.schema.js';

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
  /** KR PIPA: under 14 requires guardian consent — we block under 14. */
  age: z.coerce.number().int().min(14).max(100),
  workoutGoal: workoutGoalSchema,
  homeGymId: z.string().uuid().optional(),
  homeGymName: z.string().min(1).max(120).optional(),
  experienceLevel: experienceLevelSchema,
  /** Required consents — must be true to register. */
  agreeTerms: z
    .boolean()
    .refine((v) => v === true, { message: 'Terms of service must be accepted' }),
  agreePrivacy: z
    .boolean()
    .refine((v) => v === true, { message: 'Privacy policy must be accepted' }),
  /** Optional marketing / event notifications. */
  agreeMarketing: z.boolean().optional().default(false),
  /** Optional location (GPS / region) processing consent. */
  agreeLocation: z.boolean().optional().default(false),
  legalVersion: z.string().min(1).max(32).optional().default(LEGAL_DOC_VERSION),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Optional body token for one-time migration from JS-held refresh tokens. */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const marketingPrefSchema = z.object({
  marketingOptIn: z.boolean(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MarketingPrefInput = z.infer<typeof marketingPrefSchema>;
