/**
 * Per-document legal versions. Bump a field when that document’s copy changes.
 * Required reconsent is gated on `terms` + `privacy` matching these values.
 */
/**
 * Per-document versions. Consent re-check uses terms/privacy/location/marketing.
 * commerce/community/copyright/ai/security/illegalUse are display-only (footer/legal pages).
 */
/**
 * Stored ISO date versions compare lexicographically. A newer stamp still
 * satisfies an older server constant (Pages/Render skew after a doc bump).
 */
export function legalVersionSatisfies(
  stored: string | null | undefined,
  current: string
): boolean {
  if (!stored) return false;
  return stored >= current;
}

export const LEGAL_DOC_VERSIONS = {
  terms: '2026-08-15',
  /** Bumped when privacy copy is aligned to live processing (ops/usage/storage/GPS). */
  privacy: '2026-08-18',
  location: '2026-08-17',
  marketing: '2026-08-17',
  commerce: '2026-08-14',
  community: '2026-08-10',
  copyright: '2026-08-14',
  ai: '2026-08-10',
  security: '2026-08-12',
  /** Display-only notice — not part of consent re-check. */
  illegalUse: '2026-08-11',
  /**
   * Feature-scoped consents (settings profile forms).
   * Not part of needsRequiredConsent — gated on save of body/birth/location-gym fields only.
   */
  bodyMetrics: '2026-08-16',
  birthProfile: '2026-08-16',
  locationGym: '2026-08-16',
} as const;

/** Consent fields persisted / compared for needsConsent. */
export const LEGAL_CONSENT_VERSION_KEYS = [
  'terms',
  'privacy',
  'location',
  'marketing',
] as const;

/**
 * Platform operator disclosure for e-commerce footer.
 * Fill real values before paid production open — do not invent registration numbers.
 */
export const BUSINESS_OPERATOR = {
  serviceName: 'MachineFit',
  /** 상호 — set when registered */
  tradeName: '',
  /** 대표자 */
  representative: '',
  /** 사업자등록번호 */
  businessRegistrationNumber: '',
  /** 통신판매업 신고번호 */
  mailOrderRegistrationNumber: '',
  /** 사업장 주소 */
  address: '',
  /** 고객센터 이메일 */
  supportEmail: 'machinefit.official@gmail.com',
  /** 고객센터 전화 (선택) */
  supportPhone: '',
} as const;

export type LegalConsentVersionKey = (typeof LEGAL_CONSENT_VERSION_KEYS)[number];

/** @deprecated Prefer LEGAL_DOC_VERSIONS — kept for existing call sites. */
export const LEGAL_DOC_VERSION = LEGAL_DOC_VERSIONS.terms;

/** Default operating region (Korea-first; expand via legal_documents.region_code). */
export const DEFAULT_LEGAL_REGION = 'KR';

export const LEGAL_REGIONS = ['KR', 'EU', 'US-CA', 'US', 'JP', 'GLOBAL'] as const;
export type LegalRegionCode = (typeof LEGAL_REGIONS)[number];

export const CONSENT_TYPES = [
  'terms',
  'privacy',
  'marketing',
  'location',
  'push_service',
  'body_metrics',
  'birth_profile',
  'location_gym',
] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

/** Profile-field feature consents (settings save gates). */
export const PROFILE_FEATURE_CONSENT_TYPES = [
  'body_metrics',
  'birth_profile',
  'location_gym',
] as const;
export type ProfileFeatureConsentType = (typeof PROFILE_FEATURE_CONSENT_TYPES)[number];

export function profileFeatureConsentVersion(
  type: ProfileFeatureConsentType
): string {
  switch (type) {
    case 'body_metrics':
      return LEGAL_DOC_VERSIONS.bodyMetrics;
    case 'birth_profile':
      return LEGAL_DOC_VERSIONS.birthProfile;
    case 'location_gym':
      return LEGAL_DOC_VERSIONS.locationGym;
  }
}

export const LEGAL_DOC_TYPES = [
  'terms',
  'privacy',
  'location',
  'marketing',
  'commerce',
  'community',
  'copyright',
  'ai_disclaimer',
] as const;
export type LegalDocType = (typeof LEGAL_DOC_TYPES)[number];

export const SUPPORT_CATEGORIES = [
  'general',
  'privacy',
  'account',
  'billing',
  'report',
  'copyright',
  'other',
] as const;
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export const SUPPORT_TICKET_STATUSES = [
  'open',
  'in_progress',
  'resolved',
  'closed',
] as const;
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const CONTENT_REPORT_REASONS = [
  'spam',
  'abuse',
  'hate',
  'nsfw',
  'copyright',
  'misinformation',
  'other',
] as const;
export type ContentReportReason = (typeof CONTENT_REPORT_REASONS)[number];
