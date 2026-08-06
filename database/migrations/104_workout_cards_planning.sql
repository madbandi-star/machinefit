-- Workout planning cards: future-dated plans with status lifecycle.
-- Compatible with existing workout_logs / recent_history (stats still use COMPLETED logs only).

CREATE TABLE IF NOT EXISTS workout_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES user_gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES gym_members(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES machine_recommendations(id) ON DELETE SET NULL,
  target_muscle_group TEXT NOT NULL DEFAULT '',
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'COMPLETED'
    CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')),
  set_count INT NOT NULL DEFAULT 1
    CHECK (set_count >= 1 AND set_count <= 20),
  set_weights_kg JSONB NOT NULL DEFAULT '[]'::jsonb,
  set_reps JSONB,
  set_completed JSONB,
  diary TEXT,
  rest_seconds INT
    CHECK (rest_seconds IS NULL OR (rest_seconds >= 0 AND rest_seconds <= 7200)),
  display_order INT NOT NULL DEFAULT 0
    CHECK (display_order >= 0 AND display_order < 500),
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE SET NULL,
  source_card_id UUID REFERENCES workout_cards(id) ON DELETE SET NULL,
  template_id UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, gym_id, member_id, machine_id, scheduled_date, target_muscle_group)
);

CREATE INDEX IF NOT EXISTS idx_workout_cards_user_date
  ON workout_cards (user_id, scheduled_date, status);

CREATE INDEX IF NOT EXISTS idx_workout_cards_scope_date
  ON workout_cards (user_id, gym_id, member_id, scheduled_date, display_order);

CREATE INDEX IF NOT EXISTS idx_workout_cards_status_date
  ON workout_cards (status, scheduled_date)
  WHERE status IN ('PLANNED', 'IN_PROGRESS');

CREATE INDEX IF NOT EXISTS idx_workout_cards_member_date
  ON workout_cards (member_id, scheduled_date);

DROP TRIGGER IF EXISTS trg_workout_cards_updated_at ON workout_cards;
CREATE TRIGGER trg_workout_cards_updated_at
  BEFORE UPDATE ON workout_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE workout_cards IS
  'Planned/in-progress/completed/skipped workout cards keyed by day + machine (+ free-weight muscle)';
COMMENT ON COLUMN workout_cards.scheduled_date IS
  'Calendar day for the plan or session (may be in the future)';
COMMENT ON COLUMN workout_cards.status IS
  'PLANNED | IN_PROGRESS | COMPLETED | SKIPPED — PLANNED excluded from lifted/stats';

-- Reusable day templates (array of card snapshots in payload).
CREATE TABLE IF NOT EXISTS workout_card_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gym_id UUID REFERENCES user_gyms(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_card_templates_user
  ON workout_card_templates (user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_workout_card_templates_updated_at ON workout_card_templates;
CREATE TRIGGER trg_workout_card_templates_updated_at
  BEFORE UPDATE ON workout_card_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE workout_cards
  DROP CONSTRAINT IF EXISTS workout_cards_template_id_fkey;
ALTER TABLE workout_cards
  ADD CONSTRAINT workout_cards_template_id_fkey
  FOREIGN KEY (template_id) REFERENCES workout_card_templates(id) ON DELETE SET NULL;

ALTER TABLE workout_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_card_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    EXECUTE 'REVOKE ALL ON TABLE workout_cards FROM anon, authenticated, PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE workout_card_templates FROM anon, authenticated, PUBLIC';
  EXCEPTION
    WHEN undefined_object THEN NULL;
  END;
END $$;
