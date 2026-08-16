-- Abuse prevention: stock limits on policies, new feature seeds, abuse_events.
-- Extends existing usage_policies / user_usage_* (no parallel usage_daily table).

ALTER TABLE usage_policies
  ADD COLUMN IF NOT EXISTS free_stock_limit INT NULL
    CHECK (free_stock_limit IS NULL OR free_stock_limit >= 0),
  ADD COLUMN IF NOT EXISTS premium_stock_limit INT NULL
    CHECK (premium_stock_limit IS NULL OR premium_stock_limit >= 0);

-- Allow new category for recommendation / upload policies
ALTER TABLE usage_policies DROP CONSTRAINT IF EXISTS usage_policies_category_check;
ALTER TABLE usage_policies
  ADD CONSTRAINT usage_policies_category_check
  CHECK (category IN (
    'exercise', 'template', 'timer', 'voice', 'insight', 'lab', 'auth', 'share',
    'recommend', 'upload', 'other'
  ));

CREATE TABLE IF NOT EXISTS abuse_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_hash VARCHAR(64) NULL,
  endpoint VARCHAR(240) NOT NULL DEFAULT '',
  event_type VARCHAR(64) NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'MEDIUM'
    CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  request_count INT NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abuse_events_created
  ON abuse_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abuse_events_user_time
  ON abuse_events (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_abuse_events_type_time
  ON abuse_events (event_type, created_at DESC);

-- Seed / upsert abuse-critical policies (FREE caps; PREMIUM unlimited stock/daily by default)
INSERT INTO usage_policies (
  feature_code, feature_name, description, category,
  free_allowed, free_daily_limit, free_monthly_limit, free_stock_limit,
  premium_allowed, premium_daily_limit, premium_monthly_limit, premium_stock_limit,
  limits_enforced, is_active
) VALUES
  (
    'recommendation', '기구 추천', '추천 API 호출', 'recommend',
    TRUE, 30, NULL, NULL,
    TRUE, NULL, NULL, NULL,
    TRUE, TRUE
  ),
  (
    'image_upload', '이미지 업로드', '사용자 이미지/파일 업로드', 'upload',
    TRUE, 10, NULL, NULL,
    TRUE, NULL, NULL, NULL,
    TRUE, TRUE
  )
ON CONFLICT (feature_code) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  free_daily_limit = COALESCE(usage_policies.free_daily_limit, EXCLUDED.free_daily_limit),
  free_stock_limit = COALESCE(usage_policies.free_stock_limit, EXCLUDED.free_stock_limit),
  limits_enforced = TRUE,
  is_active = TRUE,
  updated_at = NOW();

UPDATE usage_policies SET
  free_daily_limit = COALESCE(free_daily_limit, 10),
  free_stock_limit = COALESCE(free_stock_limit, 30),
  limits_enforced = TRUE,
  updated_at = NOW()
WHERE feature_code = 'exercise_card_create';

UPDATE usage_policies SET
  free_daily_limit = COALESCE(free_daily_limit, 100),
  limits_enforced = TRUE,
  updated_at = NOW()
WHERE feature_code = 'exercise_record_save';

UPDATE usage_policies SET
  free_stock_limit = COALESCE(free_stock_limit, 20),
  free_daily_limit = COALESCE(free_daily_limit, 20),
  limits_enforced = TRUE,
  updated_at = NOW()
WHERE feature_code = 'template_create';

-- Keep non-critical features trackable but not blocking normal athletes
UPDATE usage_policies SET
  limits_enforced = FALSE
WHERE feature_code IN (
  'exercise_card_update',
  'exercise_record_delete',
  'template_use',
  'template_download',
  'template_save',
  'timer_start',
  'timer_end',
  'rest_timer',
  'lap_record',
  'voice_count',
  'voice_count_complete',
  'login',
  'insight_lifter_dna',
  'insight_growth_timeline',
  'insight_growth_analysis',
  'insight_lifted_weight',
  'insight_achievements',
  'insight_share',
  'lab_live_dashboard',
  'lab_open',
  'lab_share'
);

COMMENT ON TABLE abuse_events IS 'Operational abuse signals (rate/quota). No long-term raw IP storage.';
COMMENT ON COLUMN usage_policies.free_stock_limit IS 'Max concurrent owned items for FREE (cards/templates). NULL = unlimited.';
