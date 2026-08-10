-- Admin-managed data retention / deletion policies.
-- Legal periods are NOT hardcoded as immutable law — admins register applied policy.
-- Actual purge jobs fall back to shared DATA_RETENTION defaults when a policy is inactive.

CREATE TABLE IF NOT EXISTS retention_consent_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(64) NOT NULL UNIQUE,
  name_ko VARCHAR(120) NOT NULL,
  name_en VARCHAR(120) NOT NULL DEFAULT '',
  consent_kind VARCHAR(40) NOT NULL DEFAULT 'service'
    CHECK (consent_kind IN ('terms', 'privacy', 'marketing', 'location', 'payment', 'community', 'service', 'other')),
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  withdrawable BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  data_category VARCHAR(40) NOT NULL
    CHECK (data_category IN ('personal', 'payment', 'service', 'log', 'community', 'workout', 'auth', 'other')),
  table_names TEXT[] NOT NULL DEFAULT '{}',
  retention_reason VARCHAR(40) NOT NULL DEFAULT 'operations'
    CHECK (retention_reason IN ('legal', 'contract', 'consent', 'operations', 'security', 'dispute', 'other')),
  is_legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
  legal_basis_note TEXT NOT NULL DEFAULT '',
  related_policy_doc VARCHAR(120) NOT NULL DEFAULT '',
  related_terms_doc VARCHAR(120) NOT NULL DEFAULT '',
  consent_catalog_id UUID REFERENCES retention_consent_catalog(id) ON DELETE SET NULL,
  period_value INT NOT NULL DEFAULT 30 CHECK (period_value >= 0 AND period_value <= 36500),
  period_unit VARCHAR(10) NOT NULL DEFAULT 'day'
    CHECK (period_unit IN ('day', 'month', 'year')),
  start_basis VARCHAR(40) NOT NULL DEFAULT 'created_at'
    CHECK (start_basis IN (
      'signup_at', 'withdrawn_at', 'created_at', 'updated_at',
      'transaction_at', 'paid_at', 'contract_end_at', 'last_used_at', 'admin_set', 'other'
    )),
  auto_delete BOOLEAN NOT NULL DEFAULT TRUE,
  deletion_method VARCHAR(20) NOT NULL DEFAULT 'hard_delete'
    CHECK (deletion_method IN ('hard_delete', 'anonymize', 'soft_delete', 'archive')),
  retry_limit INT NOT NULL DEFAULT 3 CHECK (retry_limit >= 0 AND retry_limit <= 20),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  current_version INT NOT NULL DEFAULT 1,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retention_policies_category
  ON retention_policies (data_category, is_active);

CREATE TABLE IF NOT EXISTS retention_policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES retention_policies(id) ON DELETE CASCADE,
  version INT NOT NULL,
  snapshot JSONB NOT NULL,
  change_reason TEXT NOT NULL DEFAULT '',
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (policy_id, version)
);

