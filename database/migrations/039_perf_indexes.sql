-- Performance indexes for hot list / cohort / catalog paths.

CREATE INDEX IF NOT EXISTS idx_gym_members_gym_owner
  ON gym_members (gym_id, owner_user_id);

CREATE INDEX IF NOT EXISTS idx_users_cohort_active
  ON users (is_active, gender, experience_level)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_machines_active_code
  ON machines (code)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_machine_images_primary_lookup
  ON machine_images (machine_id, is_primary DESC, sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_workout_logs_log_date
  ON workout_logs (log_date DESC);

CREATE INDEX IF NOT EXISTS idx_brands_active_code
  ON brands (code)
  WHERE is_active = TRUE;
