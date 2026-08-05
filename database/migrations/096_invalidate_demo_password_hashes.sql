-- Invalidate residual demo1234 password hashes from migration 043.
-- Does NOT change business login rules — only removes a known weak shared hash.
-- Affected users must reset password (forgot-password / admin) before logging in again.
-- Refresh sessions for those users are revoked.

WITH invalidated AS (
  UPDATE users
  SET password_hash = '$2b$12$VzCDWOB5NX8WjdYftdvlzuItmU5MktDDXAR6LfzFxLQijegaJ2TyS',
      updated_at = NOW()
  WHERE password_hash = '$2b$12$Jl0R/iUN2nU1uKp8YJ/NPedihs3J5LRf9rHhXgrUwvz5XhVevxIyC'
  RETURNING id
)
DELETE FROM refresh_tokens
WHERE user_id IN (SELECT id FROM invalidated);

-- Note: demo seed accounts in 072 that used the same hash are also invalidated.
-- Re-seed with DEMO_AUTH=true only on non-production environments if needed.
