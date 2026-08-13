-- Stop storing OAuth / account emails on users and related auth tables.
-- Login continues via (provider, provider_user_id). Partial unique index keeps
-- any future non-null emails unique without requiring email on new accounts.

ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
DROP INDEX IF EXISTS idx_users_email;

UPDATE users SET email = NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_nonnull
  ON users (email)
  WHERE email IS NOT NULL;

UPDATE auth_providers SET provider_email = NULL;

UPDATE auth_provider_withdrawals
SET provider_email = NULL
WHERE provider_email IS NOT NULL;

-- Login audit table (migration 082 / compliance)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'auth_login_events'
  ) THEN
    EXECUTE 'UPDATE auth_login_events SET email = NULL WHERE email IS NOT NULL';
  END IF;
END $$;

-- Remove email-based trial abuse keys; keep oauth: keys only.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'trial_identity_ledger'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'trial_identity_ledger'
        AND column_name = 'identity_kind'
    ) THEN
      EXECUTE $q$
        DELETE FROM trial_identity_ledger
        WHERE identity_kind = 'email'
           OR identity_key LIKE 'email:%'
      $q$;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'trial_identity_ledger'
        AND column_name = 'identity_type'
    ) THEN
      EXECUTE $q$
        DELETE FROM trial_identity_ledger
        WHERE identity_type = 'email'
           OR identity_key LIKE 'email:%'
      $q$;
    ELSE
      EXECUTE $q$
        DELETE FROM trial_identity_ledger
        WHERE identity_key LIKE 'email:%'
      $q$;
    END IF;
  END IF;
END $$;

COMMENT ON COLUMN users.email IS
  'Deprecated — MachineFit does not collect OAuth account emails; prefer NULL.';
