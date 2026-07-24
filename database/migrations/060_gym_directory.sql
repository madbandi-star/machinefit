-- Nationwide gym directory for register/settings autocomplete.
-- Separate from owner-managed `gyms` so catalog crawl data does not pollute gym ops.

CREATE TABLE IF NOT EXISTS gym_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  name_normalized VARCHAR(200) NOT NULL,
  address TEXT,
  state_id UUID REFERENCES location_states(id) ON DELETE SET NULL,
  city_id UUID REFERENCES location_cities(id) ON DELETE SET NULL,
  district_id UUID REFERENCES location_districts(id) ON DELETE SET NULL,
  state_name VARCHAR(80),
  city_name VARCHAR(80),
  district_name VARCHAR(80),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  source VARCHAR(40) NOT NULL DEFAULT 'osm',
  source_ref VARCHAR(80),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_gym_directory_source_ref
  ON gym_directory (source, source_ref);

CREATE INDEX IF NOT EXISTS idx_gym_directory_name_trgm
  ON gym_directory USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_gym_directory_name_normalized
  ON gym_directory (name_normalized);

CREATE INDEX IF NOT EXISTS idx_gym_directory_state_id ON gym_directory (state_id);
CREATE INDEX IF NOT EXISTS idx_gym_directory_city_id ON gym_directory (city_id);
CREATE INDEX IF NOT EXISTS idx_gym_directory_district_id ON gym_directory (district_id);
CREATE INDEX IF NOT EXISTS idx_gym_directory_location_names
  ON gym_directory (state_name, city_name, district_name);

CREATE TRIGGER trg_gym_directory_updated_at
  BEFORE UPDATE ON gym_directory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
