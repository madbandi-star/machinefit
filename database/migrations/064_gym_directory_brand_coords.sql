-- Add brand column + distance helpers for gym_directory search.
-- Existing rows keep brand NULL; brand_chain seed fills via 065.

ALTER TABLE gym_directory
  ADD COLUMN IF NOT EXISTS brand VARCHAR(80);

CREATE INDEX IF NOT EXISTS idx_gym_directory_brand
  ON gym_directory (brand)
  WHERE brand IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gym_directory_coords
  ON gym_directory (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND is_active = TRUE;
