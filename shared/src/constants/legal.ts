/**
 * Per-document legal versions. Bump a field when that document’s copy changes.
 * Required reconsent is gated on `terms` + `privacy` matching these values.
 */
/**
 * Per-document versions. Consent re-check uses terms/privacy/location/marketing.
 * commerce/community/copyright/ai/security/illegalUse are display-only (footer/legal pages).
 */
export const LEGAL_DOC_VERSIONS = {
  terms: '2026-08-10',
  privacy: '2026-08-11',
  location: '2026-08-10',
  marketing: '2026-08-10',
  commerce: '2026-08-10',
  community: '2026-08-10',
  copyright: '2026-08-10',
  ai: '2026-08-10',
  security: '2026-08-10',
  /** Display-only notice — not part of consent re-check. */
  illegalUse: '2026-08-11',
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
  supportEmail: 'support@machinefit.app',
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
] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

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
