-- Durable free-trial consumption ledger (survives account delete / re-signup).
-- Blocks abuse: deactivate → new OAuth user → second 7-day trial.

CREATE TABLE IF NOT EXISTS trial_identity_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Normalized key: oauth:{provider}:{provider_user_id} or email:{lowercase}
  identity_key VARCHAR(320) NOT NULL,
  identity_kind VARCHAR(20) NOT NULL CHECK (identity_kind IN ('oauth', 'email')),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source VARCHAR(40) NOT NULL DEFAULT 'trial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_trial_identity_ledger_key UNIQUE (identity_key)
);

CREATE INDEX IF NOT EXISTS idx_trial_identity_ledger_user
  ON trial_identity_ledger (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trial_identity_ledger_consumed
  ON trial_identity_ledger (consumed_at DESC);

COMMENT ON TABLE trial_identity_ledger IS
  'One free trial per OAuth identity / email; retained after user anonymization';

-- Backfill from accounts that already consumed a trial.
INSERT INTO trial_identity_ledger (identity_key, identity_kind, user_id, consumed_at, source)
SELECT
  'oauth:' || ap.provider || ':' || ap.provider_user_id,
  'oauth',
  ap.user_id,
  COALESCE(u.trial_consumed_at, u.updated_at, NOW()),
  'backfill'
FROM auth_providers ap
JOIN users u ON u.id = ap.user_id
WHERE (u.trial_consumed_at IS NOT NULL OR u.trial_used = TRUE)
ON CONFLICT (identity_key) DO NOTHING;

INSERT INTO trial_identity_ledger (identity_key, identity_kind, user_id, consumed_at, source)
SELECT
  'email:' || lower(trim(ap.provider_email)),
  'email',
  ap.user_id,
  COALESCE(u.trial_consumed_at, u.updated_at, NOW()),
  'backfill'
FROM auth_providers ap
JOIN users u ON u.id = ap.user_id
WHERE (u.trial_consumed_at IS NOT NULL OR u.trial_used = TRUE)
  AND ap.provider_email IS NOT NULL
  AND trim(ap.provider_email) <> ''
  AND ap.provider_email NOT ILIKE 'deleted+%@invalid.local'
  AND ap.provider_email NOT ILIKE 'oauth.%@users.local'
ON CONFLICT (identity_key) DO NOTHING;

INSERT INTO trial_identity_ledger (identity_key, identity_kind, user_id, consumed_at, source)
SELECT
  'email:' || lower(trim(u.email)),
  'email',
  u.id,
  COALESCE(u.trial_consumed_at, u.updated_at, NOW()),
  'backfill'
FROM users u
WHERE (u.trial_consumed_at IS NOT NULL OR u.trial_used = TRUE)
  AND u.email IS NOT NULL
  AND trim(u.email) <> ''
  AND u.email NOT ILIKE 'deleted+%@invalid.local'
  AND u.email NOT ILIKE 'oauth.%@users.local'
ON CONFLICT (identity_key) DO NOTHING;
