-- Per-set completion flags for workout logs

ALTER TABLE workout_logs
  ADD COLUMN IF NOT EXISTS set_completed JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN workout_logs.set_completed IS 'JSON array of booleans; length matches set_count';
