-- Durable image payloads for muscle-group covers (Render-safe without Supabase Storage keys).

ALTER TABLE muscle_group_images
  ADD COLUMN IF NOT EXISTS image_data BYTEA,
  ADD COLUMN IF NOT EXISTS thumbnail_data BYTEA;
