CREATE INDEX IF NOT EXISTS idx_workout_logs_machine_date
  ON workout_logs (machine_id, log_date DESC);
