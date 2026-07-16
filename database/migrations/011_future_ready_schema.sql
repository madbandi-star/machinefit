-- =============================================================================
-- MachineFit: Future-Ready Schema Extensions
-- Supports: i18n, machine codes, gym owners, QR, AI/camera, community, history
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. i18n — Reference data & admin-managed translations
-- -----------------------------------------------------------------------------

CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(120) UNIQUE NOT NULL,
  namespace VARCHAR(50) NOT NULL DEFAULT 'common',
  values JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_translations_namespace ON translations (namespace);
CREATE INDEX idx_translations_key ON translations (key);

CREATE TRIGGER trg_translations_updated_at
  BEFORE UPDATE ON translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Board types reference (community + machine request board)
CREATE TABLE board_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(30) UNIQUE NOT NULL,
  name JSONB NOT NULL,
  description JSONB,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_board_types_code ON board_types (code);

CREATE TRIGGER trg_board_types_updated_at
  BEFORE UPDATE ON board_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO board_types (code, name, description, sort_order) VALUES
  ('free', '{"ko":"자유게시판","en":"Free Board","ja":"自由掲示板","zh":"自由版块"}', '{"en":"General discussion"}', 1),
  ('request', '{"ko":"머신 요청 게시판","en":"Machine Request Board","ja":"マシンリクエスト","zh":"器械请求板"}', '{"en":"Request new machines to be added"}', 2),
  ('announcement', '{"ko":"공지사항","en":"Announcements","ja":"お知らせ","zh":"公告"}', '{"en":"Official announcements"}', 0)
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Machine codes — Aliases for search, AI matching, gym labels
-- -----------------------------------------------------------------------------

CREATE TABLE machine_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  alias VARCHAR(200) NOT NULL,
  alias_type VARCHAR(30) NOT NULL DEFAULT 'search',
  language_code VARCHAR(5),
  source VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (machine_id, alias, alias_type)
);

CREATE INDEX idx_machine_aliases_machine_id ON machine_aliases (machine_id);
CREATE INDEX idx_machine_aliases_alias_trgm ON machine_aliases USING GIN (alias gin_trgm_ops);
CREATE INDEX idx_machine_aliases_type ON machine_aliases (alias_type);

COMMENT ON TABLE machine_aliases IS 'Maps display names and AI labels to canonical machines.code';
COMMENT ON COLUMN machine_aliases.alias_type IS 'search | ai_label | gym_label | brand_label | legacy';

CREATE TRIGGER trg_machine_aliases_updated_at
  BEFORE UPDATE ON machine_aliases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3. Gym owner system — Applications & registration workflow
-- -----------------------------------------------------------------------------

CREATE TABLE owner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(200) NOT NULL,
  business_email VARCHAR(255),
  business_phone VARCHAR(30),
  country_id UUID REFERENCES countries(id),
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_owner_applications_user_id ON owner_applications (user_id);
CREATE INDEX idx_owner_applications_status ON owner_applications (status);

COMMENT ON COLUMN owner_applications.status IS 'pending | approved | rejected';

