-- Gyms
CREATE TABLE gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(200) NOT NULL,
  description JSONB,
  address TEXT NOT NULL,
  city VARCHAR(100),
  country_id UUID NOT NULL REFERENCES countries(id),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  phone VARCHAR(30),
  website_url TEXT,
  business_hours JSONB,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gyms_owner_id ON gyms (owner_id);
CREATE INDEX idx_gyms_country_id ON gyms (country_id);
CREATE INDEX idx_gyms_location ON gyms (latitude, longitude);
CREATE INDEX idx_gyms_name_trgm ON gyms USING GIN (name gin_trgm_ops);

CREATE TRIGGER trg_gyms_updated_at
  BEFORE UPDATE ON gyms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Gym photos
CREATE TABLE gym_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gym_photos_gym_id ON gym_photos (gym_id);

CREATE TRIGGER trg_gym_photos_updated_at
  BEFORE UPDATE ON gym_photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Gym machines
CREATE TABLE gym_machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id),
  quantity INT NOT NULL DEFAULT 1,
  notes TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (gym_id, machine_id)
);

CREATE INDEX idx_gym_machines_machine_id ON gym_machines (machine_id);

CREATE TRIGGER trg_gym_machines_updated_at
  BEFORE UPDATE ON gym_machines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
