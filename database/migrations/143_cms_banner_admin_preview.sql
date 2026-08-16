-- Allow admins to preview CMS bottom banners (same creatives free users see).
-- Previously admin_enabled=false made COMMUNITY/MAIN/etc invisible while QA'ing as admin.

UPDATE ad_policies pol
SET admin_enabled = TRUE,
    updated_at = NOW()
FROM ad_placements p
WHERE pol.placement_id = p.id
  AND p.ad_type = 'inline_cms'
  AND pol.event_type IS NULL
  AND pol.admin_enabled = FALSE;
