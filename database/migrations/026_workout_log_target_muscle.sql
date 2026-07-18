-- Allow multiple free-weight logs per day by target muscle group

ALTER TABLE workout_logs
  ADD COLUMN IF NOT EXISTS target_muscle_group TEXT NOT NULL DEFAULT '';

ALTER TABLE workout_logs
  DROP CONSTRAINT IF EXISTS workout_logs_user_id_machine_id_log_date_key;

ALTER TABLE workout_logs
  ADD CONSTRAINT workout_logs_user_machine_date_muscle_key
  UNIQUE (user_id, machine_id, log_date, target_muscle_group);

COMMENT ON COLUMN workout_logs.target_muscle_group IS 'Target muscle for free-weight logs; empty string for machines';
