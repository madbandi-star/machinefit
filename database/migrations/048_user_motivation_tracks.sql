-- User personal motivation audio library (URL or uploaded file).
CREATE TABLE IF NOT EXISTS user_motivation_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('upload', 'url')),
  media_url TEXT NOT NULL,
  storage_path TEXT,
  original_filename TEXT,
  mime_type VARCHAR(120),
  file_size_bytes BIGINT,
  duration_seconds NUMERIC(10, 2),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_motivation_tracks_file_size_nonneg
    CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  CONSTRAINT user_motivation_tracks_duration_nonneg
    CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);

CREATE INDEX IF NOT EXISTS idx_user_motivation_tracks_user_created
  ON user_motivation_tracks (user_id, created_at DESC);

-- At most one default track per user.
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_motivation_tracks_default
  ON user_motivation_tracks (user_id)
  WHERE is_default = TRUE;

DROP TRIGGER IF EXISTS trg_user_motivation_tracks_updated_at ON user_motivation_tracks;
CREATE TRIGGER trg_user_motivation_tracks_updated_at
  BEFORE UPDATE ON user_motivation_tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
