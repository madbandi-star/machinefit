/**
 * Operational retention windows for privacy hardening jobs.
 * Days are product defaults — legal statutory periods may differ [법률전문가 확인 필요].
 */
export const DATA_RETENTION = {
  /**
   * Legacy defensive scrub for any leftover lat/lng on user_locations.
   * Product does not collect member GPS; upsert always nulls coordinates.
   */
  gpsCoordinatesDays: 30,
  /** Null out consent IP/UA after this many days (keep consent fact/version). */
  consentIpMetaDays: 365,
  /** Delete auth_login_events older than this. */
  loginEventsDays: 365,
  /** Delete banner impression/click rows (session id only; no member user id). */
  bannerEventsDays: 90,
  /** Ops aggregated page/feature stats and per-user activity days. */
  opsStatsDays: 365,
  /** Ops application access/error log rows. */
  opsAppLogsDays: 180,
  opsErrorEventsDays: 365,
  /**
   * After deactivate, wait this many days then hard-purge non-legal-hold user data
   * (workouts, favorites, friends, UGC, usage, ops user activity).
   * Payments/consents/trial identity/OAuth withdrawal archive retained longer (no auto-delete job).
   */
  deactivatedAccountPurgeDays: 30,
} as const;
