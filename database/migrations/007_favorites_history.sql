-- Favorites
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES machine_recommendations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, machine_id)
);

CREATE INDEX idx_favorites_user_id ON favorites (user_id);

CREATE TRIGGER trg_favorites_updated_at
  BEFORE UPDATE ON favorites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recent history
CREATE TABLE recent_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id),
  recommendation_id UUID NOT NULL REFERENCES machine_recommendations(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, recommendation_id)
);

CREATE INDEX idx_history_user_viewed ON recent_history (user_id, viewed_at DESC);

CREATE TRIGGER trg_recent_history_updated_at
  BEFORE UPDATE ON recent_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
