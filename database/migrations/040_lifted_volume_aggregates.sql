-- Cumulative lifted weight aggregates (updated on workout log save/delete).

CREATE TABLE IF NOT EXISTS lifted_volume_totals (
  scope TEXT NOT NULL,
  scope_id TEXT NOT NULL DEFAULT '',
  total_kg NUMERIC(20, 2) NOT NULL DEFAULT 0 CHECK (total_kg >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (scope, scope_id)
);

COMMENT ON TABLE lifted_volume_totals IS
  'Cached total workout volume (kg). scope: global|gym|user|user_gym|user_month|user_year';

CREATE INDEX IF NOT EXISTS idx_lifted_volume_totals_scope_kg
  ON lifted_volume_totals (scope, total_kg DESC);

CREATE TABLE IF NOT EXISTS user_lifted_badges (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_lifted_badges_user
  ON user_lifted_badges (user_id, earned_at DESC);

-- Backfill from existing workout logs (sum of set_weights_kg).
WITH log_volumes AS (
  SELECT
    wl.user_id,
    wl.gym_id,
    wl.log_date,
    COALESCE((
      SELECT SUM(value::numeric)
      FROM jsonb_array_elements_text(wl.set_weights_kg) AS t(value)
    ), 0) AS volume_kg
  FROM workout_logs wl
),
user_totals AS (
  SELECT user_id::text AS scope_id, SUM(volume_kg) AS total_kg
  FROM log_volumes
  GROUP BY user_id
),
gym_totals AS (
  SELECT gym_id::text AS scope_id, SUM(volume_kg) AS total_kg
  FROM log_volumes
  GROUP BY gym_id
),
user_gym_totals AS (
  SELECT (user_id::text || '|' || gym_id::text) AS scope_id, SUM(volume_kg) AS total_kg
  FROM log_volumes
  GROUP BY user_id, gym_id
),
user_month_totals AS (
  SELECT
    (user_id::text || '|' || to_char(log_date, 'YYYY-MM')) AS scope_id,
    SUM(volume_kg) AS total_kg
  FROM log_volumes
  GROUP BY user_id, to_char(log_date, 'YYYY-MM')
),
user_year_totals AS (
  SELECT
    (user_id::text || '|' || to_char(log_date, 'YYYY')) AS scope_id,
    SUM(volume_kg) AS total_kg
  FROM log_volumes
  GROUP BY user_id, to_char(log_date, 'YYYY')
),
global_total AS (
  SELECT COALESCE(SUM(volume_kg), 0) AS total_kg FROM log_volumes
)
INSERT INTO lifted_volume_totals (scope, scope_id, total_kg, updated_at)
SELECT 'global', '', total_kg, NOW() FROM global_total
UNION ALL
SELECT 'user', scope_id, total_kg, NOW() FROM user_totals WHERE total_kg > 0
UNION ALL
SELECT 'gym', scope_id, total_kg, NOW() FROM gym_totals WHERE total_kg > 0
UNION ALL
SELECT 'user_gym', scope_id, total_kg, NOW() FROM user_gym_totals WHERE total_kg > 0
UNION ALL
SELECT 'user_month', scope_id, total_kg, NOW() FROM user_month_totals WHERE total_kg > 0
UNION ALL
SELECT 'user_year', scope_id, total_kg, NOW() FROM user_year_totals WHERE total_kg > 0
ON CONFLICT (scope, scope_id) DO UPDATE
  SET total_kg = EXCLUDED.total_kg, updated_at = NOW();
