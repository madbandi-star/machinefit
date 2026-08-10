-- Account withdrawal lifecycle: ACTIVE ↔ WITHDRAWN + OAuth identity release for re-signup.
-- Withdrawn users keep their users row (billing/consent retention). Live auth_providers
-- are archived then removed so the same social subject can create a NEW MachineFit user.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check;
ALTER TABLE users
  ADD CONSTRAINT users_account_status_check
  CHECK (account_status IN ('ACTIVE', 'WITHDRAWN'));

UPDATE users
SET account_status = 'WITHDRAWN'
WHERE is_active = FALSE
  AND account_status = 'ACTIVE';

UPDATE users
SET account_status = 'ACTIVE'
WHERE is_active = TRUE
  AND account_status <> 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_users_account_status
  ON users (account_status)
  WHERE account_status = 'WITHDRAWN';

COMMENT ON COLUMN users.account_status IS
  'ACTIVE = usable account; WITHDRAWN = member withdrew (is_active=false). Re-signup creates a new user id.';

-- Archive of social links after withdraw (audit / rejoin detection). Not used as live login.
CREATE TABLE IF NOT EXISTS auth_provider_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(32) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255),
  withdrawn_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_provider_withdrawals_subject
  ON auth_provider_withdrawals (provider, provider_user_id, withdrawn_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_provider_withdrawals_user
  ON auth_provider_withdrawals (user_id);

COMMENT ON TABLE auth_provider_withdrawals IS
  'Historical OAuth subject ↔ withdrawn MachineFit user. Does not block re-signup; live links live only in auth_providers.';
