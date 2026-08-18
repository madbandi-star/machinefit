-- Machine showcase community: 「우리 헬스장 기구 자랑」
-- Isolated tables (do not alter photo_posts / free-board posts).
-- Express authorizes via JWT; RLS denies PostgREST anon/authenticated.

-- ---------------------------------------------------------------------------
-- Cached rarity (server-calculated; clients never write grade)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS machine_rarity (
  machine_id UUID PRIMARY KEY REFERENCES machines(id) ON DELETE CASCADE,
  grade VARCHAR(20) NOT NULL DEFAULT 'COMMON',
  auto_grade VARCHAR(20) NOT NULL DEFAULT 'COMMON',
  score INT NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  gym_holding_count INT NOT NULL DEFAULT 0,
  user_gym_holding_count INT NOT NULL DEFAULT 0,
  post_count INT NOT NULL DEFAULT 0,
  discovery_count INT NOT NULL DEFAULT 0,
  admin_weight INT NOT NULL DEFAULT 0 CHECK (admin_weight BETWEEN -100 AND 100),
  unique_flag BOOLEAN NOT NULL DEFAULT FALSE,
  grade_override VARCHAR(20),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT machine_rarity_grade_chk
    CHECK (grade IN ('COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MYTHIC','UNIQUE')),
  CONSTRAINT machine_rarity_auto_grade_chk
    CHECK (auto_grade IN ('COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MYTHIC')),
  CONSTRAINT machine_rarity_override_chk
    CHECK (
      grade_override IS NULL
      OR grade_override IN ('COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MYTHIC','UNIQUE')
    )
);

CREATE INDEX IF NOT EXISTS idx_machine_rarity_grade_score
  ON machine_rarity (grade, score DESC);

CREATE TRIGGER trg_machine_rarity_updated_at
  BEFORE UPDATE ON machine_rarity
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Showcase posts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS machine_showcase_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id),
  user_gym_id UUID REFERENCES user_gyms(id) ON DELETE SET NULL,
  gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
  caption TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  view_count INT NOT NULL DEFAULT 0,
  like_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  bookmark_count INT NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT machine_showcase_posts_status_chk
    CHECK (status IN ('published', 'hidden', 'deleted'))
);

CREATE INDEX IF NOT EXISTS idx_msp_created
  ON machine_showcase_posts (created_at DESC)
  WHERE deleted_at IS NULL AND is_hidden = FALSE;

CREATE INDEX IF NOT EXISTS idx_msp_popular
  ON machine_showcase_posts (like_count DESC, created_at DESC)
  WHERE deleted_at IS NULL AND is_hidden = FALSE;

CREATE INDEX IF NOT EXISTS idx_msp_machine_created
  ON machine_showcase_posts (machine_id, created_at DESC)
  WHERE deleted_at IS NULL AND is_hidden = FALSE;

CREATE INDEX IF NOT EXISTS idx_msp_gym_created
  ON machine_showcase_posts (gym_id, created_at DESC)
  WHERE deleted_at IS NULL AND is_hidden = FALSE AND gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_msp_user_gym_created
  ON machine_showcase_posts (user_gym_id, created_at DESC)
  WHERE deleted_at IS NULL AND is_hidden = FALSE AND user_gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_msp_user_id
  ON machine_showcase_posts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_msp_tags_gin
  ON machine_showcase_posts USING GIN (tags);

CREATE TRIGGER trg_machine_showcase_posts_updated_at
  BEFORE UPDATE ON machine_showcase_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS machine_showcase_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES machine_showcase_posts(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'image/webp',
  width INT,
  height INT,
  file_size_bytes INT,
  image_data BYTEA NOT NULL,
  thumbnail_data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_msi_post_sort
  ON machine_showcase_images (post_id, sort_order);

CREATE TRIGGER trg_machine_showcase_images_updated_at
  BEFORE UPDATE ON machine_showcase_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS machine_showcase_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES machine_showcase_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_msl_post_id ON machine_showcase_likes (post_id);

CREATE TABLE IF NOT EXISTS machine_showcase_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES machine_showcase_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_msb_user_created
  ON machine_showcase_bookmarks (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS machine_showcase_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES machine_showcase_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES machine_showcase_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_msc_post_created
  ON machine_showcase_comments (post_id, created_at)
  WHERE deleted_at IS NULL AND is_hidden = FALSE;

CREATE TRIGGER trg_machine_showcase_comments_updated_at
  BEFORE UPDATE ON machine_showcase_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS machine_showcase_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES machine_showcase_posts(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES machine_showcase_comments(id) ON DELETE SET NULL,
  reason VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT machine_showcase_reports_target_chk
    CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_msr_status ON machine_showcase_reports (status);
CREATE INDEX IF NOT EXISTS idx_msr_post_id ON machine_showcase_reports (post_id);

CREATE TRIGGER trg_machine_showcase_reports_updated_at
  BEFORE UPDATE ON machine_showcase_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Personal gym holdings ("이 기구 우리 헬스장에도 있음")
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_gym_machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_gym_id UUID NOT NULL REFERENCES user_gyms(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id),
  source VARCHAR(30) NOT NULL DEFAULT 'claim',
  claimed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  source_post_id UUID REFERENCES machine_showcase_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_gym_id, machine_id),
  CONSTRAINT user_gym_machines_source_chk
    CHECK (source IN ('claim', 'post', 'manual'))
);

CREATE INDEX IF NOT EXISTS idx_ugm_machine_id ON user_gym_machines (machine_id);
CREATE INDEX IF NOT EXISTS idx_ugm_user_gym_created
  ON user_gym_machines (user_gym_id, created_at DESC);

CREATE TRIGGER trg_user_gym_machines_updated_at
  BEFORE UPDATE ON user_gym_machines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Machine Dex / discoveries (one row per user × machine)
-- discovery_rank is assigned only from valid published posts (not claims)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS machine_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  first_post_id UUID REFERENCES machine_showcase_posts(id) ON DELETE SET NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'post',
  discovery_rank INT,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, machine_id),
  CONSTRAINT machine_discoveries_source_chk
    CHECK (source IN ('post', 'claim'))
);

CREATE INDEX IF NOT EXISTS idx_md_user_discovered
  ON machine_discoveries (user_id, discovered_at DESC);

CREATE INDEX IF NOT EXISTS idx_md_machine_rank
  ON machine_discoveries (machine_id, discovery_rank)
  WHERE discovery_rank IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_md_machine_discovered
  ON machine_discoveries (machine_id, discovered_at);

-- ---------------------------------------------------------------------------
-- RLS lock (Express DB role; deny PostgREST)
-- ---------------------------------------------------------------------------
ALTER TABLE machine_rarity ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_showcase_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_showcase_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_showcase_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_showcase_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_showcase_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_showcase_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gym_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_discoveries ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'machine_rarity',
    'machine_showcase_posts',
    'machine_showcase_images',
    'machine_showcase_likes',
    'machine_showcase_bookmarks',
    'machine_showcase_comments',
    'machine_showcase_reports',
    'user_gym_machines',
    'machine_discoveries'
  ]
  LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated, PUBLIC', t);
    EXCEPTION
      WHEN undefined_object THEN NULL;
    END;
  END LOOP;
END $$;
