-- Extended user profile: age, workout goal, home gym

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS age SMALLINT CHECK (age IS NULL OR (age >= 13 AND age <= 100)),
  ADD COLUMN IF NOT EXISTS workout_goal VARCHAR(30),
  ADD COLUMN IF NOT EXISTS home_gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS home_gym_name VARCHAR(120);

COMMENT ON COLUMN users.age IS 'User age in years';
COMMENT ON COLUMN users.workout_goal IS 'Primary workout goal: hypertrophy|strength|diet|conditioning|rehab|posture';
COMMENT ON COLUMN users.home_gym_id IS 'Registered gym from gyms table';
COMMENT ON COLUMN users.home_gym_name IS 'Free-text gym name when not in gyms list';
