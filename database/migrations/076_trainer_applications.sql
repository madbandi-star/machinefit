-- Trainer verification applications (mirror owner_applications for Online PT trainers).

CREATE TABLE IF NOT EXISTS trainer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  applicant_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(255) NOT NULL,
  specialties TEXT,
  career TEXT,
  certifications TEXT,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trainer_applications_status_chk
    CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_trainer_applications_user_id
  ON trainer_applications (user_id);
CREATE INDEX IF NOT EXISTS idx_trainer_applications_status
  ON trainer_applications (status);
CREATE INDEX IF NOT EXISTS idx_trainer_applications_pending_user
  ON trainer_applications (user_id)
  WHERE status = 'pending';

COMMENT ON TABLE trainer_applications IS 'Trainer role verification applications from Become a Trainer';
COMMENT ON COLUMN trainer_applications.status IS 'pending | approved | rejected';

CREATE TRIGGER trg_trainer_applications_updated_at
  BEFORE UPDATE ON trainer_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
