/** Bump when legal copy changes — stored on user_consents.version */
export const LEGAL_DOC_VERSION = '2026-07-25';

export const CONSENT_TYPES = ['terms', 'privacy', 'marketing'] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];
