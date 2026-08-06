-- MachineFit notice board (공지사항): multilingual, attachments, view dedupe, soft delete.

CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT 'notice'
    CHECK (category IN ('notice', 'event', 'maintenance', 'update', 'other')),
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'PUBLISHED', 'HIDDEN', 'RESERVED')),
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_important BOOLEAN NOT NULL DEFAULT FALSE,
  is_banner BOOLEAN NOT NULL DEFAULT FALSE,
  is_popup BOOLEAN NOT NULL DEFAULT FALSE,
  publish_at TIMESTAMPTZ,
  view_count INT NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notices_public_list
  ON notices (is_pinned DESC, publish_at DESC NULLS LAST, created_at DESC)
  WHERE deleted_at IS NULL AND status = 'PUBLISHED';

CREATE INDEX IF NOT EXISTS idx_notices_admin_list
  ON notices (deleted_at, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notices_reserved_publish
  ON notices (publish_at)
  WHERE deleted_at IS NULL AND status = 'RESERVED';

CREATE INDEX IF NOT EXISTS idx_notices_banner
  ON notices (created_at DESC)
  WHERE deleted_at IS NULL AND status = 'PUBLISHED' AND is_banner = TRUE;

CREATE INDEX IF NOT EXISTS idx_notices_popup
  ON notices (created_at DESC)
  WHERE deleted_at IS NULL AND status = 'PUBLISHED' AND is_popup = TRUE;

CREATE INDEX IF NOT EXISTS idx_notices_category
  ON notices (category)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_notices_updated_at ON notices;
CREATE TRIGGER trg_notices_updated_at
  BEFORE UPDATE ON notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE notices IS 'Operational notice board posts (admin-managed)';
COMMENT ON COLUMN notices.status IS 'DRAFT | PUBLISHED | HIDDEN | RESERVED';
COMMENT ON COLUMN notices.is_banner IS 'Eligible for home top banner slot';
COMMENT ON COLUMN notices.is_popup IS 'Show once as login popup when published';

CREATE TABLE IF NOT EXISTS notice_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('ko', 'en', 'ja', 'zh')),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (notice_id, language)
);

CREATE INDEX IF NOT EXISTS idx_notice_translations_notice
  ON notice_translations (notice_id);

CREATE INDEX IF NOT EXISTS idx_notice_translations_search
  ON notice_translations USING gin (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, ''))
  );

DROP TRIGGER IF EXISTS trg_notice_translations_updated_at ON notice_translations;
CREATE TRIGGER trg_notice_translations_updated_at
  BEFORE UPDATE ON notice_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE notice_translations IS 'Localized title/body for notices (ko/en/ja/zh)';

CREATE TABLE IF NOT EXISTS notice_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes INT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 20971520),
  storage_path TEXT NOT NULL,
  public_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_inline_image BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notice_attachments_notice
  ON notice_attachments (notice_id, sort_order);

COMMENT ON TABLE notice_attachments IS 'Notice files in Supabase Storage (or local fallback); max 10 per notice, 20MB each';

CREATE TABLE IF NOT EXISTS notice_views (
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  viewer_key TEXT NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (notice_id, viewer_key)
);

CREATE INDEX IF NOT EXISTS idx_notice_views_recent
  ON notice_views (notice_id, viewed_at DESC);

COMMENT ON TABLE notice_views IS 'Per-viewer last view timestamp for 30-minute view_count dedupe';

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_views ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    EXECUTE 'REVOKE ALL ON TABLE notices FROM anon, authenticated, PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE notice_translations FROM anon, authenticated, PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE notice_attachments FROM anon, authenticated, PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE notice_views FROM anon, authenticated, PUBLIC';
  EXCEPTION
    WHEN undefined_object THEN NULL;
  END;
END $$;
