-- Performance: friend lookups filter status alongside user_low/high.
-- Additive only — no API/schema contract changes.

CREATE INDEX IF NOT EXISTS idx_friendships_low_status
  ON friendships (user_low_id, status);

CREATE INDEX IF NOT EXISTS idx_friendships_high_status
  ON friendships (user_high_id, status);
