/**
 * Per-document legal versions. Bump a field when that document’s copy changes.
 * Required reconsent is gated on `terms` + `privacy` matching these values.
 */
export const LEGAL_DOC_VERSIONS = {
  terms: '2026-07-25',
  privacy: '2026-07-25',
  location: '2026-07-25',
  marketing: '2026-07-25',
} as const;

export type LegalConsentVersionKey = keyof typeof LEGAL_DOC_VERSIONS;

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
