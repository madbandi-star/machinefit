-- Photo board (사진게시판): isolated tables so existing community boards are untouched.

CREATE TABLE IF NOT EXISTS photo_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  view_count INT NOT NULL DEFAULT 0,
  like_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_posts_user_id ON photo_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_photo_posts_created_at ON photo_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photo_posts_like_count ON photo_posts (like_count DESC);
CREATE INDEX IF NOT EXISTS idx_photo_posts_view_count ON photo_posts (view_count DESC);
CREATE INDEX IF NOT EXISTS idx_photo_posts_comment_count ON photo_posts (comment_count DESC);
CREATE INDEX IF NOT EXISTS idx_photo_posts_hidden_created
  ON photo_posts (is_hidden, created_at DESC);

CREATE TRIGGER trg_photo_posts_updated_at
  BEFORE UPDATE ON photo_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS photo_post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES photo_posts(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_photo_post_images_post_id
  ON photo_post_images (post_id, sort_order);

CREATE TRIGGER trg_photo_post_images_updated_at
  BEFORE UPDATE ON photo_post_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS photo_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(40) NOT NULL,
  name_normalized VARCHAR(40) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photo_post_tags (
  post_id UUID NOT NULL REFERENCES photo_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES photo_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_photo_post_tags_tag_id ON photo_post_tags (tag_id);

CREATE TABLE IF NOT EXISTS photo_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES photo_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_photo_post_likes_post_id ON photo_post_likes (post_id);

CREATE TABLE IF NOT EXISTS photo_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES photo_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES photo_post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_post_comments_post_id
  ON photo_post_comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_photo_post_comments_parent_id
  ON photo_post_comments (parent_id);

CREATE TRIGGER trg_photo_post_comments_updated_at
  BEFORE UPDATE ON photo_post_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS photo_post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES photo_posts(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES photo_post_comments(id) ON DELETE SET NULL,
  reason VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT photo_post_reports_target_chk CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_photo_post_reports_status ON photo_post_reports (status);
CREATE INDEX IF NOT EXISTS idx_photo_post_reports_post_id ON photo_post_reports (post_id);

CREATE TRIGGER trg_photo_post_reports_updated_at
  BEFORE UPDATE ON photo_post_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS photo_user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  blocked_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_photo_user_blocks_user_id ON photo_user_blocks (user_id);
