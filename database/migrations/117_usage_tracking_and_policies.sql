-- User usage aggregates + admin-managed service policies (quotas).
-- Limits default OFF / unlimited so current free operation is unchanged.

CREATE TABLE IF NOT EXISTS usage_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_code VARCHAR(80) NOT NULL UNIQUE,
  feature_name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category VARCHAR(40) NOT NULL DEFAULT 'other'
    CHECK (category IN (
      'exercise', 'template', 'timer', 'voice', 'insight', 'lab', 'auth', 'share', 'other'
    )),
  free_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  free_daily_limit INT NULL CHECK (free_daily_limit IS NULL OR free_daily_limit >= 0),
  free_monthly_limit INT NULL CHECK (free_monthly_limit IS NULL OR free_monthly_limit >= 0),
  premium_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  premium_daily_limit INT NULL CHECK (premium_daily_limit IS NULL OR premium_daily_limit >= 0),
  premium_monthly_limit INT NULL CHECK (premium_monthly_limit IS NULL OR premium_monthly_limit >= 0),
  -- Master switch: when FALSE, Policy Service always allows (current production default).
  limits_enforced BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_policies_category
  ON usage_policies (category, is_active);

CREATE TABLE IF NOT EXISTS usage_policy_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES usage_policies(id) ON DELETE CASCADE,
  feature_code VARCHAR(80) NOT NULL,
  before_value JSONB NOT NULL,
  after_value JSONB NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_policy_history_policy_time
  ON usage_policy_history (policy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_policy_history_time
  ON usage_policy_history (created_at DESC);

CREATE TABLE IF NOT EXISTS user_usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  exercise_card_create_count INT NOT NULL DEFAULT 0,
  exercise_card_update_count INT NOT NULL DEFAULT 0,
  exercise_record_save_count INT NOT NULL DEFAULT 0,
  exercise_record_delete_count INT NOT NULL DEFAULT 0,
  template_create_count INT NOT NULL DEFAULT 0,
  template_use_count INT NOT NULL DEFAULT 0,
  template_download_count INT NOT NULL DEFAULT 0,
  template_save_count INT NOT NULL DEFAULT 0,
  timer_start_count INT NOT NULL DEFAULT 0,
  timer_end_count INT NOT NULL DEFAULT 0,
  rest_timer_count INT NOT NULL DEFAULT 0,
  lap_record_count INT NOT NULL DEFAULT 0,
  voice_count_count INT NOT NULL DEFAULT 0,
  voice_count_complete_count INT NOT NULL DEFAULT 0,
  login_count INT NOT NULL DEFAULT 0,
  api_request_count INT NOT NULL DEFAULT 0,
  -- Extensible counters (insight_*, lab_*, share_*, etc.)
  extras JSONB NOT NULL DEFAULT '{}'::jsonb,
  active_flag BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_user_usage_daily_date
  ON user_usage_daily (usage_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_usage_daily_active
  ON user_usage_daily (usage_date, active_flag)
  WHERE active_flag = TRUE;

CREATE TABLE IF NOT EXISTS user_usage_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_month CHAR(7) NOT NULL,
  exercise_card_create_count INT NOT NULL DEFAULT 0,
  exercise_card_update_count INT NOT NULL DEFAULT 0,
  exercise_record_save_count INT NOT NULL DEFAULT 0,
  exercise_record_delete_count INT NOT NULL DEFAULT 0,
  template_create_count INT NOT NULL DEFAULT 0,
  template_use_count INT NOT NULL DEFAULT 0,
  template_download_count INT NOT NULL DEFAULT 0,
  template_save_count INT NOT NULL DEFAULT 0,
  timer_start_count INT NOT NULL DEFAULT 0,
  timer_end_count INT NOT NULL DEFAULT 0,
  rest_timer_count INT NOT NULL DEFAULT 0,
  lap_record_count INT NOT NULL DEFAULT 0,
  voice_count_count INT NOT NULL DEFAULT 0,
  voice_count_complete_count INT NOT NULL DEFAULT 0,
  login_count INT NOT NULL DEFAULT 0,
  api_request_count INT NOT NULL DEFAULT 0,
  extras JSONB NOT NULL DEFAULT '{}'::jsonb,
  active_days INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, usage_month)
);

CREATE INDEX IF NOT EXISTS idx_user_usage_monthly_month
  ON user_usage_monthly (usage_month DESC);

DROP TRIGGER IF EXISTS trg_usage_policies_updated_at ON usage_policies;
CREATE TRIGGER trg_usage_policies_updated_at
  BEFORE UPDATE ON usage_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_usage_daily_updated_at ON user_usage_daily;
CREATE TRIGGER trg_user_usage_daily_updated_at
  BEFORE UPDATE ON user_usage_daily
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_usage_monthly_updated_at ON user_usage_monthly;
CREATE TRIGGER trg_user_usage_monthly_updated_at
  BEFORE UPDATE ON user_usage_monthly
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed: all major features free + premium unlimited, limits not enforced.
INSERT INTO usage_policies (
  feature_code, feature_name, description, category,
  free_allowed, free_daily_limit, free_monthly_limit,
  premium_allowed, premium_daily_limit, premium_monthly_limit,
  limits_enforced, is_active
) VALUES
  ('exercise_card_create', '운동카드 생성', '운동 카드 생성', 'exercise', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('exercise_card_update', '운동카드 수정', '운동 카드 수정', 'exercise', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('exercise_record_save', '운동기록 저장', '운동 기록 저장/업서트', 'exercise', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('exercise_record_delete', '운동기록 삭제', '운동 기록 삭제', 'exercise', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('template_create', '템플릿 생성', '개인/공유 템플릿 생성', 'template', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('template_use', '템플릿 사용', '템플릿 적용', 'template', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('template_download', '템플릿 다운로드', '공유 템플릿 다운로드', 'template', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('template_save', '템플릿 저장', '템플릿 저장', 'template', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('timer_start', '운동 타이머 시작', '세션 타이머 시작', 'timer', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('timer_end', '운동 타이머 종료', '세션 타이머 종료', 'timer', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('rest_timer', '휴식 타이머', '휴식 타이머 사용', 'timer', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('lap_record', '랩 기록', '세션 랩 기록', 'timer', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('voice_count', '음성카운트 실행', '음성카운트 시작', 'voice', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('voice_count_complete', '음성카운트 완료', '음성카운트 완료', 'voice', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('login', '로그인', '소셜/세션 로그인', 'auth', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('insight_lifter_dna', '인사이트: 리프터 DNA', '마이페이지 인사이트', 'insight', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('insight_growth_timeline', '인사이트: 성장 타임라인', '마이페이지 인사이트', 'insight', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('insight_growth_analysis', '인사이트: 성장 분석', '마이페이지 인사이트', 'insight', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('insight_lifted_weight', '인사이트: 들어올린 무게', '마이페이지 인사이트', 'insight', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('insight_achievements', '인사이트: 업적', '마이페이지 인사이트', 'insight', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('insight_share', '인사이트 공유', '인사이트 컨텐츠 공유', 'share', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('lab_live_dashboard', '실험실: 라이브 대시보드', '실험실 메뉴', 'lab', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('lab_open', '실험실 열기', '실험실 섹션/페이지', 'lab', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE),
  ('lab_share', '실험실 공유', '실험실 컨텐츠 공유', 'share', TRUE, NULL, NULL, TRUE, NULL, NULL, FALSE, TRUE)
ON CONFLICT (feature_code) DO NOTHING;
