-- Scrub stored member contact emails. Column kept for optional future use;
-- existing non-empty values are cleared.

UPDATE gym_members
SET email = NULL
WHERE email IS NOT NULL AND BTRIM(email) <> '';

COMMENT ON COLUMN gym_members.email IS
  'Optional contact email; not collected from OAuth. Prefer NULL when unused.';
