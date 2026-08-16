-- Unified ad placement system (policy engine + frequency caps).
-- Existing banners / banner_slots / banner_events remain the CMS creative source.

CREATE TABLE IF NOT EXISTS ad_feature_flags (
  flag_key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ad_feature_flags IS 'Kill-switches for ad types / global ads';

CREATE TABLE IF NOT EXISTS ad_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  ad_type TEXT NOT NULL
    CHECK (ad_type IN ('inline_cms', 'inline', 'sticky', 'interstitial', 'rewarded', 'native')),
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  priority INT NOT NULL DEFAULT 100,
  maps_to_banner_slot_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_ad_placements_updated_at ON ad_placements;
CREATE TRIGGER trg_ad_placements_updated_at
  BEFORE UPDATE ON ad_placements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_ad_placements_type_enabled
  ON ad_placements (ad_type, enabled, priority ASC);

COMMENT ON TABLE ad_placements IS 'Inventory of ad placements; inline_cms may map to banner_slots.slot_key';

CREATE TABLE IF NOT EXISTS ad_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id UUID NOT NULL REFERENCES ad_placements(id) ON DELETE CASCADE,
  event_type TEXT,
  min_interval_seconds INT NOT NULL DEFAULT 0 CHECK (min_interval_seconds >= 0),
  session_limit INT,
  daily_limit INT,
  event_interval_count INT,
  anonymous_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  free_user_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  paid_user_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  admin_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  require_marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (placement_id, event_type)
);

DROP TRIGGER IF EXISTS trg_ad_policies_updated_at ON ad_policies;
CREATE TRIGGER trg_ad_policies_updated_at
  BEFORE UPDATE ON ad_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_ad_policies_placement
  ON ad_policies (placement_id, enabled);

COMMENT ON TABLE ad_policies IS 'Per-placement frequency + audience rules for the ad policy engine';

CREATE TABLE IF NOT EXISTS ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  placement_key TEXT NOT NULL,
  ad_type TEXT NOT NULL,
  event_type TEXT,
  provider TEXT NOT NULL DEFAULT 'mock',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_impressions_user_created
  ON ad_impressions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ad_impressions_session_created
  ON ad_impressions (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ad_impressions_placement_created
  ON ad_impressions (placement_key, created_at DESC);

CREATE TABLE IF NOT EXISTS ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  placement_key TEXT NOT NULL,
  ad_type TEXT NOT NULL,
  event_type TEXT,
  provider TEXT NOT NULL DEFAULT 'mock',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_clicks_placement_created
  ON ad_clicks (placement_key, created_at DESC);

CREATE TABLE IF NOT EXISTS ad_reward_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  placement_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('complete', 'fail', 'claim_stub')),
  provider TEXT NOT NULL DEFAULT 'mock',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_reward_events_user_created
  ON ad_reward_events (user_id, created_at DESC);

-- Feature flags (1차: CMS inline ON, other types OFF)
INSERT INTO ad_feature_flags (flag_key, enabled) VALUES
  ('ADS_ENABLED', TRUE),
  ('INLINE_CMS_ENABLED', TRUE),
  ('INLINE_ENABLED', FALSE),
  ('INTERSTITIAL_ENABLED', FALSE),
  ('STICKY_BANNER_ENABLED', FALSE),
  ('REWARDED_AD_ENABLED', FALSE),
  ('NATIVE_AD_ENABLED', FALSE),
  ('PAGE_TRANSITION_AD_ENABLED', FALSE)
ON CONFLICT (flag_key) DO NOTHING;

-- Placements
INSERT INTO ad_placements (placement_key, name, description, ad_type, enabled, priority, maps_to_banner_slot_key)
VALUES
  ('MAIN_BOTTOM', '홈 하단 (CMS)', '홈 화면 콘텐츠 하단', 'inline_cms', TRUE, 100, 'MAIN_BOTTOM'),
  ('MY_BOTTOM', '마이 하단 (CMS)', '마이페이지 하단', 'inline_cms', TRUE, 100, 'MY_BOTTOM'),
  ('WORKOUT_BOTTOM', '기록 하단 (CMS)', '운동기록 페이지 하단', 'inline_cms', TRUE, 100, 'WORKOUT_BOTTOM'),
  ('MACHINE_BOTTOM', '기구상세 하단 (CMS)', '기구 상세 하단', 'inline_cms', TRUE, 100, 'MACHINE_BOTTOM'),
  ('COMMUNITY_BOTTOM', '커뮤니티 하단 (CMS)', '커뮤니티 허브 하단', 'inline_cms', TRUE, 100, 'COMMUNITY_BOTTOM'),
  ('HOME_MIDDLE', '홈 중간', '홈 도구 섹션 아래', 'inline', FALSE, 200, NULL),
  ('RECOMMENDATION_BOTTOM', '추천결과 하단', '추천 결과 페이지 하단', 'inline', TRUE, 100, NULL),
  ('FORTUNE_BOTTOM', '운세 하단', '헬창운세 상세 하단', 'inline', TRUE, 100, NULL),
  ('SEARCH_NATIVE_MID', '검색 목록 중간', '기구 검색 리스트 네이티브', 'native', FALSE, 100, NULL),
  ('GLOBAL_STICKY_BOTTOM', '전역 하단 고정', '앱 셸 sticky 배너', 'sticky', FALSE, 50, NULL),
  ('PAGE_TRANSITION', '페이지 이동', 'N회 이동 후 전면 광고', 'interstitial', FALSE, 50, NULL),
  ('WORKOUT_COMPLETE', '운동 완료', '운동 완료 리포트 후 전면', 'interstitial', FALSE, 50, NULL),
  ('LIMIT_REACHED', '한도 도달 리워드', '무료 한도 도달 시 rewarded', 'rewarded', FALSE, 50, NULL)
