-- Machine request board: required photo attachments + commercial-use consent

ALTER TABLE machine_requests
  ADD COLUMN IF NOT EXISTS commercial_use_consent BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE machine_requests
SET brand_name = COALESCE(NULLIF(TRIM(brand_name), ''), '미상')
WHERE brand_name IS NULL OR TRIM(brand_name) = '';

UPDATE machine_requests
SET description = COALESCE(NULLIF(TRIM(description), ''), '(설명 없음)')
WHERE description IS NULL OR TRIM(description) = '';

ALTER TABLE machine_requests
  ALTER COLUMN brand_name SET NOT NULL,
  ALTER COLUMN description SET NOT NULL;

CREATE TABLE IF NOT EXISTS machine_request_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES machine_requests(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'image/webp',
  width INT,
  height INT,
  file_size_bytes INT,
  image_data BYTEA NOT NULL,
  thumbnail_data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_machine_request_images_request_id
  ON machine_request_images (request_id, sort_order);
