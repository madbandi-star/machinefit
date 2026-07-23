-- Persist unseen achievement unlocks so the unlock popup can show after
-- background award on workout-log save (newlyUnlocked is otherwise discarded).

ALTER TABLE user_achievements
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

-- Existing rows were already "seen" (or never shown) — do not replay popups.
UPDATE user_achievements
SET notified_at = COALESCE(earned_at, NOW())
WHERE notified_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_achievements_unnotified
  ON user_achievements (user_id)
  WHERE notified_at IS NULL;
