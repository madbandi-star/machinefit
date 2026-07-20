-- Motivation music / video playlists (admin-curated, up to 5 per type).

CREATE TABLE IF NOT EXISTS motivation_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('music', 'video')),
  title VARCHAR(200) NOT NULL,
  media_url TEXT NOT NULL,
  youtube_id VARCHAR(32),
  sort_order INT NOT NULL DEFAULT 0,
  is_selected BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT motivation_media_sort_nonneg CHECK (sort_order >= 0 AND sort_order < 5)
);

CREATE INDEX IF NOT EXISTS idx_motivation_media_type_order
  ON motivation_media (media_type, sort_order)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_motivation_media_playlist
  ON motivation_media (media_type, sort_order)
  WHERE is_active = TRUE AND is_selected = TRUE;

COMMENT ON TABLE motivation_media IS 'Admin-curated motivation music/video slots (max 5 per type)';
COMMENT ON COLUMN motivation_media.is_selected IS 'When TRUE, included in user play button playlist';
COMMENT ON COLUMN motivation_media.youtube_id IS 'Extracted YouTube id for video embeds; NULL for music';

DROP TRIGGER IF EXISTS trg_motivation_media_updated_at ON motivation_media;
CREATE TRIGGER trg_motivation_media_updated_at
  BEFORE UPDATE ON motivation_media
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
