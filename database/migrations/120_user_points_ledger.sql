-- User points ledger: balances, append-only transactions, admin-managed policies.

CREATE TABLE IF NOT EXISTS point_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_code VARCHAR(80) NOT NULL UNIQUE,
  action_name VARCHAR(160) NOT NULL,
  points INT NOT NULL DEFAULT 0 CHECK (points >= 0),
  daily_limit INT NULL CHECK (daily_limit IS NULL OR daily_limit >= 0),
  user_limit INT NULL CHECK (user_limit IS NULL OR user_limit >= 0),
  cooldown_seconds INT NOT NULL DEFAULT 0 CHECK (cooldown_seconds >= 0),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  start_at TIMESTAMPTZ NULL,
  end_at TIMESTAMPTZ NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_policies_enabled
  ON point_policies (enabled, action_code);

CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned INT NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0),
  lifetime_spent INT NOT NULL DEFAULT 0 CHECK (lifetime_spent >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(32) NOT NULL
    CHECK (transaction_type IN (
      'EARN', 'SPEND', 'ADMIN_GRANT', 'ADMIN_DEDUCT', 'EXPIRE', 'REFUND'
    )),
  action_code VARCHAR(80) NULL,
  points INT NOT NULL CHECK (points <> 0),
  balance_after INT NOT NULL CHECK (balance_after >= 0),
  reference_type VARCHAR(80) NULL,
  reference_id VARCHAR(120) NULL,
  description TEXT NOT NULL DEFAULT '',
  idempotency_key VARCHAR(200) NULL,
  expires_at TIMESTAMPTZ NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_point_transactions_idempotency
  ON point_transactions (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_point_transactions_user_time
  ON point_transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_point_transactions_action_time
  ON point_transactions (user_id, action_code, created_at DESC)
  WHERE action_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_point_transactions_ref
  ON point_transactions (user_id, reference_type, reference_id)
  WHERE reference_id IS NOT NULL;

-- Seed default policies (admin-editable). Limits prevent abuse; points are starter defaults.
INSERT INTO point_policies (
  action_code, action_name, points, daily_limit, user_limit, cooldown_seconds, enabled, description
) VALUES
  ('signup_complete', '회원가입 완료', 100, 1, 1, 0, TRUE, 'OAuth 가입 완료 시 1회'),
  ('first_login', '최초 로그인', 50, 1, 1, 0, TRUE, '첫 로그인 1회'),
  ('profile_complete', '프로필 설정 완료', 30, 1, 1, 0, TRUE, '필수 신체정보 최초 저장'),
  ('workout_card_create', '운동카드 생성', 10, 20, NULL, 5, TRUE, '운동카드 생성'),
  ('workout_log_save', '운동 기록 저장', 10, 40, NULL, 3, TRUE, '운동기록 upsert'),
  ('workout_complete', '운동 완료', 20, 10, NULL, 5, TRUE, '세트 완료/카드 완료'),
  ('workout_streak', '운동기록 연속 달성', 30, 1, NULL, 0, TRUE, '연속 운동일 갱신 시 일 1회'),
  ('daily_workout_done', '하루 운동 완료', 25, 1, NULL, 0, TRUE, '해당일 첫 완료'),
  ('machine_search', '머신 검색', 2, 10, NULL, 10, TRUE, '검색 API'),
  ('machine_detail_view', '머신 상세 조회', 2, 30, NULL, 5, TRUE, '머신 상세 조회(기기당 일 1회 키)'),
  ('favorite_add', '즐겨찾기 등록', 5, 20, NULL, 3, TRUE, '즐겨찾기 추가'),
  ('template_create', '운동 템플릿 생성', 15, 10, NULL, 5, TRUE, '개인 템플릿 생성'),
  ('template_share', '템플릿 공유', 50, 5, NULL, 30, TRUE, '템플릿 허브 게시'),
  ('template_download', '템플릿 다운로드', 10, 20, NULL, 10, TRUE, '타인 템플릿 다운로드'),
  ('template_use', '템플릿 사용', 10, 20, NULL, 5, TRUE, '템플릿 적용'),
  ('community_post', '커뮤니티 게시글 작성', 20, 10, NULL, 30, TRUE, '자유게시판 글 작성'),
  ('community_comment', '커뮤니티 댓글 작성', 5, 30, NULL, 10, TRUE, '댓글 작성'),
  ('community_like', '커뮤니티 좋아요', 2, 50, NULL, 2, TRUE, '좋아요(신규만)')
ON CONFLICT (action_code) DO NOTHING;
