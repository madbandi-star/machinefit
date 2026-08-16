-- Default brand favorites for new users + favorite count support.
-- Admin toggles brands.is_default_favorite; first empty favorites GET seeds once per user.

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS is_default_favorite BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_brands_default_favorite
  ON brands (is_default_favorite)
  WHERE is_default_favorite = TRUE AND is_active = TRUE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS brand_favorites_seeded_at TIMESTAMPTZ;

COMMENT ON COLUMN brands.is_default_favorite IS
  'When true, brand is copied into user_favorite_brands once for each new user (first favorites fetch).';
COMMENT ON COLUMN users.brand_favorites_seeded_at IS
  'Set after default brand favorites are seeded; prevents re-seed if user clears all.';

-- Existing accounts: do not backfill defaults (only users created after this migration).
UPDATE users
SET brand_favorites_seeded_at = NOW()
WHERE brand_favorites_seeded_at IS NULL;

-- Starter defaults (admin can change later). Only active codes that exist.
UPDATE brands
SET is_default_favorite = TRUE,
    updated_at = NOW()
WHERE is_active = TRUE
  AND code IN (
    'BODYWEIGHT',
    'FREE_WEIGHT',
    'HAMMER_STRENGTH',
    'LIFE_FITNESS',
    'CYBEX',
    'TECHNOGYM'
  );
