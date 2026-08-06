-- Optional content translation ledger for entities that outgrow JSONB columns.
-- Existing brands/machines/tips continue to use LocalizedString JSONB (ko/en/ja/zh).
-- This table supports admin notices, FAQ, and future CMS-style copy without
-- altering every entity schema. Application code may adopt gradually.
-- Rollback: DROP TABLE IF EXISTS content_translations;

CREATE TABLE IF NOT EXISTS content_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  language VARCHAR(8) NOT NULL CHECK (language IN ('ko', 'en', 'ja', 'zh')),
  title TEXT,
  content TEXT,
  description TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (target_type, target_id, language)
);

CREATE INDEX IF NOT EXISTS idx_content_translations_target
  ON content_translations (target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_content_translations_lang
  ON content_translations (language);

CREATE TRIGGER trg_content_translations_updated_at
  BEFORE UPDATE ON content_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE content_translations IS
  'Generic i18n rows for notices/FAQ/CMS; entity catalogs keep JSONB LocalizedString';
