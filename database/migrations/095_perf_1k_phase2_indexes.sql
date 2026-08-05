-- Performance phase 2: additive indexes for list/filter hot paths.
-- No schema contract or query-result shape changes.

-- Active trade listings (hidden + status + recency)
CREATE INDEX IF NOT EXISTS idx_machine_trades_active_list
  ON machine_trades (is_hidden, status, expired_at DESC, created_at DESC)
  WHERE is_hidden = FALSE;

-- Popular trade sort among visible listings
CREATE INDEX IF NOT EXISTS idx_machine_trades_active_popular
  ON machine_trades (like_count DESC, created_at DESC)
  WHERE is_hidden = FALSE
    AND status NOT IN ('expired', 'cancelled', 'sold', 'purchased');

-- Photo board popular sort among visible posts
CREATE INDEX IF NOT EXISTS idx_photo_posts_visible_popular
  ON photo_posts (like_count DESC, created_at DESC)
  WHERE is_hidden = FALSE;

-- Community board list (board_type + pin + created)
CREATE INDEX IF NOT EXISTS idx_posts_board_pin_created
  ON posts (board_type, is_pinned DESC, created_at DESC)
  WHERE is_hidden = FALSE;

-- Friend pair lookup when status is ACCEPTED (feed EXISTS)
CREATE INDEX IF NOT EXISTS idx_friendships_pair_accepted
  ON friendships (user_low_id, user_high_id)
  WHERE status = 'ACCEPTED';

-- Login audit by day (ops loginStatsToday)
CREATE INDEX IF NOT EXISTS idx_auth_login_events_created
  ON auth_login_events (created_at DESC);
