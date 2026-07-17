-- Workout diary notes (user memo, max 100 bytes enforced in app)

ALTER TABLE workout_logs
  ADD COLUMN IF NOT EXISTS diary TEXT;

COMMENT ON COLUMN workout_logs.diary IS 'Optional workout diary memo; max 100 UTF-8 bytes enforced by API';
