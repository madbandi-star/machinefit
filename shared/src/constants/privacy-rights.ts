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
] as const;
export type PrivacyRightsRequestStatus = (typeof PRIVACY_RIGHTS_REQUEST_STATUSES)[number];

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
  if (status === 'completed' || status === 'rejected') return 'done';
  const due = new Date(dueAtIso).getTime();
  const ms = due - now.getTime();
  if (ms < 0) return 'overdue';
  if (ms <= PRIVACY_RIGHTS_DUE_SOON_DAYS * 24 * 60 * 60 * 1000) return 'soon';
  return 'ok';
}

/**
 * Categories shown when user requests deletion — what can be removed vs legally retained.
 * Engineering inventory aligned with docs/privacy-data-inventory.md.
 */
export const PRIVACY_DELETION_INVENTORY = {
  deletable: [
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
  ],
  retained: [
    'payment_subscription',
    'user_consents_proof',
    'trial_identity',
    'auth_provider_withdrawals',
    'admin_audit_logs',
    'legal_holds',
  ],
} as const;
