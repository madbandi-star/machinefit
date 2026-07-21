-- Multi personal gym support: user_gyms + gym-scoped workout data.

CREATE TABLE IF NOT EXISTS user_gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  brand_name VARCHAR(100),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_gyms_user ON user_gyms (user_id);
CREATE INDEX IF NOT EXISTS idx_user_gyms_user_default
  ON user_gyms (user_id)
  WHERE is_default = TRUE;

COMMENT ON TABLE user_gyms IS 'Personal gyms registered by a member (multi-gym training locations)';
COMMENT ON COLUMN user_gyms.brand_name IS 'Optional representative equipment brand at this gym';

DROP TRIGGER IF EXISTS trg_user_gyms_updated_at ON user_gyms;
CREATE TRIGGER trg_user_gyms_updated_at
  BEFORE UPDATE ON user_gyms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS active_gym_id UUID REFERENCES user_gyms(id) ON DELETE SET NULL;

COMMENT ON COLUMN users.active_gym_id IS 'Last selected personal gym for scoping workouts/stats';

-- Ensure every existing user has a default personal gym (preserve home_gym_name when set).
INSERT INTO user_gyms (user_id, name, address, brand_name, is_default)
SELECT
  u.id,
  COALESCE(NULLIF(BTRIM(u.home_gym_name), ''), '기본 헬스장'),
  NULL,
  NULL,
  TRUE
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_gyms ug WHERE ug.user_id = u.id
);

UPDATE users u
SET active_gym_id = d.id
FROM user_gyms d
WHERE d.user_id = u.id
  AND d.is_default = TRUE
  AND u.active_gym_id IS NULL;

-- ---------------------------------------------------------------------------
-- workout_logs.gym_id
-- ---------------------------------------------------------------------------
ALTER TABLE workout_logs
  ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES user_gyms(id) ON DELETE CASCADE;

UPDATE workout_logs wl
SET gym_id = d.id
FROM user_gyms d
WHERE d.user_id = wl.user_id
  AND d.is_default = TRUE
  AND wl.gym_id IS NULL;

-- Orphan guard: create gym for any leftover rows (should be none).
INSERT INTO user_gyms (user_id, name, is_default)
SELECT DISTINCT wl.user_id, '기본 헬스장', TRUE
FROM workout_logs wl
WHERE wl.gym_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM user_gyms ug WHERE ug.user_id = wl.user_id);

UPDATE workout_logs wl
SET gym_id = d.id
FROM user_gyms d
WHERE d.user_id = wl.user_id
  AND wl.gym_id IS NULL;

ALTER TABLE workout_logs
  ALTER COLUMN gym_id SET NOT NULL;

ALTER TABLE workout_logs
  DROP CONSTRAINT IF EXISTS workout_logs_user_machine_date_muscle_key;

ALTER TABLE workout_logs
  ADD CONSTRAINT workout_logs_user_gym_machine_date_muscle_key
  UNIQUE (user_id, gym_id, machine_id, log_date, target_muscle_group);

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_gym_date
  ON workout_logs (user_id, gym_id, log_date DESC);

-- ---------------------------------------------------------------------------
-- favorites.gym_id
-- ---------------------------------------------------------------------------
ALTER TABLE favorites
  ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES user_gyms(id) ON DELETE CASCADE;

UPDATE favorites f
SET gym_id = d.id
FROM user_gyms d
WHERE d.user_id = f.user_id
  AND d.is_default = TRUE
  AND f.gym_id IS NULL;

INSERT INTO user_gyms (user_id, name, is_default)
SELECT DISTINCT f.user_id, '기본 헬스장', TRUE
FROM favorites f
WHERE f.gym_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM user_gyms ug WHERE ug.user_id = f.user_id);

UPDATE favorites f
SET gym_id = d.id
FROM user_gyms d
WHERE d.user_id = f.user_id
  AND f.gym_id IS NULL;

ALTER TABLE favorites
  ALTER COLUMN gym_id SET NOT NULL;

ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_user_id_machine_id_key;
ALTER TABLE favorites
  ADD CONSTRAINT favorites_user_gym_machine_key UNIQUE (user_id, gym_id, machine_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user_gym ON favorites (user_id, gym_id);

-- ---------------------------------------------------------------------------
-- recent_history.gym_id
-- ---------------------------------------------------------------------------
ALTER TABLE recent_history
  ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES user_gyms(id) ON DELETE CASCADE;

UPDATE recent_history h
SET gym_id = d.id
FROM user_gyms d
WHERE d.user_id = h.user_id
  AND d.is_default = TRUE
  AND h.gym_id IS NULL;

INSERT INTO user_gyms (user_id, name, is_default)
SELECT DISTINCT h.user_id, '기본 헬스장', TRUE
FROM recent_history h
WHERE h.gym_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM user_gyms ug WHERE ug.user_id = h.user_id);

UPDATE recent_history h
SET gym_id = d.id
FROM user_gyms d
WHERE d.user_id = h.user_id
  AND h.gym_id IS NULL;

ALTER TABLE recent_history
  ALTER COLUMN gym_id SET NOT NULL;

ALTER TABLE recent_history DROP CONSTRAINT IF EXISTS recent_history_user_id_recommendation_id_key;
ALTER TABLE recent_history
  ADD CONSTRAINT recent_history_user_gym_recommendation_key
  UNIQUE (user_id, gym_id, recommendation_id);

CREATE INDEX IF NOT EXISTS idx_recent_history_user_gym
  ON recent_history (user_id, gym_id, viewed_at DESC);
