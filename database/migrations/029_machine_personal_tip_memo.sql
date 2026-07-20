-- Per-machine personal tip memo notebook (user-specific workout notes)

ALTER TABLE user_machine_preferences
  ADD COLUMN IF NOT EXISTS personal_tip_memo TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN user_machine_preferences.personal_tip_memo IS
  'User personal workout tip memo per machine (UTF-8 text, app-enforced max length)';
