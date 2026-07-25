-- Consent audit + marketing opt-in (compliance P0/P1)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR(40) NOT NULL,
  version VARCHAR(32) NOT NULL,
  agreed BOOLEAN NOT NULL DEFAULT TRUE,
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, consent_type, version)
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user
  ON user_consents (user_id, agreed_at DESC);

COMMENT ON COLUMN users.marketing_opt_in IS 'Opt-in for marketing/event push campaigns';
COMMENT ON TABLE user_consents IS 'Audit log for terms/privacy/marketing consent versions';
