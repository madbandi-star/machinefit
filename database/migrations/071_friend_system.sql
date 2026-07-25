-- Friend system (independent module). Extensible for chat / group workouts / challenges.

CREATE TABLE IF NOT EXISTS friend_privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  profile_visibility VARCHAR(20) NOT NULL DEFAULT 'friends'
    CHECK (profile_visibility IN ('public', 'friends', 'private')),
  workout_records_visibility VARCHAR(20) NOT NULL DEFAULT 'friends'
    CHECK (workout_records_visibility IN ('public', 'friends', 'private')),
  workout_report_visibility VARCHAR(20) NOT NULL DEFAULT 'friends'
    CHECK (workout_report_visibility IN ('public', 'friends', 'private')),
  growth_visibility VARCHAR(20) NOT NULL DEFAULT 'friends'
    CHECK (growth_visibility IN ('public', 'friends', 'private')),
  badges_visibility VARCHAR(20) NOT NULL DEFAULT 'friends'
    CHECK (badges_visibility IN ('public', 'friends', 'private')),
  achievements_visibility VARCHAR(20) NOT NULL DEFAULT 'friends'
    CHECK (achievements_visibility IN ('public', 'friends', 'private')),
  gym_visibility VARCHAR(20) NOT NULL DEFAULT 'friends'
    CHECK (gym_visibility IN ('public', 'friends', 'private')),
  online_status_visibility VARCHAR(20) NOT NULL DEFAULT 'friends'
    CHECK (online_status_visibility IN ('public', 'friends', 'private')),
  bio TEXT NOT NULL DEFAULT '',
  career_text TEXT NOT NULL DEFAULT '',
  favorite_muscle_group VARCHAR(80),
  favorite_machine_code VARCHAR(80),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_friend_privacy_settings_updated_at
  BEFORE UPDATE ON friend_privacy_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED'
    CHECK (status IN ('REQUESTED', 'ACCEPTED', 'REJECTED', 'CANCELLED')),
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT friend_requests_not_self CHECK (from_user_id <> to_user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_friend_requests_active_pair
  ON friend_requests (
    LEAST(from_user_id, to_user_id),
    GREATEST(from_user_id, to_user_id)
  )
  WHERE status = 'REQUESTED';

CREATE INDEX IF NOT EXISTS idx_friend_requests_to_status
  ON friend_requests (to_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_status
  ON friend_requests (from_user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_low_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_high_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'ACCEPTED'
    CHECK (status IN ('ACCEPTED')),
  pinned_by_low BOOLEAN NOT NULL DEFAULT FALSE,
  pinned_by_high BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT friendships_ordered CHECK (user_low_id < user_high_id),
  CONSTRAINT friendships_unique_pair UNIQUE (user_low_id, user_high_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_low ON friendships (user_low_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friendships_high ON friendships (user_high_id, created_at DESC);

CREATE TRIGGER trg_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT blocked_users_not_self CHECK (blocker_id <> blocked_id),
  CONSTRAINT blocked_users_unique UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker
  ON blocked_users (blocker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked
  ON blocked_users (blocked_id);

CREATE TABLE IF NOT EXISTS friend_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(40) NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  visibility VARCHAR(20) NOT NULL DEFAULT 'friends'
    CHECK (visibility IN ('public', 'friends', 'private')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_friend_activity_actor_created
  ON friend_activity_logs (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friend_activity_created
  ON friend_activity_logs (created_at DESC)
  WHERE visibility IN ('public', 'friends');

CREATE TABLE IF NOT EXISTS friend_referral_codes (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(32) NOT NULL UNIQUE,
  invite_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS friend_referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE SET NULL,
  code VARCHAR(32) NOT NULL,
  event_type VARCHAR(40) NOT NULL DEFAULT 'invite_click',
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_friend_referral_events_referrer
  ON friend_referral_events (referrer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS friend_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(40) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_friend_reports_status
  ON friend_reports (status, created_at DESC);
