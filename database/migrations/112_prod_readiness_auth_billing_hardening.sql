-- Production readiness hardening:
-- 1) Single-use OAuth pending tokens (jti ledger)
-- 2) Disable unbounded FREE30 seed coupon in production
-- 3) Disable referral premium rewards until abuse controls exist
-- [법률 검토 필요] Age-14 attestation is recorded in user_consents as consent_type=age14

CREATE TABLE IF NOT EXISTS oauth_pending_jtis (
  jti UUID PRIMARY KEY,
  consumed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_pending_jtis_expires
  ON oauth_pending_jtis (expires_at)
  WHERE consumed_at IS NULL;

-- Seed coupon FREE30 had NULL max_redemptions — deactivate for paid open safety.
UPDATE coupons
SET is_active = FALSE,
    updated_at = NOW()
WHERE code = 'FREE30'
  AND is_active = TRUE;

-- Referral Premium farming: off until signup-window + caps ship.
UPDATE feature_flags
SET enabled = FALSE,
    description = 'Grant 30 Premium days to referrer + referred [disabled pending abuse controls]'
WHERE key = 'referral_premium_reward';

COMMENT ON TABLE oauth_pending_jtis IS
  'One-time OAuth signup pending token jtis; consume on /auth/oauth/complete';
