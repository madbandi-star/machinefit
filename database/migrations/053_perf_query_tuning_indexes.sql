-- Query-pattern composite indexes (semantics-neutral). Safe IF NOT EXISTS.

-- Live/geo: probe logs by gym then date
CREATE INDEX IF NOT EXISTS idx_workout_logs_gym_log_date
  ON workout_logs (gym_id, log_date DESC);

-- Live feed / active window with optional gym filter
CREATE INDEX IF NOT EXISTS idx_workout_logs_updated_at_gym
  ON workout_logs (updated_at DESC, gym_id);

-- Live / admin search ILIKE
CREATE INDEX IF NOT EXISTS idx_user_gyms_name_trgm
  ON user_gyms USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_display_name_trgm
  ON users USING GIN (display_name gin_trgm_ops);

-- Peer / achievement style GROUP BY user_id with date+jsonb payload
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date_weights
  ON workout_logs (user_id, log_date)
  INCLUDE (set_weights_kg, set_count, updated_at);
