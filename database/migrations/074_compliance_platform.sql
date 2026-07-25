-- Compliance platform: consents metadata, legal docs by region, support, audit, login events

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS location_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS push_service_opt_in BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE user_consents
  ADD COLUMN IF NOT EXISTS region_code VARCHAR(16) NOT NULL DEFAULT 'KR';

ALTER TABLE user_consents
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(64);

ALTER TABLE user_consents
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

ALTER TABLE user_consents
  ADD COLUMN IF NOT EXISTS source VARCHAR(40) NOT NULL DEFAULT 'app';

CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_code VARCHAR(16) NOT NULL DEFAULT 'KR',
  doc_type VARCHAR(40) NOT NULL,
  version VARCHAR(32) NOT NULL,
  title VARCHAR(200) NOT NULL,
  summary TEXT,
  body_md TEXT,
  effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (region_code, doc_type, version)
);

CREATE INDEX IF NOT EXISTS idx_legal_documents_active
  ON legal_documents (region_code, doc_type, is_active, effective_at DESC);

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(40) NOT NULL DEFAULT 'general',
  subject VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  assigned_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user
  ON support_tickets (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status
  ON support_tickets (status, created_at DESC);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_role VARCHAR(20) NOT NULL DEFAULT 'user',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket
  ON support_ticket_messages (ticket_id, created_at ASC);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_role VARCHAR(40),
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(40),
  target_id VARCHAR(80),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address VARCHAR(64),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created
  ON admin_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor
  ON admin_audit_logs (actor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS auth_login_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255),
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(80),
  ip_address VARCHAR(64),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_login_events_user
  ON auth_login_events (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_sanctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sanction_type VARCHAR(40) NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sanctions_user
  ON user_sanctions (user_id, is_active);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'owner_applications'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'owner_applications'
      AND column_name = 'business_registration_number'
  ) THEN
    ALTER TABLE owner_applications
      ADD COLUMN business_registration_number VARCHAR(40);
  END IF;
END $$;

-- Seed KR legal document catalog (summaries; full copy remains in i18n pages)
INSERT INTO legal_documents (region_code, doc_type, version, title, summary, is_active)
VALUES
  ('KR', 'terms', '2026-07-25', '이용약관', '서비스 성격·계정·UGC·면책', TRUE),
  ('KR', 'privacy', '2026-07-25', '개인정보처리방침', '수집·이용·보관·권리·아동', TRUE),
  ('KR', 'location', '2026-07-25', '위치정보 이용약관', 'GPS·시군구 처리·거부 시 대체', TRUE),
  ('KR', 'marketing', '2026-07-25', '마케팅 수신 동의', '이벤트·프로모션 알림(선택)', TRUE),
  ('KR', 'commerce', '2026-07-25', '전자상거래·환불 정책', '데모결제·청약철회·환불 고지', TRUE),
  ('KR', 'community', '2026-07-25', '커뮤니티·UGC 정책', '신고·차단·삭제·금지행위', TRUE),
  ('KR', 'copyright', '2026-07-25', '저작권·콘텐츠 정책', '이미지·유튜브·침해 신고', TRUE),
  ('KR', 'ai_disclaimer', '2026-07-25', 'AI·건강 면책', '참고용·의료 비해당·오답 가능', TRUE),
  ('EU', 'privacy', '2026-07-25', 'Privacy Policy (EU stub)', 'GDPR-ready structure; full text TBD', TRUE),
  ('US-CA', 'privacy', '2026-07-25', 'Privacy Policy (CCPA stub)', 'CCPA-ready structure; full text TBD', TRUE)
ON CONFLICT (region_code, doc_type, version) DO NOTHING;

COMMENT ON TABLE legal_documents IS 'Region-scoped legal document versions for global expansion';
COMMENT ON TABLE support_tickets IS 'Member inquiry / complaint channel';
COMMENT ON TABLE admin_audit_logs IS 'Append-only admin action audit trail';
COMMENT ON TABLE auth_login_events IS 'Login success/failure audit';
COMMENT ON COLUMN users.location_opt_in IS 'Opt-in for storing/using precise location (GPS)';
COMMENT ON COLUMN users.push_service_opt_in IS 'Opt-in for service (non-marketing) push notifications';
