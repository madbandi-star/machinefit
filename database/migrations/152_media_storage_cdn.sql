-- Additive only: Storage/CDN URL columns + migration log.
-- Does NOT drop or null BYTEA columns.

-- Brand assets: storage object paths (public bucket brand-assets)
ALTER TABLE brand_assets
  ADD COLUMN IF NOT EXISTS logo_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS image_storage_path TEXT;

COMMENT ON COLUMN brand_assets.logo_storage_path IS
  'Supabase Storage object path in brand-assets bucket (logo).';
COMMENT ON COLUMN brand_assets.image_storage_path IS
  'Supabase Storage object path in brand-assets bucket (hero).';

-- UGC images: optional Storage dual-write (BYTEA retained until verified)
ALTER TABLE photo_post_images
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE machine_trade_images
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE machine_showcase_images
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE machine_request_images
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Idempotent migration audit (script writes here; never deletes BYTEA)
CREATE TABLE IF NOT EXISTS media_storage_migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_kind TEXT NOT NULL,
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT 'main',
  storage_bucket TEXT,
  storage_path TEXT,
  public_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  bytes INT,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_table, source_id, variant)
);

CREATE INDEX IF NOT EXISTS idx_media_storage_migration_status
  ON media_storage_migration_log (status, media_kind);

COMMENT ON TABLE media_storage_migration_log IS
  'BYTEA → Supabase Storage migration status. BYTEA columns remain until ops confirms.';