ON CONFLICT (placement_key) DO NOTHING;

-- Policies (one default row per placement; event-specific where needed)
INSERT INTO ad_policies (
  placement_id, event_type, min_interval_seconds, session_limit, daily_limit, event_interval_count,
  anonymous_enabled, free_user_enabled, paid_user_enabled, admin_enabled,
  require_marketing_opt_in, enabled
)
SELECT p.id, NULL, 0, NULL, NULL, NULL,
  FALSE, TRUE, FALSE, FALSE,
  TRUE, TRUE
FROM ad_placements p
WHERE p.ad_type = 'inline_cms'
  AND NOT EXISTS (SELECT 1 FROM ad_policies pol WHERE pol.placement_id = p.id AND pol.event_type IS NULL);

INSERT INTO ad_policies (
  placement_id, event_type, min_interval_seconds, session_limit, daily_limit, event_interval_count,
  anonymous_enabled, free_user_enabled, paid_user_enabled, admin_enabled,
  require_marketing_opt_in, enabled
)
SELECT p.id, NULL, 60, 20, 40, NULL,
  FALSE, TRUE, FALSE, FALSE,
  FALSE, TRUE
FROM ad_placements p
WHERE p.placement_key IN ('HOME_MIDDLE', 'RECOMMENDATION_BOTTOM', 'FORTUNE_BOTTOM')
  AND NOT EXISTS (SELECT 1 FROM ad_policies pol WHERE pol.placement_id = p.id AND pol.event_type IS NULL);

INSERT INTO ad_policies (
  placement_id, event_type, min_interval_seconds, session_limit, daily_limit, event_interval_count,
  anonymous_enabled, free_user_enabled, paid_user_enabled, admin_enabled,
  require_marketing_opt_in, enabled
)
SELECT p.id, 'PAGE_TRANSITION', 300, 3, 10, 5,
  TRUE, TRUE, FALSE, FALSE,
  FALSE, TRUE
FROM ad_placements p
WHERE p.placement_key = 'PAGE_TRANSITION'
  AND NOT EXISTS (
    SELECT 1 FROM ad_policies pol
    WHERE pol.placement_id = p.id AND pol.event_type = 'PAGE_TRANSITION'
  );

INSERT INTO ad_policies (
  placement_id, event_type, min_interval_seconds, session_limit, daily_limit, event_interval_count,
  anonymous_enabled, free_user_enabled, paid_user_enabled, admin_enabled,
  require_marketing_opt_in, enabled
)
SELECT p.id, 'WORKOUT_COMPLETE', 300, 3, 10, 3,
  FALSE, TRUE, FALSE, FALSE,
  FALSE, TRUE
FROM ad_placements p
WHERE p.placement_key = 'WORKOUT_COMPLETE'
  AND NOT EXISTS (
    SELECT 1 FROM ad_policies pol
    WHERE pol.placement_id = p.id AND pol.event_type = 'WORKOUT_COMPLETE'
  );

INSERT INTO ad_policies (
  placement_id, event_type, min_interval_seconds, session_limit, daily_limit, event_interval_count,
  anonymous_enabled, free_user_enabled, paid_user_enabled, admin_enabled,
  require_marketing_opt_in, enabled
)
SELECT p.id, NULL, 0, NULL, 50, NULL,
  TRUE, TRUE, FALSE, FALSE,
  FALSE, TRUE
FROM ad_placements p
WHERE p.placement_key = 'GLOBAL_STICKY_BOTTOM'
  AND NOT EXISTS (SELECT 1 FROM ad_policies pol WHERE pol.placement_id = p.id AND pol.event_type IS NULL);

INSERT INTO ad_policies (
  placement_id, event_type, min_interval_seconds, session_limit, daily_limit, event_interval_count,
  anonymous_enabled, free_user_enabled, paid_user_enabled, admin_enabled,
  require_marketing_opt_in, enabled
)
SELECT p.id, NULL, 120, 30, 60, NULL,
  FALSE, TRUE, FALSE, FALSE,
  FALSE, TRUE
FROM ad_placements p
WHERE p.placement_key = 'SEARCH_NATIVE_MID'
  AND NOT EXISTS (SELECT 1 FROM ad_policies pol WHERE pol.placement_id = p.id AND pol.event_type IS NULL);

INSERT INTO ad_policies (
  placement_id, event_type, min_interval_seconds, session_limit, daily_limit, event_interval_count,
  anonymous_enabled, free_user_enabled, paid_user_enabled, admin_enabled,
  require_marketing_opt_in, enabled
)
SELECT p.id, 'FREE_LIMIT_REACHED', 0, NULL, 20, NULL,
  FALSE, TRUE, FALSE, FALSE,
  FALSE, TRUE
FROM ad_placements p
WHERE p.placement_key = 'LIMIT_REACHED'
  AND NOT EXISTS (
    SELECT 1 FROM ad_policies pol
    WHERE pol.placement_id = p.id AND pol.event_type = 'FREE_LIMIT_REACHED'
  );

ALTER TABLE ad_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_reward_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    EXECUTE 'REVOKE ALL ON TABLE ad_feature_flags FROM anon, authenticated, PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE ad_placements FROM anon, authenticated, PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE ad_policies FROM anon, authenticated, PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE ad_impressions FROM anon, authenticated, PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE ad_clicks FROM anon, authenticated, PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE ad_reward_events FROM anon, authenticated, PUBLIC';
  EXCEPTION
    WHEN undefined_object THEN NULL;
  END;
END $$;
