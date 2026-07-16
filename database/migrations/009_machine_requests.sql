-- Machine requests
CREATE TABLE machine_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  brand_name VARCHAR(100),
  machine_name VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  linked_machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_machine_requests_status ON machine_requests (status);
CREATE INDEX idx_machine_requests_user_id ON machine_requests (user_id);

CREATE TRIGGER trg_machine_requests_updated_at
  BEFORE UPDATE ON machine_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
