-- Recommendation fit feedback and user machine preferences

CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL REFERENCES machine_recommendations(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  fit_rating VARCHAR(10) NOT NULL CHECK (fit_rating IN ('good', 'bad')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, recommendation_id)
);

CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user
  ON recommendation_feedback (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_machine_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  custom_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, machine_id)
);

CREATE INDEX IF NOT EXISTS idx_user_machine_preferences_user
  ON user_machine_preferences (user_id);

CREATE TRIGGER trg_user_machine_preferences_updated_at
  BEFORE UPDATE ON user_machine_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
