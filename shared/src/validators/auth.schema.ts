import { z } from 'zod';
import { LEGAL_DOC_VERSIONS } from '../constants/legal.js';

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
    /**
     * @deprecated Ignored. Social profile names must not become MachineFit usernames.
     * Kept optional so older clients do not fail schema validation.
     */
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
  agreeAge14: z
    .boolean()
    .refine((v) => v === true, { message: 'Age attestation (14+) is required' }),
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
  agreeAge14: z
    .boolean()
    .refine((v) => v === true, { message: 'Age attestation (14+) is required' }),
  agreeMarketing: z.boolean().optional().default(false),
  agreeLocation: z.boolean().optional().default(false),
  termsVersion: z.string().min(1).max(32).optional().default(LEGAL_DOC_VERSIONS.terms),
  privacyVersion: z.string().min(1).max(32).optional().default(LEGAL_DOC_VERSIONS.privacy),
  locationVersion: z.string().min(1).max(32).optional().default(LEGAL_DOC_VERSIONS.location),
  marketingVersion: z.string().min(1).max(32).optional().default(LEGAL_DOC_VERSIONS.marketing),
});

export type MarketingPrefInput = z.infer<typeof marketingPrefSchema>;
export type OAuthCredentialInput = z.infer<typeof oauthCredentialSchema>;
export type OAuthCompleteInput = z.infer<typeof oauthCompleteSchema>;
export type ConsentAcceptInput = z.infer<typeof consentAcceptSchema>;
