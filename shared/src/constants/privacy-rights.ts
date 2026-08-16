/** Information-subject rights request types (PIPA-style). */
export const PRIVACY_RIGHTS_REQUEST_TYPES = [
  'access',
  'correction',
  'deletion',
  'processing_stop',
  'consent_withdraw',
] as const;
export type PrivacyRightsRequestType = (typeof PRIVACY_RIGHTS_REQUEST_TYPES)[number];

export const PRIVACY_RIGHTS_REQUEST_STATUSES = [
  'received',
  'reviewing',
  'completed',
  'rejected',
  'cancelled',
] as const;
export type PrivacyRightsRequestStatus = (typeof PRIVACY_RIGHTS_REQUEST_STATUSES)[number];

/** Request types a member may cancel from Privacy Rights Center. */
export const PRIVACY_RIGHTS_USER_CANCELLABLE_TYPES = [
  'correction',
  'deletion',
  'processing_stop',
] as const;

/** Calendar days to complete correction/deletion etc. (privacy commission guideline). */
export const PRIVACY_RIGHTS_DUE_DAYS = 10;

/** Soft warning window before due date (days). */
export const PRIVACY_RIGHTS_DUE_SOON_DAYS = 3;

export function computePrivacyRightsDueAt(
  from: Date = new Date(),
  days: number = PRIVACY_RIGHTS_DUE_DAYS
): Date {
  const d = new Date(from.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function privacyRightsDueState(
  dueAtIso: string,
  status: PrivacyRightsRequestStatus,
  now: Date = new Date()
): 'ok' | 'soon' | 'overdue' | 'done' {
  if (status === 'completed' || status === 'rejected' || status === 'cancelled') return 'done';
  const due = new Date(dueAtIso).getTime();
  const ms = due - now.getTime();
  if (ms < 0) return 'overdue';
  if (ms <= PRIVACY_RIGHTS_DUE_SOON_DAYS * 24 * 60 * 60_000) return 'soon';
  return 'ok';
}

/**
 * Categories shown when user requests deletion — what can be removed vs legally retained.
 * Engineering inventory aligned with docs/privacy-data-inventory.md.
 */
export const PRIVACY_DELETION_CATEGORIES = [
  'profile_display',
  'body_metrics',
  'birth_profile',
  'location_region',
  'workout_logs',
  'templates_cards',
  'favorites_history',
  'community_ugc',
  'push_tokens',
  'optional_consents',
] as const;
export type PrivacyDeletionCategory = (typeof PRIVACY_DELETION_CATEGORIES)[number];

export const PRIVACY_RETAINED_CATEGORIES = [
  'payment_subscription',
  'user_consents_proof',
  'trial_identity',
  'auth_provider_withdrawals',
  'admin_audit_logs',
  'legal_holds',
] as const;
export type PrivacyRetainedCategory = (typeof PRIVACY_RETAINED_CATEGORIES)[number];

export const PRIVACY_DELETION_INVENTORY = {
  deletable: PRIVACY_DELETION_CATEGORIES,
  retained: PRIVACY_RETAINED_CATEGORIES,
} as const;

/** Fields an admin can auto-apply for correction requests. */
export const PRIVACY_CORRECTION_FIELD_KEYS = [
  'displayName',
  'gender',
  'heightCm',
  'weightKg',
  'age',
  'birthDate',
  'birthTime',
  'experienceLevel',
  'workoutGoal',
  'homeGymName',
  'other',
] as const;
export type PrivacyCorrectionFieldKey = (typeof PRIVACY_CORRECTION_FIELD_KEYS)[number];

export function isPrivacyDeletionCategory(value: string): value is PrivacyDeletionCategory {
  return (PRIVACY_DELETION_CATEGORIES as readonly string[]).includes(value);
}

export function isPrivacyCorrectionFieldKey(value: string): value is PrivacyCorrectionFieldKey {
  return (PRIVACY_CORRECTION_FIELD_KEYS as readonly string[]).includes(value);
}
