-- Standard machine types (공통 머신 유형) + multi-image support.
-- Brand machines remain `machines`; link via nullable standard_type_id.
-- Does not change user browse UX (muscle → brand → machine).

-- ===== Standard machine types =====
CREATE TABLE IF NOT EXISTS standard_machine_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) UNIQUE NOT NULL,
  name JSONB NOT NULL,
  description JSONB,
  primary_muscle_group VARCHAR(50) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_standard_machine_types_muscle
  ON standard_machine_types (primary_muscle_group);
CREATE INDEX IF NOT EXISTS idx_standard_machine_types_sort
  ON standard_machine_types (sort_order ASC, code ASC);
CREATE INDEX IF NOT EXISTS idx_standard_machine_types_name
  ON standard_machine_types USING GIN (name);
CREATE INDEX IF NOT EXISTS idx_standard_machine_types_active
  ON standard_machine_types (is_active);

DROP TRIGGER IF EXISTS trg_standard_machine_types_updated_at ON standard_machine_types;
CREATE TRIGGER trg_standard_machine_types_updated_at
  BEFORE UPDATE ON standard_machine_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE standard_machine_types IS
  'MachineFit standard/common machine types (e.g. 하이로우). Not brand SKUs.';

-- ===== Aliases for search / de-dupe =====
CREATE TABLE IF NOT EXISTS standard_machine_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_type_id UUID NOT NULL REFERENCES standard_machine_types(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  locale VARCHAR(10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_standard_machine_aliases_type_alias
  ON standard_machine_aliases (standard_type_id, lower(alias));
CREATE INDEX IF NOT EXISTS idx_standard_machine_aliases_alias
  ON standard_machine_aliases (lower(alias));

-- ===== Multi-muscle links (future muscle-based search) =====
CREATE TABLE IF NOT EXISTS standard_machine_muscle_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_type_id UUID NOT NULL REFERENCES standard_machine_types(id) ON DELETE CASCADE,
  muscle_group VARCHAR(50) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (standard_type_id, muscle_group)
);

CREATE INDEX IF NOT EXISTS idx_standard_machine_muscle_groups_muscle
  ON standard_machine_muscle_groups (muscle_group);

-- ===== Standard type images (대표사진, multi) =====
CREATE TABLE IF NOT EXISTS standard_machine_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_type_id UUID NOT NULL REFERENCES standard_machine_types(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  image_type VARCHAR(30) NOT NULL DEFAULT 'other',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  alt_text JSONB,
  source_type VARCHAR(30),
  source_url TEXT,
  copyright_note TEXT,
  license_note TEXT,
  storage_path TEXT,
  thumbnail_storage_path TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  version INTEGER NOT NULL DEFAULT 1,
  image_data BYTEA,
  thumbnail_data BYTEA,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_standard_machine_images_type
  ON standard_machine_images (standard_type_id, is_primary DESC, display_order ASC);

DROP TRIGGER IF EXISTS trg_standard_machine_images_updated_at ON standard_machine_images;
CREATE TRIGGER trg_standard_machine_images_updated_at
  BEFORE UPDATE ON standard_machine_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE standard_machine_images IS
  'Representative images for a standard machine type (fallback when brand product image missing).';

-- ===== Link brand machines → standard types =====
ALTER TABLE machines
  ADD COLUMN IF NOT EXISTS standard_type_id UUID REFERENCES standard_machine_types(id) ON DELETE SET NULL;

ALTER TABLE machines
  ADD COLUMN IF NOT EXISTS model_code VARCHAR(120);

CREATE INDEX IF NOT EXISTS idx_machines_standard_type_id
  ON machines (standard_type_id);

COMMENT ON COLUMN machines.standard_type_id IS
  'Optional FK to MachineFit standard machine type (공통 머신 유형).';
COMMENT ON COLUMN machines.model_code IS
  'Optional manufacturer model / SKU code (not MachineFit internal code).';

-- ===== Extend brand machine gallery images =====
ALTER TABLE machine_images
  ADD COLUMN IF NOT EXISTS image_type VARCHAR(30) NOT NULL DEFAULT 'other';

ALTER TABLE machine_images
  ADD COLUMN IF NOT EXISTS source_type VARCHAR(30);

ALTER TABLE machine_images
  ADD COLUMN IF NOT EXISTS source_url TEXT;

ALTER TABLE machine_images
  ADD COLUMN IF NOT EXISTS copyright_note TEXT;

ALTER TABLE machine_images
  ADD COLUMN IF NOT EXISTS license_note TEXT;

ALTER TABLE machine_images
  ADD COLUMN IF NOT EXISTS image_data BYTEA;

ALTER TABLE machine_images
  ADD COLUMN IF NOT EXISTS thumbnail_data BYTEA;

ALTER TABLE machine_images
  ADD COLUMN IF NOT EXISTS mime_type TEXT;

ALTER TABLE machine_images
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE machine_images
  ADD COLUMN IF NOT EXISTS original_filename TEXT;

ALTER TABLE machine_images
  ADD COLUMN IF NOT EXISTS width INTEGER;

ALTER TABLE machine_images
  ADD COLUMN IF NOT EXISTS height INTEGER;

ALTER TABLE machine_images
  ADD COLUMN IF NOT EXISTS file_size_bytes INTEGER;

CREATE INDEX IF NOT EXISTS idx_machine_images_primary_order
  ON machine_images (machine_id, is_primary DESC, sort_order ASC);