CREATE TRIGGER trg_owner_applications_updated_at
  BEFORE UPDATE ON owner_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Extend gyms for registration workflow and gym finder
ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
  ADD COLUMN IF NOT EXISTS registration_status VARCHAR(20) NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS amenities JSONB,
  ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE UNIQUE INDEX IF NOT EXISTS idx_gyms_slug ON gyms (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gyms_registration_status ON gyms (registration_status);
CREATE INDEX IF NOT EXISTS idx_gyms_verified_active ON gyms (is_verified, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_gyms_search_vector ON gyms USING GIN (search_vector);

COMMENT ON COLUMN gyms.slug IS 'URL-safe identifier for gym finder: /gyms/{slug}';
COMMENT ON COLUMN gyms.registration_status IS 'draft | pending | approved | rejected';
COMMENT ON COLUMN gyms.amenities IS 'JSON: parking, shower, 24h, etc.';

-- Extend gym_machines for inventory management
ALTER TABLE gym_machines
  ADD COLUMN IF NOT EXISTS instance_label VARCHAR(100),
  ADD COLUMN IF NOT EXISTS floor_zone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS condition_notes TEXT,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN gym_machines.instance_label IS 'e.g. "Row 1 - Left" for multi-unit gyms';

-- -----------------------------------------------------------------------------
-- 4. QR code support
-- -----------------------------------------------------------------------------

CREATE TABLE machine_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  qr_code VARCHAR(100) UNIQUE NOT NULL,
  deep_link_path VARCHAR(255) NOT NULL,
  label JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_machine_qr_codes_machine_id ON machine_qr_codes (machine_id);
CREATE UNIQUE INDEX idx_machine_qr_codes_code ON machine_qr_codes (qr_code);

COMMENT ON TABLE machine_qr_codes IS 'Global QR codes mapping to machines.code deep links';
COMMENT ON COLUMN machine_qr_codes.deep_link_path IS 'e.g. /machines/HS_ISO_LATERAL_HIGH_ROW';

CREATE TRIGGER trg_machine_qr_codes_updated_at
  BEFORE UPDATE ON machine_qr_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE gym_machine_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_machine_id UUID NOT NULL REFERENCES gym_machines(id) ON DELETE CASCADE,
  qr_code VARCHAR(100) UNIQUE NOT NULL,
  deep_link_path VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gym_machine_qr_codes_gym_machine ON gym_machine_qr_codes (gym_machine_id);

CREATE TRIGGER trg_gym_machine_qr_codes_updated_at
  BEFORE UPDATE ON gym_machine_qr_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE qr_scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(64),
  qr_code VARCHAR(100) NOT NULL,
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
  deep_link_path VARCHAR(255),
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qr_scan_events_user_id ON qr_scan_events (user_id);
CREATE INDEX idx_qr_scan_events_machine_id ON qr_scan_events (machine_id);
CREATE INDEX idx_qr_scan_events_scanned_at ON qr_scan_events (scanned_at DESC);

CREATE TRIGGER trg_qr_scan_events_updated_at
  BEFORE UPDATE ON qr_scan_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 5. AI-ready architecture — Models, embeddings, vision logs
-- -----------------------------------------------------------------------------

CREATE TABLE ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  model_type VARCHAR(30) NOT NULL,
  version VARCHAR(30) NOT NULL,
  provider VARCHAR(50),
  config JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_models_code ON ai_models (code);
CREATE INDEX idx_ai_models_type ON ai_models (model_type);

COMMENT ON COLUMN ai_models.model_type IS 'vision | embedding | recommendation';

CREATE TRIGGER trg_ai_models_updated_at
  BEFORE UPDATE ON ai_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- pgvector for similarity search (optional — enable when Supabase pgvector is on)
-- CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE machine_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  ai_model_id UUID NOT NULL REFERENCES ai_models(id),
  embedding JSONB NOT NULL,
  dimensions INT NOT NULL DEFAULT 1536,
  source_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (machine_id, ai_model_id)
);

CREATE INDEX idx_machine_embeddings_machine_id ON machine_embeddings (machine_id);
CREATE INDEX idx_machine_embeddings_model_id ON machine_embeddings (ai_model_id);

COMMENT ON TABLE machine_embeddings IS 'AI vector embeddings; use JSONB until pgvector enabled, then migrate to vector(1536)';
COMMENT ON COLUMN machine_embeddings.embedding IS 'Array of floats as JSONB, or pgvector when extension enabled';

CREATE TRIGGER trg_machine_embeddings_updated_at
  BEFORE UPDATE ON machine_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE vision_recognition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(64),
  ai_model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  predicted_machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  predicted_machine_code VARCHAR(80),
  confidence DECIMAL(5,4),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  raw_response JSONB,
  latency_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vision_logs_user_id ON vision_recognition_logs (user_id);
CREATE INDEX idx_vision_logs_machine_id ON vision_recognition_logs (predicted_machine_id);
CREATE INDEX idx_vision_logs_status ON vision_recognition_logs (status);
CREATE INDEX idx_vision_logs_created_at ON vision_recognition_logs (created_at DESC);

COMMENT ON COLUMN vision_recognition_logs.status IS 'pending | success | low_confidence | failed';

CREATE TRIGGER trg_vision_recognition_logs_updated_at
  BEFORE UPDATE ON vision_recognition_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 6. Community enhancements
-- -----------------------------------------------------------------------------

CREATE TABLE post_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_name VARCHAR(255),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_attachments_post_id ON post_attachments (post_id);

CREATE TRIGGER trg_post_attachments_updated_at
  BEFORE UPDATE ON post_attachments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Link machine requests to community posts
ALTER TABLE machine_requests
  ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS requested_machine_code VARCHAR(80),
  ADD COLUMN IF NOT EXISTS vote_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_machine_requests_post_id ON machine_requests (post_id);
CREATE INDEX IF NOT EXISTS idx_machine_requests_brand_id ON machine_requests (brand_id);

COMMENT ON COLUMN machine_requests.requested_machine_code IS 'Proposed code when approved, e.g. HS_NEW_MACHINE';

-- -----------------------------------------------------------------------------
-- 7. Favorites & history — Source tracking (QR, camera, manual)
-- -----------------------------------------------------------------------------

ALTER TABLE favorites
  ADD COLUMN IF NOT EXISTS source VARCHAR(30) NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS metadata JSONB;

ALTER TABLE recent_history
  ADD COLUMN IF NOT EXISTS source VARCHAR(30) NOT NULL DEFAULT 'recommendation',
  ADD COLUMN IF NOT EXISTS metadata JSONB;

COMMENT ON COLUMN favorites.source IS 'manual | recommendation | qr_scan | camera | search';
COMMENT ON COLUMN recent_history.source IS 'recommendation | qr_scan | camera | manual';

-- -----------------------------------------------------------------------------
-- 8. Workout history placeholder (Apple Health, Google Fit, watches)
-- -----------------------------------------------------------------------------

CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  recommendation_id UUID REFERENCES machine_recommendations(id) ON DELETE SET NULL,
  gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
  source VARCHAR(30) NOT NULL DEFAULT 'manual',
  external_id VARCHAR(255),
  external_provider VARCHAR(50),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  sets_completed INT,
  reps_completed INT,
  weight_kg DECIMAL(6,2),
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workout_sessions_user_id ON workout_sessions (user_id);
CREATE INDEX idx_workout_sessions_machine_id ON workout_sessions (machine_id);
CREATE INDEX idx_workout_sessions_started_at ON workout_sessions (user_id, started_at DESC);
CREATE UNIQUE INDEX idx_workout_sessions_external ON workout_sessions (external_provider, external_id)
  WHERE external_id IS NOT NULL;

COMMENT ON COLUMN workout_sessions.source IS 'manual | apple_health | google_fit | health_connect | watch';
COMMENT ON COLUMN workout_sessions.external_provider IS 'apple_health | google_fit | health_connect | galaxy_watch | apple_watch';

CREATE TRIGGER trg_workout_sessions_updated_at
  BEFORE UPDATE ON workout_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 9. Guest sessions (pre-login tracking)
-- -----------------------------------------------------------------------------

CREATE TABLE guest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(64) UNIQUE NOT NULL,
  language_code VARCHAR(5) DEFAULT 'en',
  country_code CHAR(2),
  unit_height VARCHAR(10) DEFAULT 'cm',
  unit_weight VARCHAR(10) DEFAULT 'kg',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guest_sessions_session_id ON guest_sessions (session_id);
CREATE INDEX idx_guest_sessions_last_seen ON guest_sessions (last_seen_at DESC);

CREATE TRIGGER trg_guest_sessions_updated_at
  BEFORE UPDATE ON guest_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 10. Helper: Auto-update gym search vector
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION gyms_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.city, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.address, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gyms_search_vector
  BEFORE INSERT OR UPDATE OF name, city, address ON gyms
  FOR EACH ROW EXECUTE FUNCTION gyms_search_vector_update();

-- -----------------------------------------------------------------------------
-- 11. Canonical code comments on core tables
-- -----------------------------------------------------------------------------

COMMENT ON COLUMN machines.code IS 'Canonical global identifier. API uses machineCode, never localized name.';
COMMENT ON COLUMN brands.code IS 'Canonical brand identifier. API uses brandCode.';
COMMENT ON TABLE machine_settings IS 'Recommendation rules keyed by machine_id (resolved from machines.code).';
