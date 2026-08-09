-- Remove legacy email/password local authentication column.
-- MachineFit auth is social-only (Kakao / Google / Apple via auth_providers).
-- OAuth users already have password_hash NULL since 091_auth_providers.sql.

-- Clear any residual password credentials before drop (safety for old rows).
UPDATE users
SET password_hash = NULL,
    updated_at = NOW()
WHERE password_hash IS NOT NULL;

-- Drop legacy local-auth column.
ALTER TABLE users
  DROP COLUMN IF EXISTS password_hash;
