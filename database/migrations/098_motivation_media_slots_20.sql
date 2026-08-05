-- Raise motivation_media slot cap from 5 → 20 per media_type (music / video).
-- Rollback:
--   ALTER TABLE motivation_media DROP CONSTRAINT IF EXISTS motivation_media_sort_nonneg;
--   ALTER TABLE motivation_media
--     ADD CONSTRAINT motivation_media_sort_nonneg CHECK (sort_order >= 0 AND sort_order < 5);
--   COMMENT ON TABLE motivation_media IS 'Admin-curated motivation music/video slots (max 5 per type)';

ALTER TABLE motivation_media DROP CONSTRAINT IF EXISTS motivation_media_sort_nonneg;

ALTER TABLE motivation_media
  ADD CONSTRAINT motivation_media_sort_nonneg
  CHECK (sort_order >= 0 AND sort_order < 20);

COMMENT ON TABLE motivation_media IS 'Admin-curated motivation music/video slots (max 20 per type)';
