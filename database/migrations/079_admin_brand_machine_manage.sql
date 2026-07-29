-- Admin brand/machine management: display order + brand hero image.
-- logo_url already exists on brands; machine images use machine_images.

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE machines
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_brands_sort_order ON brands (sort_order ASC, code ASC);
CREATE INDEX IF NOT EXISTS idx_machines_sort_order ON machines (sort_order ASC, code ASC);

COMMENT ON COLUMN brands.sort_order IS 'Admin display order (lower first)';
COMMENT ON COLUMN brands.image_url IS 'Brand hero / representative image URL';
COMMENT ON COLUMN machines.sort_order IS 'Admin display order (lower first)';
