-- Achievement & Trophy system: cached user stats + earned achievements + global unlock rates.

CREATE TABLE IF NOT EXISTS user_achievement_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_volume_kg NUMERIC(20, 2) NOT NULL DEFAULT 0,
  workout_count INTEGER NOT NULL DEFAULT 0,
  session_days INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  unique_machines INTEGER NOT NULL DEFAULT 0,
  unique_brands INTEGER NOT NULL DEFAULT 0,
  unique_gyms INTEGER NOT NULL DEFAULT 0,
  pr_count INTEGER NOT NULL DEFAULT 0,
  dawn_workouts INTEGER NOT NULL DEFAULT 0,
  morning_workouts INTEGER NOT NULL DEFAULT 0,
  afternoon_workouts INTEGER NOT NULL DEFAULT 0,
  evening_workouts INTEGER NOT NULL DEFAULT 0,
  night_workouts INTEGER NOT NULL DEFAULT 0,
  chest_workouts INTEGER NOT NULL DEFAULT 0,
  back_workouts INTEGER NOT NULL DEFAULT 0,
  legs_workouts INTEGER NOT NULL DEFAULT 0,
  shoulders_workouts INTEGER NOT NULL DEFAULT 0,
  arms_workouts INTEGER NOT NULL DEFAULT 0,
  core_workouts INTEGER NOT NULL DEFAULT 0,
  holiday_workouts INTEGER NOT NULL DEFAULT 0,
  new_year_workouts INTEGER NOT NULL DEFAULT 0,
  christmas_workouts INTEGER NOT NULL DEFAULT 0,
  halloween_workouts INTEGER NOT NULL DEFAULT 0,
  summer_2026_workouts INTEGER NOT NULL DEFAULT 0,
  winter_2026_workouts INTEGER NOT NULL DEFAULT 0,
  leg_day_workouts INTEGER NOT NULL DEFAULT 0,
  bench_workouts INTEGER NOT NULL DEFAULT 0,
  squat_workouts INTEGER NOT NULL DEFAULT 0,
  upper_ratio_pct NUMERIC(6, 2) NOT NULL DEFAULT 0,
  lower_ratio_pct NUMERIC(6, 2) NOT NULL DEFAULT 0,
  balance_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  active_title_ko TEXT,
  active_title_en TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_earned
  ON user_achievements (user_id, earned_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_achievement_stats_xp
  ON user_achievement_stats (total_xp DESC);

CREATE TABLE IF NOT EXISTS achievement_unlock_counts (
  achievement_id TEXT PRIMARY KEY,
  unlock_count INTEGER NOT NULL DEFAULT 0 CHECK (unlock_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_achievement_stats IS
  'Cached per-user counters for the achievement rule engine (refreshed on workout save).';
COMMENT ON TABLE user_achievements IS
  'Earned achievements per user.';
COMMENT ON TABLE achievement_unlock_counts IS
  'Global unlock counts used for live rarity (unlock rate).';
