-- Motivation music cover images (admin catalog + user library).
-- Rollback:
--   ALTER TABLE motivation_media DROP COLUMN IF EXISTS cover_image_url;
--   ALTER TABLE user_motivation_tracks DROP COLUMN IF EXISTS cover_image_url;

ALTER TABLE motivation_media
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

ALTER TABLE user_motivation_tracks
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

COMMENT ON COLUMN motivation_media.cover_image_url IS 'Optional cover art URL for music slots (unused for video)';
COMMENT ON COLUMN user_motivation_tracks.cover_image_url IS 'Optional cover art URL shown in motivation player';
