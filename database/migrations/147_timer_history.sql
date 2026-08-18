-- Workout session timer history (home stopwatch). Isolated from workout_logs.
-- Express authorizes via JWT; RLS denies PostgREST anon/authenticated.

-- ---------------------------------------------------------------------------
-- Sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS timer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_session_id UUID NOT NULL,
  gym_id UUID REFERENCES user_gyms(id) ON DELETE SET NULL,
  member_id UUID REFERENCES gym_members(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  duration_seconds INT NOT NULL CHECK (duration_seconds >= 0 AND duration_seconds <= 86400),
  lap_count INT NOT NULL DEFAULT 0 CHECK (lap_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, client_session_id),
  CONSTRAINT timer_sessions_time_chk CHECK (ended_at >= started_at)
);

CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_date
  ON timer_sessions (user_id, session_date DESC);

CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_started
  ON timer_sessions (user_id, started_at DESC);

CREATE TRIGGER trg_timer_sessions_updated_at
  BEFORE UPDATE ON timer_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Laps (ordered by lap_number)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS timer_laps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timer_session_id UUID NOT NULL REFERENCES timer_sessions(id) ON DELETE CASCADE,
  lap_number INT NOT NULL CHECK (lap_number >= 1),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  duration_seconds INT NOT NULL CHECK (duration_seconds >= 0 AND duration_seconds <= 86400),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (timer_session_id, lap_number),
  CONSTRAINT timer_laps_time_chk CHECK (ended_at >= started_at)
);

CREATE INDEX IF NOT EXISTS idx_timer_laps_session_number
  ON timer_laps (timer_session_id, lap_number);

-- ---------------------------------------------------------------------------
-- Lap ↔ workout log / machine (optional; log deletion must not drop the session)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS timer_lap_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timer_lap_id UUID NOT NULL REFERENCES timer_laps(id) ON DELETE CASCADE,
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE SET NULL,
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  machine_code TEXT,
  machine_name_snapshot TEXT,
  recorded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timer_lap_exercises_lap
  ON timer_lap_exercises (timer_lap_id, created_at);

CREATE INDEX IF NOT EXISTS idx_timer_lap_exercises_log
  ON timer_lap_exercises (workout_log_id)
  WHERE workout_log_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RLS lock (Express DB role; deny PostgREST)
-- ---------------------------------------------------------------------------
ALTER TABLE timer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_laps ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_lap_exercises ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'timer_sessions',
    'timer_laps',
    'timer_lap_exercises'
  ]
  LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated, PUBLIC', t);
    EXCEPTION
      WHEN undefined_object THEN NULL;
    END;
  END LOOP;
END $$;
