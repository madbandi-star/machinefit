-- Polar Premium subscription layer (additive on 097 foundation).
-- Syncs denormalized users.* membership cache; adds coupons, billing_logs,
-- referral_history rewards, webhook_events idempotency.
-- Rollback notes at bottom.

-- ── plan_master: Polar product mapping + Premium ₩3,000 ─────────────
ALTER TABLE plan_master
  ADD COLUMN IF NOT EXISTS polar_product_id TEXT,
  ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE plan_master
SET
  price_cents = 3000,
  currency = 'KRW',
  billing_period = 'month',
  trial_days = 7,
  description = '{"ko":"월 3,000원 Premium · 체육관·멤버 한도 확장","en":"₩3,000/mo Premium · expanded gym & member limits"}'::jsonb,
  updated_at = NOW()
WHERE code = 'PREMIUM';

-- ── users: denormalized Premium / Polar cache ───────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS membership_type TEXT NOT NULL DEFAULT 'FREE'
    CHECK (membership_type IN ('FREE', 'PREMIUM')),
  ADD COLUMN IF NOT EXISTS premium_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS premium_expire_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS polar_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS polar_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (subscription_status IN (
      'inactive', 'trial', 'active', 'cancelled', 'expired', 'refunded'
    )),
  ADD COLUMN IF NOT EXISTS trial_used BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill from existing columns
UPDATE users
SET
  trial_used = TRUE
WHERE trial_consumed_at IS NOT NULL AND trial_used = FALSE;

UPDATE users
SET
  membership_type = CASE
    WHEN LOWER(COALESCE(subscription_plan, 'free')) = 'premium' THEN 'PREMIUM'
    ELSE 'FREE'
  END
WHERE membership_type = 'FREE'
  AND LOWER(COALESCE(subscription_plan, 'free')) = 'premium';

CREATE INDEX IF NOT EXISTS idx_users_membership_expire
  ON users (membership_type, premium_expire_at)
  WHERE membership_type = 'PREMIUM';

CREATE INDEX IF NOT EXISTS idx_users_polar_subscription
  ON users (polar_subscription_id)
  WHERE polar_subscription_id IS NOT NULL;

-- ── billing_logs (all Polar / billing events) ───────────────────────
CREATE TABLE IF NOT EXISTS billing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ok',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_logs_user_created
  ON billing_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_logs_event_created
  ON billing_logs (event_type, created_at DESC);

-- ── webhook_events (idempotency) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'polar',
  event_type TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_processed
  ON webhook_events (processed_at DESC);

-- ── coupons ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('percent_off', 'amount_off', 'free_days')),
  -- percent_off: 1–100; amount_off: KRW won; free_days: days to extend
  value NUMERIC NOT NULL CHECK (value >= 0),
  max_redemptions INT,
  redemption_count INT NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS coupon_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  coupon_code TEXT NOT NULL,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  free_days INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, coupon_code)
);

CREATE INDEX IF NOT EXISTS idx_coupon_history_user
  ON coupon_history (user_id, created_at DESC);

-- Seed example coupons (safe to re-run)
INSERT INTO coupons (code, kind, value, max_redemptions, description)
VALUES
  ('WELCOME', 'percent_off', 50, NULL, '첫달 50% (운영 메모용 · Polar 할인 연동 시 product coupon 병행)'),
  ('FREE30', 'free_days', 30, NULL, '30일 Premium 무료 연장')
ON CONFLICT (code) DO NOTHING;

-- ── referral_history (billing reward ledger; friend codes stay in 071) ─
CREATE TABLE IF NOT EXISTS referral_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_days INT NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_history_referrer
  ON referral_history (referrer_id, created_at DESC);

-- ── payment_history: allow invoice_id alias column ──────────────────
ALTER TABLE payment_history
  ADD COLUMN IF NOT EXISTS invoice_id TEXT;

CREATE INDEX IF NOT EXISTS idx_payment_history_invoice
  ON payment_history (invoice_id)
  WHERE invoice_id IS NOT NULL;

-- Feature flags for Polar go-live
INSERT INTO feature_flags (key, enabled, description, min_plan_code, min_role_code)
VALUES
  ('checkout_enabled', TRUE, 'Polar checkout UI enabled when POLAR_* configured', NULL, NULL),
  ('referral_premium_reward', TRUE, 'Grant 30 Premium days to referrer + referred', NULL, NULL),
  ('signup_trial_auto', TRUE, 'Auto-start 7-day Premium trial on first register', 'PREMIUM', NULL)
ON CONFLICT (key) DO UPDATE
SET
  enabled = EXCLUDED.enabled,
  description = EXCLUDED.description,
  updated_at = NOW();

COMMENT ON COLUMN users.membership_type IS 'FREE | PREMIUM cache; source of truth is subscriptions';
COMMENT ON COLUMN users.subscription_status IS 'inactive|trial|active|cancelled|expired|refunded';
COMMENT ON TABLE webhook_events IS 'Polar/Standard Webhooks idempotency store';
COMMENT ON TABLE billing_logs IS 'Append-only billing event log';
COMMENT ON TABLE coupons IS 'Admin coupons (percent/amount/free_days)';
COMMENT ON TABLE referral_history IS 'One reward row per referred user';

-- Rollback (manual):
-- DROP TABLE IF EXISTS referral_history;
-- DROP TABLE IF EXISTS coupon_history;
-- DROP TABLE IF EXISTS coupons;
-- DROP TABLE IF EXISTS webhook_events;
-- DROP TABLE IF EXISTS billing_logs;
-- ALTER TABLE payment_history DROP COLUMN IF EXISTS invoice_id;
-- ALTER TABLE plan_master DROP COLUMN IF EXISTS polar_product_id, DROP COLUMN IF EXISTS meta;
-- ALTER TABLE users DROP COLUMN IF EXISTS membership_type, DROP COLUMN IF EXISTS premium_started_at,
--   DROP COLUMN IF EXISTS premium_expire_at, DROP COLUMN IF EXISTS polar_customer_id,
--   DROP COLUMN IF EXISTS polar_subscription_id, DROP COLUMN IF EXISTS subscription_status,
--   DROP COLUMN IF EXISTS trial_used;
