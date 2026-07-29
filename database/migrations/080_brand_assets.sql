-- Durable brand logo / hero image bytes (Render-safe without Supabase Storage).

CREATE TABLE IF NOT EXISTS brand_assets (
  brand_id UUID PRIMARY KEY REFERENCES brands(id) ON DELETE CASCADE,
  brand_code VARCHAR(80) NOT NULL UNIQUE,
  logo_url TEXT,
  logo_mime_type TEXT,
  logo_version INTEGER NOT NULL DEFAULT 0,
  logo_data BYTEA,
  image_url TEXT,
  image_mime_type TEXT,
  image_version INTEGER NOT NULL DEFAULT 0,
  image_data BYTEA,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_assets_code ON brand_assets (brand_code);
CREATE INDEX IF NOT EXISTS idx_brand_assets_updated_at ON brand_assets (updated_at DESC);
