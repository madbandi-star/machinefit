-- All-gyms aggregate support stays app-level (sentinel "all").
-- Gym members + subscription plan + member-scoped workouts.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) NOT NULL DEFAULT 'free';

COMMENT ON COLUMN users.subscription_plan IS 'free | premium — gates gym/member limits';

CREATE TABLE IF NOT EXISTS gym_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES user_gyms(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  gender VARCHAR(20),
  height_cm NUMERIC(5, 2),
  weight_kg NUMERIC(5, 2),
  birth_date DATE,
  memo TEXT,
  email VARCHAR(255),
  linked_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  profile_access VARCHAR(20) NOT NULL DEFAULT 'none',
  is_self BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gym_members_profile_access_check
    CHECK (profile_access IN ('none', 'pending', 'approved', 'denied'))
);

CREATE INDEX IF NOT EXISTS idx_gym_members_gym ON gym_members (gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_members_owner ON gym_members (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_gym_members_linked ON gym_members (linked_user_id)
  WHERE linked_user_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_gym_members_updated_at ON gym_members;
CREATE TRIGGER trg_gym_members_updated_at
  BEFORE UPDATE ON gym_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- One self member per gym (account owner).
CREATE UNIQUE INDEX IF NOT EXISTS uq_gym_members_self_per_gym
  ON gym_members (gym_id)
  WHERE is_self = TRUE;

-- Backfill self members from account profile.
INSERT INTO gym_members (
  gym_id, owner_user_id, name, gender, height_cm, weight_kg, email, linked_user_id, profile_access, is_self
)
SELECT
  ug.id,
  ug.user_id,
  COALESCE(NULLIF(BTRIM(u.display_name), ''), '나'),
  u.gender,
  u.height_cm,
  u.weight_kg,
  u.email,
  u.id,
  'approved',
  TRUE
FROM user_gyms ug
JOIN users u ON u.id = ug.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM gym_members gm WHERE gm.gym_id = ug.id AND gm.is_self = TRUE
);

CREATE TABLE IF NOT EXISTS gym_member_profile_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES gym_members(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES user_gyms(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gym_member_profile_requests_target
  ON gym_member_profile_requests (target_user_id, status);

-- ---------------------------------------------------------------------------
-- Scope workout / favorites / history by member
-- ---------------------------------------------------------------------------
ALTER TABLE workout_logs
  ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES gym_members(id) ON DELETE CASCADE;

UPDATE workout_logs wl
SET member_id = gm.id
FROM gym_members gm
WHERE gm.gym_id = wl.gym_id
  AND gm.is_self = TRUE
  AND wl.member_id IS NULL;

ALTER TABLE workout_logs
  ALTER COLUMN member_id SET NOT NULL;

ALTER TABLE workout_logs
  DROP CONSTRAINT IF EXISTS workout_logs_user_gym_machine_date_muscle_key;

ALTER TABLE workout_logs
  ADD CONSTRAINT workout_logs_user_gym_member_machine_date_muscle_key
  UNIQUE (user_id, gym_id, member_id, machine_id, log_date, target_muscle_group);

CREATE INDEX IF NOT EXISTS idx_workout_logs_member
  ON workout_logs (member_id, log_date DESC);

ALTER TABLE favorites
  ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES gym_members(id) ON DELETE CASCADE;

UPDATE favorites f
SET member_id = gm.id
FROM gym_members gm
WHERE gm.gym_id = f.gym_id
  AND gm.is_self = TRUE
  AND f.member_id IS NULL;

ALTER TABLE favorites
  ALTER COLUMN member_id SET NOT NULL;

ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_user_gym_machine_key;
ALTER TABLE favorites
  ADD CONSTRAINT favorites_user_gym_member_machine_key
  UNIQUE (user_id, gym_id, member_id, machine_id);

ALTER TABLE recent_history
  ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES gym_members(id) ON DELETE CASCADE;

UPDATE recent_history h
SET member_id = gm.id
FROM gym_members gm
WHERE gm.gym_id = h.gym_id
  AND gm.is_self = TRUE
  AND h.member_id IS NULL;

ALTER TABLE recent_history
  ALTER COLUMN member_id SET NOT NULL;

ALTER TABLE recent_history DROP CONSTRAINT IF EXISTS recent_history_user_gym_recommendation_key;
ALTER TABLE recent_history
  ADD CONSTRAINT recent_history_user_gym_member_recommendation_key
  UNIQUE (user_id, gym_id, member_id, recommendation_id);

CREATE INDEX IF NOT EXISTS idx_recent_history_member
  ON recent_history (member_id, viewed_at DESC);

COMMENT ON TABLE gym_members IS 'Members managed under a personal user_gym (trainer/coach clients + self)';
COMMENT ON COLUMN gym_members.is_self IS 'TRUE for the account-owner default member at this gym';
