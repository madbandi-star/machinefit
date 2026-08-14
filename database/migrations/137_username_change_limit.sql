-- Limit self-serve username (display_name) changes on My Page to 3 lifetime renames.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username_change_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN users.username_change_count IS
  'Successful self-serve display_name changes. Max 3 (admin changes do not increment).';
