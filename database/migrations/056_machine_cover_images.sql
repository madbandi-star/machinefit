-- Admin-managed machine cover images (1 per machine). Bytes stored for Render durability.

CREATE TABLE IF NOT EXISTS machine_cover_images (
  machine_id UUID PRIMARY KEY REFERENCES machines(id) ON DELETE CASCADE,
  machine_code VARCHAR(80) NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
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

CREATE INDEX IF NOT EXISTS idx_machine_cover_images_code
  ON machine_cover_images (machine_code);

CREATE INDEX IF NOT EXISTS idx_machine_cover_images_updated_at
  ON machine_cover_images (updated_at DESC);
