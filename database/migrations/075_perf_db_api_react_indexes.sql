-- Semantics-neutral covering / lookup indexes for My Page volume + history paths.
-- Safe IF NOT EXISTS. Does not change query results.

-- Volume recompute / DNA / achievements: cover recommendation + completed flags
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date_volume_cover
  ON workout_logs (user_id, log_date)
  INCLUDE (machine_id, gym_id, member_id, recommendation_id, set_count, set_weights_kg, set_completed, updated_at);

-- Preference multi-scope batch: (user, gym, member) then machine
CREATE INDEX IF NOT EXISTS idx_user_machine_prefs_user_gym_member
  ON user_machine_preferences (user_id, gym_id, member_id);

-- Friend request list by direction without N+1 id lookup
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_status_created
  ON friend_requests (to_user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_friend_requests_from_status_created
  ON friend_requests (from_user_id, status, created_at DESC);
