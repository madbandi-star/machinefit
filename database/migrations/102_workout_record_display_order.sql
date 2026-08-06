-- Per-day display order for workout record cards (history + logs).
-- Cards are keyed by machine + optional free-weight target muscle for a log_date.

CREATE TABLE IF NOT EXISTS workout_record_display_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES user_gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES gym_members(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  target_muscle_group TEXT NOT NULL DEFAULT '',
  display_order INT NOT NULL CHECK (display_order >= 0 AND display_order < 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, gym_id, member_id, log_date, machine_id, target_muscle_group)
);

CREATE INDEX IF NOT EXISTS idx_workout_record_display_orders_scope_date
  ON workout_record_display_orders (user_id, gym_id, member_id, log_date, display_order);

CREATE INDEX IF NOT EXISTS idx_workout_record_display_orders_member_date
  ON workout_record_display_orders (member_id, log_date);

DROP TRIGGER IF EXISTS trg_workout_record_display_orders_updated_at ON workout_record_display_orders;
CREATE TRIGGER trg_workout_record_display_orders_updated_at
  BEFORE UPDATE ON workout_record_display_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE workout_record_display_orders IS
  'User-defined order of workout record cards within a single calendar day';
COMMENT ON COLUMN workout_record_display_orders.display_order IS
  '0-based position within the day (lower = higher on screen)';

ALTER TABLE workout_record_display_orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    EXECUTE 'REVOKE ALL ON TABLE workout_record_display_orders FROM anon, authenticated, PUBLIC';
  EXCEPTION
    WHEN undefined_object THEN NULL;
  END;
END $$;
