-- Deferred hard-purge marker after account deactivation (privacy retention job).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS data_purged_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_deactivated_purge
  ON users (deactivated_at)
  WHERE is_active = FALSE AND data_purged_at IS NULL AND deactivated_at IS NOT NULL;
