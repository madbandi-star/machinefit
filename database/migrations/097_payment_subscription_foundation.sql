-- Payment / SaaS subscription foundation (additive only).
-- Reuses users.subscription_plan as entitlement cache; does not alter gym_members.
-- Rollback: DROP TABLE payment_history, subscriptions, feature_flags, plan_master;
--           ALTER TABLE users DROP COLUMN IF EXISTS trial_consumed_at;

-- Plan catalog (admin-editable)
CREATE TABLE IF NOT EXISTS plan_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(30) NOT NULL UNIQUE,
  name JSONB NOT NULL DEFAULT '{}'::jsonb,
  description JSONB NOT NULL DEFAULT '{}'::jsonb,
  price_cents INT NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
  billing_period VARCHAR(20) NOT NULL DEFAULT 'month'
    CHECK (billing_period IN ('once', 'week', 'month', 'year')),
  trial_days INT NOT NULL DEFAULT 0 CHECK (trial_days >= 0 AND trial_days <= 365),
  max_gyms INT NOT NULL DEFAULT 2,
  max_members_per_gym INT NOT NULL DEFAULT 2,
  display_order INT NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_master_active_order
  ON plan_master (is_active, display_order);

CREATE TRIGGER trg_plan_master_updated_at
  BEFORE UPDATE ON plan_master
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO plan_master (
  code, name, description, price_cents, currency, billing_period, trial_days,
  max_gyms, max_members_per_gym, display_order, is_active
) VALUES
  (
    'FREE',
    '{"ko":"무료","en":"Free"}'::jsonb,
    '{"ko":"기본 플랜","en":"Basic plan"}'::jsonb,
    0, 'KRW', 'month', 0, 2, 2, 10, TRUE
  ),
  (
    'PREMIUM',
    '{"ko":"프리미엄","en":"Premium"}'::jsonb,
    '{"ko":"체육관·멤버 한도 확장","en":"Expanded gym & member limits"}'::jsonb,
    9900, 'KRW', 'month', 7, 10, 10, 20, TRUE
  ),
  (
    'VIP',
    '{"ko":"VIP","en":"VIP"}'::jsonb,
    '{"ko":"최상위 플랜","en":"Top tier plan"}'::jsonb,
    19900, 'KRW', 'month', 14, 20, 20, 30, TRUE
  )
ON CONFLICT (code) DO NOTHING;

-- User SaaS subscription lifecycle (not gym_members)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plan_master(id),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELED', 'PAUSED', 'PENDING', 'FAILED')),
  start_at TIMESTAMPTZ,
  expire_at TIMESTAMPTZ,
  trial_end_at TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  payment_provider VARCHAR(40) NOT NULL DEFAULT 'dummy',
  provider_subscription_id VARCHAR(160),
  provider_customer_id VARCHAR(160),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON subscriptions (user_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_expire
  ON subscriptions (expire_at)
  WHERE status IN ('ACTIVE', 'TRIAL');

CREATE UNIQUE INDEX IF NOT EXISTS uq_subscriptions_one_live_per_user
  ON subscriptions (user_id)
  WHERE status IN ('ACTIVE', 'TRIAL', 'PAUSED', 'PENDING');

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Payment ledger (mock OK)
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  payment_provider VARCHAR(40) NOT NULL DEFAULT 'dummy',
  payment_key VARCHAR(120),
  provider_payment_id VARCHAR(160),
  order_id VARCHAR(120) NOT NULL,
  amount_cents INT NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'CANCELED', 'REFUNDED')),
  paid_at TIMESTAMPTZ,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_user_created
  ON payment_history (user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_history_order_id
  ON payment_history (order_id);

-- Feature flags (ON/OFF without code change)
CREATE TABLE IF NOT EXISTS feature_flags (
  key VARCHAR(80) PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  min_plan_code VARCHAR(30) REFERENCES plan_master(code),
  min_role_code VARCHAR(20),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO feature_flags (key, enabled, description, min_plan_code, min_role_code)
VALUES
  ('premium_gym_limits', TRUE, 'Gym/member limits from premium plan', 'PREMIUM', NULL),
  ('checkout_enabled', FALSE, 'Real checkout UI (keep off until provider live)', NULL, NULL),
  ('trial_enabled', TRUE, 'Allow one-time trial start', 'PREMIUM', NULL)
ON CONFLICT (key) DO NOTHING;

-- One trial per account (additive column on users)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS trial_consumed_at TIMESTAMPTZ;

COMMENT ON TABLE plan_master IS 'SaaS plan catalog; FREE/PREMIUM/VIP seed';
COMMENT ON TABLE subscriptions IS 'User subscription lifecycle; syncs users.subscription_plan cache';
COMMENT ON TABLE payment_history IS 'Payment ledger; dummy provider writes mock rows';
COMMENT ON TABLE feature_flags IS 'Feature gate toggles for premium surfaces';
