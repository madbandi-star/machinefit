/**
 * Operational retention windows for privacy hardening jobs.
 * Days are product defaults — legal statutory periods may differ [법률전문가 확인 필요].
 */
export const DATA_RETENTION = {
  /** Clear precise GPS coords; keep region (시군구) rows. */
  gpsCoordinatesDays: 30,
  /** Null out consent IP/UA after this many days (keep consent fact/version). */
  consentIpMetaDays: 365,
  /** Delete auth_login_events older than this. */
  loginEventsDays: 365,
  /**
   * After deactivate, wait this many days then hard-purge non-legal-hold user data
   * (workouts, favorites, friends, UGC). Payments/consents retained longer.
   */
  deactivatedAccountPurgeDays: 30,
} as const;
