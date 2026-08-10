-- MachineFit public username = users.display_name.
-- Enforce uniqueness for active accounts (case-insensitive for Latin).
-- Deactivated users share display_name '탈퇴회원' — excluded via is_active filter.
-- Existing members keep their display_name; only colliding active rows are disambiguated.

-- Resolve duplicate active display_names before creating the unique index.
WITH ranked AS (
  SELECT
    id,
    display_name,
    ROW_NUMBER() OVER (
      PARTITION BY lower(display_name)
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM users
  WHERE is_active = TRUE
)
UPDATE users u
SET display_name = left(r.display_name, 24) || '_' || substr(replace(u.id::text, '-', ''), 1, 6)
FROM ranked r
WHERE u.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_display_name_active_ci
  ON users (lower(display_name))
  WHERE is_active = TRUE;

COMMENT ON COLUMN users.display_name IS
  'MachineFit public username (아이디). Not derived from social provider profile names.';
