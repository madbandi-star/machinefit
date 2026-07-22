-- Member-scoped ownership for preferences / recommendations / feedback.
-- Existing rows are attributed to each gym's self member when possible.

-- 1) user_machine_preferences: add gym_id + member_id
ALTER TABLE user_machine_preferences
  ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES user_gyms(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES gym_members(id) ON DELETE CASCADE;

-- Backfill from user's default/active gym self member
UPDATE user_machine_preferences ump
SET
  gym_id = COALESCE(
    ump.gym_id,
    (SELECT u.active_gym_id FROM users u WHERE u.id = ump.user_id),
    (SELECT ug.id FROM user_gyms ug WHERE ug.user_id = ump.user_id ORDER BY ug.is_default DESC, ug.created_at ASC LIMIT 1)
  ),
  member_id = COALESCE(
    ump.member_id,
    (
      SELECT gm.id
      FROM gym_members gm
      WHERE gm.owner_user_id = ump.user_id
        AND gm.is_self = TRUE
        AND gm.gym_id = COALESCE(
          ump.gym_id,
          (SELECT u.active_gym_id FROM users u WHERE u.id = ump.user_id),
          (SELECT ug.id FROM user_gyms ug WHERE ug.user_id = ump.user_id ORDER BY ug.is_default DESC, ug.created_at ASC LIMIT 1)
        )
      LIMIT 1
    )
  )
WHERE ump.gym_id IS NULL OR ump.member_id IS NULL;

-- Drop rows we cannot attribute (no gym/member) — safer than leaving unscoped
DELETE FROM user_machine_preferences WHERE gym_id IS NULL OR member_id IS NULL;

ALTER TABLE user_machine_preferences
  ALTER COLUMN gym_id SET NOT NULL,
  ALTER COLUMN member_id SET NOT NULL;

ALTER TABLE user_machine_preferences
  DROP CONSTRAINT IF EXISTS user_machine_preferences_user_id_machine_id_key;

ALTER TABLE user_machine_preferences
  DROP CONSTRAINT IF EXISTS user_machine_preferences_user_machine_key;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_machine_preferences_pkey'
      AND conrelid = 'user_machine_preferences'::regclass
  ) THEN
    -- keep surrogate PK if present; enforce uniqueness separately
    NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_machine_prefs_member_machine
  ON user_machine_preferences (user_id, gym_id, member_id, machine_id);

CREATE INDEX IF NOT EXISTS idx_user_machine_prefs_member
  ON user_machine_preferences (member_id);

-- 2) machine_recommendations: add gym_id + member_id (nullable for anonymous)
ALTER TABLE machine_recommendations
  ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES user_gyms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES gym_members(id) ON DELETE SET NULL;

UPDATE machine_recommendations mr
SET
  gym_id = COALESCE(
    mr.gym_id,
    (SELECT rh.gym_id FROM recent_history rh WHERE rh.recommendation_id = mr.id LIMIT 1),
    (SELECT u.active_gym_id FROM users u WHERE u.id = mr.user_id),
    (SELECT ug.id FROM user_gyms ug WHERE ug.user_id = mr.user_id ORDER BY ug.is_default DESC, ug.created_at ASC LIMIT 1)
  ),
  member_id = COALESCE(
    mr.member_id,
    (SELECT rh.member_id FROM recent_history rh WHERE rh.recommendation_id = mr.id LIMIT 1),
    (
      SELECT gm.id
      FROM gym_members gm
      WHERE gm.owner_user_id = mr.user_id
        AND gm.is_self = TRUE
        AND gm.gym_id = COALESCE(
          mr.gym_id,
          (SELECT u.active_gym_id FROM users u WHERE u.id = mr.user_id),
          (SELECT ug.id FROM user_gyms ug WHERE ug.user_id = mr.user_id ORDER BY ug.is_default DESC, ug.created_at ASC LIMIT 1)
        )
      LIMIT 1
    )
  )
WHERE mr.user_id IS NOT NULL
  AND (mr.gym_id IS NULL OR mr.member_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_machine_recommendations_member
  ON machine_recommendations (user_id, gym_id, member_id);

-- 3) recommendation_feedback stays keyed by recommendation_id (inherits member via recommendation)
-- No schema change required if recommendations carry member_id.
