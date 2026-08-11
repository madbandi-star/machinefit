-- Template Sharing Hub (템플릿 공유관): lineage on private templates + public posts/social.

-- ---------------------------------------------------------------------------
-- Private template lineage (원본 / 받아가기 추적)
-- ---------------------------------------------------------------------------
ALTER TABLE workout_card_templates
  ADD COLUMN IF NOT EXISTS is_original BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS original_template_id UUID REFERENCES workout_card_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_template_id UUID REFERENCES workout_card_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_share_post_id UUID,
  ADD COLUMN IF NOT EXISTS origin_author_name TEXT,
  ADD COLUMN IF NOT EXISTS origin_title TEXT;

CREATE INDEX IF NOT EXISTS idx_workout_card_templates_original
  ON workout_card_templates (original_template_id)
  WHERE original_template_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workout_card_templates_source_share
  ON workout_card_templates (source_share_post_id)
  WHERE source_share_post_id IS NOT NULL;

COMMENT ON COLUMN workout_card_templates.is_original IS 'TRUE only for user-authored templates (never downloaded copies)';
COMMENT ON COLUMN workout_card_templates.original_template_id IS 'Root author template id when this row is a download copy';
COMMENT ON COLUMN workout_card_templates.source_template_id IS 'Immediate source template id for lineage';
COMMENT ON COLUMN workout_card_templates.source_share_post_id IS 'Public share post this copy was downloaded from';

-- ---------------------------------------------------------------------------
-- Public share posts (frozen payload snapshot)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS template_share_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_template_id UUID REFERENCES workout_card_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  difficulty TEXT NOT NULL DEFAULT 'beginner'
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  payload JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'hidden', 'removed')),
  view_count INT NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  download_count INT NOT NULL DEFAULT 0 CHECK (download_count >= 0),
  use_count INT NOT NULL DEFAULT 0 CHECK (use_count >= 0),
  like_count INT NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  comment_count INT NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
  favorite_count INT NOT NULL DEFAULT 0 CHECK (favorite_count >= 0),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_template_id)
);

CREATE INDEX IF NOT EXISTS idx_template_share_posts_public_list
  ON template_share_posts (status, published_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_template_share_posts_author
  ON template_share_posts (author_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_template_share_posts_search
  ON template_share_posts USING gin (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(array_to_string(tags, ' '), ''))
  );

DROP TRIGGER IF EXISTS trg_template_share_posts_updated_at ON template_share_posts;
CREATE TRIGGER trg_template_share_posts_updated_at
  BEFORE UPDATE ON template_share_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE template_share_posts IS 'Public template share posts; payload is frozen at publish time';

-- FK from private templates → posts (deferred until posts exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workout_card_templates_source_share_post_id_fkey'
  ) THEN
    ALTER TABLE workout_card_templates
      ADD CONSTRAINT workout_card_templates_source_share_post_id_fkey
      FOREIGN KEY (source_share_post_id) REFERENCES template_share_posts(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS template_share_likes (
  post_id UUID NOT NULL REFERENCES template_share_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS template_share_favorites (
  post_id UUID NOT NULL REFERENCES template_share_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS template_share_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES template_share_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_template_share_comments_post
  ON template_share_comments (post_id, created_at DESC)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_template_share_comments_updated_at ON template_share_comments;
CREATE TRIGGER trg_template_share_comments_updated_at
  BEFORE UPDATE ON template_share_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS template_share_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES template_share_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  copied_template_id UUID REFERENCES workout_card_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_template_share_downloads_user
  ON template_share_downloads (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS template_share_views (
  post_id UUID NOT NULL REFERENCES template_share_posts(id) ON DELETE CASCADE,
  viewer_key TEXT NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, viewer_key)
);

CREATE TABLE IF NOT EXISTS template_share_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES template_share_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_template_id UUID REFERENCES workout_card_templates(id) ON DELETE SET NULL,
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE SET NULL,
  used_on_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id, user_template_id, used_on_date)
);

CREATE INDEX IF NOT EXISTS idx_template_share_usage_post
  ON template_share_usage_events (post_id, created_at DESC);

CREATE TABLE IF NOT EXISTS template_share_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES template_share_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES template_share_comments(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'reviewed', 'actioned', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_template_share_reports_open
  ON template_share_reports (status, created_at DESC)
  WHERE status = 'open';

-- RLS lock (Express uses service role / pool owner)
ALTER TABLE template_share_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_share_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_share_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_share_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_share_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_share_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_share_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_share_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    EXECUTE 'REVOKE ALL ON TABLE template_share_posts FROM anon, authenticated, PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE template_share_likes FROM anon, authenticated, PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE template_share_favorites FROM anon, authenticated, PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE template_share_comments FROM anon, authenticated, PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE template_share_downloads FROM anon, authenticated, PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE template_share_views FROM anon, authenticated, PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE template_share_usage_events FROM anon, authenticated, PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE template_share_reports FROM anon, authenticated, PUBLIC';
  EXCEPTION
    WHEN undefined_object THEN NULL;
  END;
END $$;
