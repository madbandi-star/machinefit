-- Public banner list used to require desktop image_url only.
-- Backfill desktop URL from mobile when missing so existing creatives can go live.

UPDATE banners
SET
  image_url = mobile_image_url,
  image_storage_path = COALESCE(image_storage_path, mobile_image_storage_path)
WHERE deleted_at IS NULL
  AND image_url IS NULL
  AND mobile_image_url IS NOT NULL;

COMMENT ON COLUMN banners.image_url IS
  'Desktop creative URL (preferred). Public API also accepts mobile_image_url as fallback.';
