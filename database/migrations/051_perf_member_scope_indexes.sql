-- Member-scoped covering indexes for hot list/filter paths.

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_gym_member_date
  ON workout_logs (user_id, gym_id, member_id, log_date DESC);

CREATE INDEX IF NOT EXISTS idx_recent_history_user_gym_member_viewed
  ON recent_history (user_id, gym_id, member_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorites_user_gym_member_created
  ON favorites (user_id, gym_id, member_id, created_at DESC);
