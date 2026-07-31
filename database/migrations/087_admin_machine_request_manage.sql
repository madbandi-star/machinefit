-- Admin machine-request management: reviewing status, reject reason, search indexes

ALTER TABLE machine_requests
  ADD COLUMN IF NOT EXISTS reject_reason TEXT;

-- Map legacy "approved" (accepted, not yet cataloged) → reviewing
UPDATE machine_requests
SET status = 'reviewing'
WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_machine_requests_status_created
  ON machine_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_machine_requests_brand_machine_lower
  ON machine_requests (lower(trim(brand_name)), lower(trim(machine_name)));

CREATE INDEX IF NOT EXISTS idx_machine_requests_created_at
  ON machine_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_machine_requests_linked_machine
  ON machine_requests (linked_machine_id)
  WHERE linked_machine_id IS NOT NULL;
