-- Per-day workout logs for progressive overload tracking (sets + weight per set)

CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES machine_recommendations(id) ON DELETE SET NULL,
  log_date DATE NOT NULL,
  set_count INT NOT NULL CHECK (set_count >= 1 AND set_count <= 20),
  set_weights_kg JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, machine_id, log_date)
);

CREATE INDEX idx_workout_logs_user_machine_date
  ON workout_logs (user_id, machine_id, log_date DESC);

CREATE INDEX idx_workout_logs_user_date
  ON workout_logs (user_id, log_date DESC);

COMMENT ON TABLE workout_logs IS 'Daily performed sets/weights per machine for progressive overload charts';
COMMENT ON COLUMN workout_logs.set_weights_kg IS 'JSON array of weight (kg) per set; length must match set_count';

CREATE TRIGGER trg_workout_logs_updated_at
  BEFORE UPDATE ON workout_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
