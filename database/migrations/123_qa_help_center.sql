-- Official MachineFit Q&A / help center (admin-authored FAQ).
-- Extensible for future user-submitted questions (source/status columns reserved).

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS qa_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  priority SMALLINT NOT NULL DEFAULT 2,
  title TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  slug TEXT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  not_helpful_count INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  needs_impl_review BOOLEAN NOT NULL DEFAULT FALSE,
  -- Reserved for future user Q intake: 'official' | 'user_submitted' | ...
  source TEXT NOT NULL DEFAULT 'official',
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT qa_articles_category_chk CHECK (
    category IN (
      'getting_started',
      'login_account',
      'workout_recommend',
      'machine_settings',
      'workout_records',
      'timer',
      'templates',
      'ai_recommend',
      'fortune',
      'points',
      'subscription',
      'notifications',
      'mypage_data',
      'privacy_rights',
      'other'
    )
  ),
  CONSTRAINT qa_articles_priority_chk CHECK (priority BETWEEN 0 AND 3),
  CONSTRAINT qa_articles_source_chk CHECK (source IN ('official', 'user_submitted')),
  CONSTRAINT qa_articles_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_qa_articles_list
  ON qa_articles (is_published, priority ASC, display_order ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_qa_articles_category
  ON qa_articles (category, is_published, priority ASC, display_order ASC);

CREATE INDEX IF NOT EXISTS idx_qa_articles_popular
  ON qa_articles (is_published, view_count DESC, helpful_count DESC);

CREATE INDEX IF NOT EXISTS idx_qa_articles_search_trgm_title
  ON qa_articles USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_qa_articles_keywords
  ON qa_articles USING gin (keywords);

COMMENT ON TABLE qa_articles IS
  'Official MachineFit FAQ/help-center articles. Admin-managed; not a user community board.';

-- One vote per authenticated user per article.
CREATE TABLE IF NOT EXISTS qa_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES qa_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT qa_feedback_user_article_uq UNIQUE (article_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_qa_feedback_article
  ON qa_feedback (article_id, is_helpful);

COMMENT ON TABLE qa_feedback IS
  'Per-user helpful/not-helpful votes for Q&A articles (one vote per user).';
