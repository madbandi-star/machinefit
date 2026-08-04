import { z } from 'zod';
import { LEGAL_DOC_VERSION, LEGAL_DOC_VERSIONS } from '../constants/legal.js';
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

export const authProviderCodeSchema = z.enum(['google', 'kakao', 'apple'] as const);

/**
 * Client sends a provider credential after OAuth:
 * - Google / Apple: idToken (OIDC JWT)
 * - Kakao: accessToken, or authorizationCode (+ redirectUri) from JS SDK authorize()
 */
export const oauthCredentialSchema = z
  .object({
    idToken: z.string().min(1).optional(),
    accessToken: z.string().min(1).optional(),
    authorizationCode: z.string().min(1).optional(),
    redirectUri: z.string().url().optional(),
    displayName: z.string().min(1).max(100).optional(),
  })
  .refine((v) => Boolean(v.idToken || v.accessToken || v.authorizationCode), {
    message: 'idToken, accessToken, or authorizationCode is required',
  })
  .refine((v) => !v.authorizationCode || Boolean(v.redirectUri), {
    message: 'redirectUri is required when authorizationCode is provided',
  });

/** Complete OAuth signup after required terms acceptance. */
export const oauthCompleteSchema = z.object({
  pendingToken: z.string().min(1),
  agreeTerms: z
    .boolean()
    .refine((v) => v === true, { message: 'Terms of service must be accepted' }),
  agreePrivacy: z
    .boolean()
    .refine((v) => v === true, { message: 'Privacy policy must be accepted' }),
  agreeMarketing: z.boolean().optional().default(false),
  agreeLocation: z.boolean().optional().default(false),
  termsVersion: z.string().min(1).max(32).optional().default(LEGAL_DOC_VERSIONS.terms),
  privacyVersion: z.string().min(1).max(32).optional().default(LEGAL_DOC_VERSIONS.privacy),
  locationVersion: z.string().min(1).max(32).optional().default(LEGAL_DOC_VERSIONS.location),
  marketingVersion: z.string().min(1).max(32).optional().default(LEGAL_DOC_VERSIONS.marketing),
});

/** Accept/update required (+ optional) consents for an authenticated user (version bump). */
export const consentAcceptSchema = z.object({
  agreeTerms: z
    .boolean()
    .refine((v) => v === true, { message: 'Terms of service must be accepted' }),
  agreePrivacy: z
    .boolean()
    .refine((v) => v === true, { message: 'Privacy policy must be accepted' }),
  agreeMarketing: z.boolean().optional().default(false),
  agreeLocation: z.boolean().optional().default(false),
  termsVersion: z.string().min(1).max(32).optional().default(LEGAL_DOC_VERSIONS.terms),
  privacyVersion: z.string().min(1).max(32).optional().default(LEGAL_DOC_VERSIONS.privacy),
  locationVersion: z.string().min(1).max(32).optional().default(LEGAL_DOC_VERSIONS.location),
  marketingVersion: z.string().min(1).max(32).optional().default(LEGAL_DOC_VERSIONS.marketing),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MarketingPrefInput = z.infer<typeof marketingPrefSchema>;
export type OAuthCredentialInput = z.infer<typeof oauthCredentialSchema>;
export type OAuthCompleteInput = z.infer<typeof oauthCompleteSchema>;
export type ConsentAcceptInput = z.infer<typeof consentAcceptSchema>;
