-- Fingerprint workout logs so growth cache invalidates on edits (same log_count).

ALTER TABLE user_growth_timeline
  ADD COLUMN IF NOT EXISTS logs_revision TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN user_growth_timeline.logs_revision IS
  'COUNT(*) || '':'' || MAX(updated_at) fingerprint of workout_logs for this user.';