CREATE TABLE IF NOT EXISTS data_retention_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES retention_policies(id) ON DELETE RESTRICT,
  policy_version INT NOT NULL DEFAULT 1,
  subject_type VARCHAR(40) NOT NULL DEFAULT 'user'
    CHECK (subject_type IN ('user', 'row', 'job', 'other')),
  subject_id VARCHAR(80) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  retention_start_at TIMESTAMPTZ NOT NULL,
  scheduled_deletion_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'RETENTION'
    CHECK (status IN (
      'ACTIVE', 'RETENTION', 'DELETE_SCHEDULED', 'DELETE_PENDING',
      'DELETE_PROCESSING', 'DELETE_COMPLETED', 'DELETE_FAILED',
      'ANONYMIZED', 'EXEMPTED', 'HOLD'
    )),
  hold BOOLEAN NOT NULL DEFAULT FALSE,
  hold_reason TEXT NOT NULL DEFAULT '',
  hold_until TIMESTAMPTZ,
  hold_by UUID REFERENCES users(id) ON DELETE SET NULL,
  last_error TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (policy_id, subject_type, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_data_retention_records_schedule
  ON data_retention_records (scheduled_deletion_at, status)
  WHERE status IN ('RETENTION', 'DELETE_SCHEDULED', 'DELETE_PENDING', 'DELETE_FAILED');

CREATE INDEX IF NOT EXISTS idx_data_retention_records_user
  ON data_retention_records (user_id)
  WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS deletion_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID REFERENCES data_retention_records(id) ON DELETE SET NULL,
  policy_id UUID REFERENCES retention_policies(id) ON DELETE SET NULL,
  job_batch_id UUID,
  action VARCHAR(40) NOT NULL DEFAULT 'auto_delete',
  success BOOLEAN NOT NULL,
  rows_affected INT NOT NULL DEFAULT 0,
  error_message TEXT,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deletion_execution_logs_created
  ON deletion_execution_logs (created_at DESC);

-- Consent catalog seed (policy-linked labels; user_consents remains source of truth for user facts)
INSERT INTO retention_consent_catalog (code, name_ko, name_en, consent_kind, is_required, withdrawable, description)
VALUES
  ('terms', '서비스 이용약관', 'Terms of service', 'terms', TRUE, FALSE, 'Required terms acceptance'),
  ('privacy', '개인정보 수집·이용 동의', 'Privacy collection/use', 'privacy', TRUE, FALSE, 'Required privacy consent'),
  ('marketing', '마케팅 정보 수신 동의', 'Marketing opt-in', 'marketing', FALSE, TRUE, 'Optional marketing'),
  ('location', '위치정보 이용 동의', 'Location use', 'location', FALSE, TRUE, 'Optional location'),
  ('push_service', '푸시 알림 수신 동의', 'Push notifications', 'service', FALSE, TRUE, 'Optional push'),
  ('payment', '결제 관련 동의', 'Payment-related', 'payment', FALSE, FALSE, 'Checkout / billing notices'),
  ('community', '커뮤니티 이용 관련 동의', 'Community use', 'community', FALSE, TRUE, 'UGC rules acknowledgment')
ON CONFLICT (code) DO NOTHING;

-- Policy seeds — periods are operational defaults, editable by admins [법률 검토 필요]
INSERT INTO retention_policies (
  code, name, description, data_category, table_names, retention_reason,
  is_legal_hold, legal_basis_note, related_policy_doc, consent_catalog_id,
  period_value, period_unit, start_basis, auto_delete, deletion_method
)
SELECT v.code, v.name, v.description, v.data_category, v.table_names::text[], v.retention_reason,
       v.is_legal_hold, v.legal_basis_note, v.related_policy_doc, c.id,
       v.period_value, v.period_unit, v.start_basis, v.auto_delete, v.deletion_method
FROM (VALUES
  ('user_account_pii', '회원 기본·프로필 개인정보', '이메일·표시명·신체정보 등 (탈퇴 시 즉시 익명화)', 'personal',
   ARRAY['users'], 'operations', FALSE, '탈퇴 즉시 익명화; 계정 행은 운영/분쟁 대응용 유지 가능', 'privacy',
   'privacy', 30, 'day', 'withdrawn_at', TRUE, 'anonymize'),
  ('social_auth_live', '소셜 로그인 live 링크', 'auth_providers — 탈퇴 시 즉시 detach', 'auth',
   ARRAY['auth_providers'], 'security', FALSE, '재가입을 위해 live 링크 즉시 해제; 이력은 withdrawals에 보관', 'privacy',
   'privacy', 0, 'day', 'withdrawn_at', TRUE, 'hard_delete'),
  ('social_auth_withdrawals', '소셜 인증 탈퇴 이력', 'auth_provider_withdrawals 감사 이력', 'auth',
   ARRAY['auth_provider_withdrawals'], 'dispute', FALSE, '재가입 판별·감사. 보존기간은 운영 정책으로 관리', 'privacy',
   'privacy', 3, 'year', 'withdrawn_at', FALSE, 'archive'),
  ('trial_identity_ledger', '무료체험 악용방지 원장', 'oauth/email identity keys', 'auth',
   ARRAY['trial_identity_ledger'], 'operations', FALSE, '체험 중복 방지 목적의 최소 식별 키', 'privacy',
   NULL, 5, 'year', 'created_at', FALSE, 'archive'),
  ('workout_logs', '운동 기록', 'workout_logs', 'workout',
   ARRAY['workout_logs'], 'operations', FALSE, '탈퇴 후 grace 뒤 hard purge (운영 기본)', 'privacy',
   'privacy', 30, 'day', 'withdrawn_at', TRUE, 'hard_delete'),
  ('workout_cards', '운동 카드', 'workout_cards', 'workout',
   ARRAY['workout_cards'], 'operations', FALSE, '', 'privacy', 'privacy', 30, 'day', 'withdrawn_at', TRUE, 'hard_delete'),
  ('favorites', '즐겨찾기', 'favorites', 'workout',
   ARRAY['favorites'], 'operations', FALSE, '', 'privacy', 'privacy', 30, 'day', 'withdrawn_at', TRUE, 'hard_delete'),
  ('recent_history', '최근 이용 기록', 'recent_history', 'workout',
   ARRAY['recent_history'], 'operations', FALSE, '', 'privacy', 'privacy', 30, 'day', 'withdrawn_at', TRUE, 'hard_delete'),
  ('user_machine_preferences', '기구 개인화 설정', 'user_machine_preferences', 'service',
   ARRAY['user_machine_preferences'], 'operations', FALSE, '', 'privacy', 'privacy', 30, 'day', 'withdrawn_at', TRUE, 'hard_delete'),
  ('community_posts', '커뮤니티 게시글', 'posts / photo_posts', 'community',
   ARRAY['posts','photo_posts'], 'operations', FALSE, '탈퇴 grace 후 hard purge; 그 전 작성자명 익명 표시', 'privacy',
   'community', 30, 'day', 'withdrawn_at', TRUE, 'hard_delete'),
  ('community_comments', '커뮤니티 댓글', 'comments', 'community',
   ARRAY['comments','photo_post_comments'], 'operations', FALSE, '', 'privacy', 'community', 30, 'day', 'withdrawn_at', TRUE, 'hard_delete'),
  ('friends_graph', '친구 관계', 'friendships / requests', 'service',
   ARRAY['friendships','friend_requests'], 'operations', FALSE, '', 'privacy', 'privacy', 30, 'day', 'withdrawn_at', TRUE, 'hard_delete'),
  ('user_locations_gps', '위치 GPS 좌표', 'user_locations.latitude/longitude', 'personal',
   ARRAY['user_locations'], 'consent', FALSE, '좌표만 삭제, 시군구 유지 가능', 'location-policy',
   'location', 30, 'day', 'created_at', TRUE, 'anonymize'),
  ('user_consents', '동의 이력', 'user_consents 사실·버전 (IP/UA는 별도 스크럽)', 'personal',
   ARRAY['user_consents'], 'legal', TRUE, '동의 사실 보존 가능성은 법률·방침 검토 대상 — 기간은 관리자 등록값', 'privacy',
   'privacy', 5, 'year', 'created_at', FALSE, 'archive'),
  ('consent_ip_meta', '동의 IP/UA 메타', 'user_consents.ip_address/user_agent', 'log',
   ARRAY['user_consents'], 'security', FALSE, '동의 사실은 유지하고 메타만 스크럽', 'privacy',
   'privacy', 365, 'day', 'created_at', TRUE, 'anonymize'),
  ('auth_login_events', '로그인 이벤트', 'auth_login_events', 'log',
   ARRAY['auth_login_events'], 'security', FALSE, '', 'privacy', 'privacy', 365, 'day', 'created_at', TRUE, 'hard_delete'),
  ('payment_history', '결제 거래 이력', 'payment_history', 'payment',
   ARRAY['payment_history'], 'legal', TRUE, '전자상거래 등 관련 보존 가능 — 기간은 관리자 등록·법률 검토', 'commerce',
   'payment', 5, 'year', 'paid_at', FALSE, 'archive'),
  ('subscriptions', '구독 정보', 'subscriptions', 'payment',
   ARRAY['subscriptions'], 'contract', TRUE, '구독/청구 분쟁 대응', 'commerce',
   'payment', 5, 'year', 'created_at', FALSE, 'archive'),
  ('billing_logs', '빌링 로그', 'billing_logs / webhook_events', 'payment',
   ARRAY['billing_logs','webhook_events'], 'operations', FALSE, '', 'commerce',
   'payment', 3, 'year', 'created_at', FALSE, 'archive'),
  ('admin_audit_logs', '관리자 감사 로그', 'admin_audit_logs', 'log',
   ARRAY['admin_audit_logs'], 'security', FALSE, '운영 감사', '',
   NULL, 3, 'year', 'created_at', FALSE, 'archive'),
  ('notifications', '알림', 'notifications', 'service',
   ARRAY['notifications'], 'operations', FALSE, '', 'privacy', 'privacy', 30, 'day', 'withdrawn_at', TRUE, 'hard_delete'),
  ('deactivated_account_purge', '탈퇴 계정 비법정 일괄 purge', 'privacyRetention hard purge batch', 'service',
   ARRAY['workout_logs','favorites','posts'], 'operations', FALSE,
   '탈퇴 후 non-legal-hold 데이터 hard purge 운영 기본값', 'privacy',
   'privacy', 30, 'day', 'withdrawn_at', TRUE, 'hard_delete'),
  ('refresh_tokens', '세션 리프레시 토큰', 'refresh_tokens', 'auth',
   ARRAY['refresh_tokens'], 'security', FALSE, '탈퇴 시 즉시 삭제', 'privacy',
   'privacy', 0, 'day', 'withdrawn_at', TRUE, 'hard_delete'),
  ('backup_files', '시스템/회원 백업 파일', 'backup storage objects', 'other',
   ARRAY['backup_logs'], 'operations', FALSE, '백업 ZIP TTL은 backup_settings와 별도 조율', '',
   NULL, 90, 'day', 'created_at', TRUE, 'hard_delete')
) AS v(code, name, description, data_category, table_names, retention_reason, is_legal_hold, legal_basis_note, related_policy_doc, consent_code, period_value, period_unit, start_basis, auto_delete, deletion_method)
LEFT JOIN retention_consent_catalog c ON c.code = v.consent_code
ON CONFLICT (code) DO NOTHING;

-- Initial version snapshots for seeded policies
INSERT INTO retention_policy_versions (policy_id, version, snapshot, change_reason)
SELECT p.id, p.current_version,
  to_jsonb(p) - 'id' - 'created_at' - 'updated_at',
  'seed'
FROM retention_policies p
WHERE NOT EXISTS (
  SELECT 1 FROM retention_policy_versions v WHERE v.policy_id = p.id AND v.version = p.current_version
);

COMMENT ON TABLE retention_policies IS
  'Admin-editable retention/deletion policies. Periods are applied operational policy, not hard-coded law.';
COMMENT ON TABLE data_retention_records IS
  'Per-subject retention schedule (e.g. withdrawn user under a policy).';
