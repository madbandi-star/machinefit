-- Machine settings (recommendation rules)
CREATE TABLE machine_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  gender VARCHAR(10) NOT NULL,
  experience_level VARCHAR(20) NOT NULL,
  height_min_cm DECIMAL(5,2) NOT NULL,
  height_max_cm DECIMAL(5,2) NOT NULL,
  weight_min_kg DECIMAL(5,2),
  weight_max_kg DECIMAL(5,2),
  seat_position INT,
  back_pad_position INT,
  foot_position INT,
  handle_position INT,
  rom_setting VARCHAR(50),
  weight_kg DECIMAL(5,2),
  tips JSONB,
  warnings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_machine_settings_machine_id ON machine_settings (machine_id);
CREATE INDEX idx_machine_settings_lookup ON machine_settings (
  machine_id, gender, experience_level, height_min_cm, height_max_cm
);

CREATE TRIGGER trg_machine_settings_updated_at
  BEFORE UPDATE ON machine_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Machine recommendations (history)
CREATE TABLE machine_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  machine_id UUID NOT NULL REFERENCES machines(id),
  machine_setting_id UUID REFERENCES machine_settings(id) ON DELETE SET NULL,
  gender VARCHAR(10) NOT NULL,
  height_cm DECIMAL(5,2) NOT NULL,
  weight_kg DECIMAL(5,2),
  experience_level VARCHAR(20) NOT NULL,
  seat_position INT,
  back_pad_position INT,
  foot_position INT,
  handle_position INT,
  rom_setting VARCHAR(50),
  recommended_weight_kg DECIMAL(5,2),
  tips JSONB,
  warnings JSONB,
  session_id VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recommendations_user_id ON machine_recommendations (user_id);
CREATE INDEX idx_recommendations_machine_id ON machine_recommendations (machine_id);
CREATE INDEX idx_recommendations_session_id ON machine_recommendations (session_id);
CREATE INDEX idx_recommendations_created_at ON machine_recommendations (created_at DESC);

CREATE TRIGGER trg_machine_recommendations_updated_at
  BEFORE UPDATE ON machine_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
