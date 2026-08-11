-- Retry Polar subscription cancel after account withdraw when the first call fails.

CREATE TABLE IF NOT EXISTS polar_cancel_retries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_subscription_id TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_polar_cancel_retries_due
  ON polar_cancel_retries (next_attempt_at)
  WHERE completed_at IS NULL;

ALTER TABLE polar_cancel_retries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE polar_cancel_retries FROM anon, authenticated, PUBLIC;

COMMENT ON TABLE polar_cancel_retries IS
  'Withdraw Polar cancel retries — stop billing after deactivate when Polar is down.';
