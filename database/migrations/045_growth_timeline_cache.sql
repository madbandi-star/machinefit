-- Cached AI Growth Timeline snapshots (refreshed on workout save / read).

CREATE TABLE IF NOT EXISTS user_growth_timeline (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  snapshot_json JSONB NOT NULL,
  log_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_growth_timeline IS
  'Cached Growth Timeline snapshot JSON for fast My Page reads.';
