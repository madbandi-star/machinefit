-- Gym inventory provenance + soft delete, multi-operator permissions,
-- and owner-application fields for admin approval workflow.

-- ---------------------------------------------------------------------------
-- gym_machines: registrant metadata, verified flag, soft delete
-- ---------------------------------------------------------------------------
ALTER TABLE gym_machines
  ADD COLUMN IF NOT EXISTS registered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS registered_by_role VARCHAR(20) NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

COMMENT ON COLUMN gym_machines.registered_by_role IS 'member | owner | admin at registration time';
COMMENT ON COLUMN gym_machines.is_verified IS 'TRUE when registered by gym owner/operator (official inventory)';
COMMENT ON COLUMN gym_machines.status IS 'active | inactive | deleted';
COMMENT ON COLUMN gym_machines.deleted_at IS 'Soft delete timestamp; NULL means visible';

-- Replace hard unique with active-only unique so soft-deleted rows can be re-added.
ALTER TABLE gym_machines DROP CONSTRAINT IF EXISTS gym_machines_gym_id_machine_id_key;
DROP INDEX IF EXISTS gym_machines_gym_id_machine_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_gym_machines_active_gym_machine
  ON gym_machines (gym_id, machine_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_gym_machines_gym_active
  ON gym_machines (gym_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_gym_machines_registered_by
  ON gym_machines (registered_by);

-- Existing seed rows without registrant stay community-style (unverified).
UPDATE gym_machines
SET status = 'active'
WHERE status IS NULL OR status = '';

-- ---------------------------------------------------------------------------
-- gym_owner_permissions: RBAC for co-operators of one gym
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gym_owner_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_role VARCHAR(30) NOT NULL DEFAULT 'operator',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (gym_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gym_owner_permissions_user
  ON gym_owner_permissions (user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_gym_owner_permissions_gym
  ON gym_owner_permissions (gym_id)
  WHERE status = 'active';

COMMENT ON TABLE gym_owner_permissions IS 'Multi-operator access for a gym (owner | operator)';
COMMENT ON COLUMN gym_owner_permissions.permission_role IS 'owner | operator';
COMMENT ON COLUMN gym_owner_permissions.status IS 'active | revoked';

DROP TRIGGER IF EXISTS trg_gym_owner_permissions_updated_at ON gym_owner_permissions;
CREATE TRIGGER trg_gym_owner_permissions_updated_at
  BEFORE UPDATE ON gym_owner_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Backfill primary owners from gyms.owner_id
INSERT INTO gym_owner_permissions (gym_id, user_id, permission_role, status, granted_by)
SELECT g.id, g.owner_id, 'owner', 'active', g.owner_id
FROM gyms g
WHERE g.owner_id IS NOT NULL
ON CONFLICT (gym_id, user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- owner_applications: richer application + payment stub
-- ---------------------------------------------------------------------------
ALTER TABLE owner_applications
  ADD COLUMN IF NOT EXISTS applicant_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS evidence_url TEXT,
  ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'waived',
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);

COMMENT ON COLUMN owner_applications.payment_status IS
  'pending | paid | waived — require paid when billing is enabled; waived until payment integration';
COMMENT ON COLUMN owner_applications.evidence_url IS 'Optional business license / proof URL';
