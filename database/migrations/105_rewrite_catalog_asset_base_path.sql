-- Rewrite static catalog asset URLs after moving SPA base from /machinefit/ to /.
-- Safe to re-run: only rows still prefixed with /machinefit/assets are updated.

UPDATE brands
SET logo_url = replace(logo_url, '/machinefit/assets', '/assets')
WHERE logo_url LIKE '/machinefit/assets%';

UPDATE machine_images
SET image_url = replace(image_url, '/machinefit/assets', '/assets')
WHERE image_url LIKE '/machinefit/assets%';

UPDATE machine_cover_images
SET image_url = replace(image_url, '/machinefit/assets', '/assets')
WHERE image_url LIKE '/machinefit/assets%';
