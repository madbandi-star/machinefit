-- Brands
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name JSONB NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  country_id UUID REFERENCES countries(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_brands_code ON brands (code);
CREATE INDEX idx_brands_country_id ON brands (country_id);
CREATE INDEX idx_brands_name ON brands USING GIN (name);

CREATE TRIGGER trg_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Machines
CREATE TABLE machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  code VARCHAR(80) UNIQUE NOT NULL,
  name JSONB NOT NULL,
  muscle_group VARCHAR(50) NOT NULL,
  machine_type VARCHAR(50) NOT NULL,
  description JSONB,
  has_seat BOOLEAN NOT NULL DEFAULT TRUE,
  has_back_pad BOOLEAN NOT NULL DEFAULT FALSE,
  has_foot_plate BOOLEAN NOT NULL DEFAULT FALSE,
  has_handle BOOLEAN NOT NULL DEFAULT TRUE,
  rom_type VARCHAR(30),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_machines_brand_id ON machines (brand_id);
CREATE INDEX idx_machines_code ON machines (code);
CREATE INDEX idx_machines_muscle_group ON machines (muscle_group);
CREATE INDEX idx_machines_name ON machines USING GIN (name);

CREATE TRIGGER trg_machines_updated_at
  BEFORE UPDATE ON machines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Machine images
CREATE TABLE machine_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text JSONB,
  sort_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_machine_images_machine_id ON machine_images (machine_id);

CREATE TRIGGER trg_machine_images_updated_at
  BEFORE UPDATE ON machine_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Machine videos
CREATE TABLE machine_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  title JSONB,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_machine_videos_machine_id ON machine_videos (machine_id);

CREATE TRIGGER trg_machine_videos_updated_at
  BEFORE UPDATE ON machine_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- YouTube videos
CREATE TABLE youtube_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  youtube_id VARCHAR(20) NOT NULL,
  title JSONB,
  channel_name VARCHAR(100),
  thumbnail_url TEXT,
  language_code VARCHAR(5),
  sort_order INT NOT NULL DEFAULT 0,
  is_official BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_youtube_videos_machine_id ON youtube_videos (machine_id);
CREATE INDEX idx_youtube_videos_language ON youtube_videos (language_code);

CREATE TRIGGER trg_youtube_videos_updated_at
  BEFORE UPDATE ON youtube_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
