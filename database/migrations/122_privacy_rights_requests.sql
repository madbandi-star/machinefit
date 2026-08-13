-- Privacy rights exercise (DSAR-style) requests + event opt-in + processing stop flag.
-- Separates formal rights requests from account withdrawal (회원탈퇴).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS event_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

-- Seed event_opt_in from marketing for existing rows (independent thereafter).
UPDATE users
SET event_opt_in = COALESCE(marketing_opt_in, FALSE)
WHERE event_opt_in IS DISTINCT FROM COALESCE(marketing_opt_in, FALSE);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS privacy_processing_suspended_at TIMESTAMPTZ NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS privacy_processing_suspend_note TEXT NULL;

COMMENT ON COLUMN users.event_opt_in IS 'Optional consent for event/promotion notifications (independent of marketing_opt_in).';
COMMENT ON COLUMN users.privacy_processing_suspended_at IS 'When set, optional personal-data processing is suspended per rights request.';

CREATE TABLE IF NOT EXISTS privacy_rights_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  subject TEXT NOT NULL DEFAULT '',
  detail TEXT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_message TEXT NULL,
  rejection_reason TEXT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ NULL,
  processed_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT privacy_rights_requests_type_chk CHECK (
    request_type IN (
      'access',
      'correction',
      'deletion',
      'processing_stop',
      'consent_withdraw'
    )
  ),
  CONSTRAINT privacy_rights_requests_status_chk CHECK (
    status IN ('received', 'reviewing', 'completed', 'rejected')
  )
);

CREATE INDEX IF NOT EXISTS idx_privacy_rights_requests_user_created
  ON privacy_rights_requests (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_privacy_rights_requests_status_due
  ON privacy_rights_requests (status, due_at);

CREATE INDEX IF NOT EXISTS idx_privacy_rights_requests_admin
  ON privacy_rights_requests (created_at DESC)
  WHERE status IN ('received', 'reviewing');

COMMENT ON TABLE privacy_rights_requests IS
  'Information-subject rights requests (access/correction/deletion/processing stop/consent withdraw). Not the same as account withdrawal.';
