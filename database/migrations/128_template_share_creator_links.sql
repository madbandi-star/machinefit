-- Optional creator social links on template share posts.
ALTER TABLE template_share_posts
  ADD COLUMN IF NOT EXISTS youtube_url TEXT,
  ADD COLUMN IF NOT EXISTS youtube_channel_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS instagram_id VARCHAR(64);

COMMENT ON COLUMN template_share_posts.youtube_url IS 'Optional creator YouTube URL on share post';
COMMENT ON COLUMN template_share_posts.youtube_channel_name IS 'Optional creator YouTube channel display name';
COMMENT ON COLUMN template_share_posts.instagram_id IS 'Optional creator Instagram handle (without required @)';
