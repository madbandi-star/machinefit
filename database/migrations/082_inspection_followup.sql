-- Inspection follow-up: notification types + gym QR helper index
-- (core tables already in 081)

CREATE INDEX IF NOT EXISTS idx_gym_machines_machine_code
  ON gym_machines (gym_id, lower(machine_code))
  WHERE deleted_at IS NULL AND machine_code IS NOT NULL;

COMMENT ON COLUMN gym_machines.qr_code IS
  'Asset QR payload; resolve via /qr/:code → /equipment/qr/:gymMachineId';
