-- Machine request board: photo-board-style likes & comments

ALTER TABLE machine_requests
  ADD COLUMN IF NOT EXISTS like_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS machine_request_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES machine_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, request_id)
);

CREATE INDEX IF NOT EXISTS idx_machine_request_likes_request_id
  ON machine_request_likes (request_id);

CREATE TABLE IF NOT EXISTS machine_request_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES machine_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES machine_request_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_machine_request_comments_request_id
  ON machine_request_comments (request_id, created_at);
CREATE INDEX IF NOT EXISTS idx_machine_request_comments_parent_id
  ON machine_request_comments (parent_id);

DROP TRIGGER IF EXISTS trg_machine_request_comments_updated_at ON machine_request_comments;
CREATE TRIGGER trg_machine_request_comments_updated_at
  BEFORE UPDATE ON machine_request_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_machine_requests_like_count
  ON machine_requests (like_count DESC);
CREATE INDEX IF NOT EXISTS idx_machine_requests_comment_count
  ON machine_requests (comment_count DESC);
