-- Per-document consent versions + timestamps on users (fast reconsent checks).
-- Audit history remains in user_consents.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS terms_version VARCHAR(32),
  ADD COLUMN IF NOT EXISTS privacy_version VARCHAR(32),
  ADD COLUMN IF NOT EXISTS location_version VARCHAR(32),
  ADD COLUMN IF NOT EXISTS marketing_version VARCHAR(32),
  ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_agreed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS location_agreed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_agreed_at TIMESTAMPTZ;

-- Backfill from latest agreed user_consents rows when present.
UPDATE users u
SET
  terms_version = c.version,
  terms_agreed_at = c.agreed_at
FROM (
  SELECT DISTINCT ON (user_id) user_id, version, agreed_at
  FROM user_consents
  WHERE consent_type = 'terms' AND agreed = TRUE
  ORDER BY user_id, agreed_at DESC NULLS LAST
) c
WHERE u.id = c.user_id
  AND u.terms_version IS NULL;

UPDATE users u
SET
  privacy_version = c.version,
  privacy_agreed_at = c.agreed_at
FROM (
  SELECT DISTINCT ON (user_id) user_id, version, agreed_at
  FROM user_consents
  WHERE consent_type = 'privacy' AND agreed = TRUE
  ORDER BY user_id, agreed_at DESC NULLS LAST
) c
WHERE u.id = c.user_id
  AND u.privacy_version IS NULL;

UPDATE users u
SET
  location_version = c.version,
  location_agreed_at = c.agreed_at
FROM (
  SELECT DISTINCT ON (user_id) user_id, version, agreed_at
  FROM user_consents
  WHERE consent_type = 'location' AND agreed = TRUE
  ORDER BY user_id, agreed_at DESC NULLS LAST
) c
WHERE u.id = c.user_id
  AND u.location_version IS NULL;

UPDATE users u
SET
  marketing_version = c.version,
  marketing_agreed_at = c.agreed_at
FROM (
  SELECT DISTINCT ON (user_id) user_id, version, agreed_at
  FROM user_consents
  WHERE consent_type = 'marketing' AND agreed = TRUE
  ORDER BY user_id, agreed_at DESC NULLS LAST
) c
WHERE u.id = c.user_id
  AND u.marketing_version IS NULL;
