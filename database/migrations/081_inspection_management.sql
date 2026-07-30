-- Inspection Management (Preventive Maintenance) module
-- Extends existing gym_machines; does NOT recreate gym_machines / machine_images.

-- ---------------------------------------------------------------------------
-- Extend gym_machines for maintenance / asset fields
-- ---------------------------------------------------------------------------
ALTER TABLE gym_machines
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS machine_code VARCHAR(80),
  ADD COLUMN IF NOT EXISTS serial_number VARCHAR(120),
  ADD COLUMN IF NOT EXISTS qr_code VARCHAR(120),
  ADD COLUMN IF NOT EXISTS nickname VARCHAR(120),
  ADD COLUMN IF NOT EXISTS location VARCHAR(120),
  ADD COLUMN IF NOT EXISTS purchase_date DATE,
  ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS warranty_end_date DATE,
  ADD COLUMN IF NOT EXISTS install_date DATE,
  ADD COLUMN IF NOT EXISTS ops_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS health_score INT NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS inspection_cycle VARCHAR(30) NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN IF NOT EXISTS usage_limit_count INT,
  ADD COLUMN IF NOT EXISTS usage_limit_volume NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS manager_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS memo TEXT,
  ADD COLUMN IF NOT EXISTS last_inspection_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_inspection_at TIMESTAMPTZ;

COMMENT ON COLUMN gym_machines.ops_status IS
  'ACTIVE | NEED_INSPECTION | UNDER_REPAIR | OUT_OF_SERVICE | DISPOSED';
COMMENT ON COLUMN gym_machines.inspection_cycle IS
  'DAILY | WEEKLY | MONTHLY | QUARTER | HALF_YEAR | YEARLY | CUSTOM';
COMMENT ON COLUMN gym_machines.health_score IS '0–100 operational health score';

CREATE INDEX IF NOT EXISTS idx_gym_machines_ops_status
  ON gym_machines (gym_id, ops_status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_gym_machines_next_inspection
  ON gym_machines (gym_id, next_inspection_at)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_gym_machines_qr_code
  ON gym_machines (qr_code)
  WHERE qr_code IS NOT NULL AND deleted_at IS NULL;

-- Backfill machine_code / brand_id from catalog where missing
UPDATE gym_machines gm
SET
  machine_code = COALESCE(gm.machine_code, m.code),
  brand_id = COALESCE(gm.brand_id, m.brand_id),
  location = COALESCE(gm.location, gm.floor_zone),
  nickname = COALESCE(gm.nickname, gm.instance_label)
FROM machines m
WHERE m.id = gm.machine_id
  AND (gm.machine_code IS NULL OR gm.brand_id IS NULL OR gm.location IS NULL OR gm.nickname IS NULL);

-- ---------------------------------------------------------------------------
-- inspection_templates (brand / category checklist items)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspection_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  machine_category VARCHAR(80),
  item_key VARCHAR(80) NOT NULL,
  item_name JSONB NOT NULL DEFAULT '{}'::jsonb,
  display_order INT NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspection_templates_brand
  ON inspection_templates (brand_id)
  WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_inspection_templates_category
  ON inspection_templates (machine_category)
  WHERE active = TRUE;

DROP TRIGGER IF EXISTS trg_inspection_templates_updated_at ON inspection_templates;
CREATE TRIGGER trg_inspection_templates_updated_at
  BEFORE UPDATE ON inspection_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Default template items (brand_id NULL = global)
INSERT INTO inspection_templates (brand_id, machine_category, item_key, item_name, display_order, required)
SELECT NULL, NULL, v.item_key, v.item_name::jsonb, v.display_order, TRUE
FROM (
  VALUES
    ('frame', '{"ko":"프레임","en":"Frame"}', 10),
    ('cable', '{"ko":"케이블","en":"Cable"}', 20),
    ('pulley', '{"ko":"풀리","en":"Pulley"}', 30),
    ('seat', '{"ko":"시트","en":"Seat"}', 40),
    ('handle', '{"ko":"손잡이","en":"Handle"}', 50),
    ('bolt', '{"ko":"볼트/체결","en":"Bolt"}', 60),
    ('noise', '{"ko":"소음","en":"Noise"}', 70),
    ('rust', '{"ko":"녹","en":"Rust"}', 80),
    ('paint', '{"ko":"도장","en":"Paint"}', 90),
    ('bearing', '{"ko":"베어링","en":"Bearing"}', 100),
    ('lubrication', '{"ko":"윤활","en":"Lubrication"}', 110)
) AS v(item_key, item_name, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM inspection_templates t
  WHERE t.brand_id IS NULL AND t.item_key = v.item_key
);

-- ---------------------------------------------------------------------------
-- machine_inspections
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS machine_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  gym_machine_id UUID NOT NULL REFERENCES gym_machines(id) ON DELETE CASCADE,
  inspection_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  inspector_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  inspection_result VARCHAR(20) NOT NULL DEFAULT 'PASS',
  health_score INT NOT NULL DEFAULT 100,
  next_inspection_date TIMESTAMPTZ,
  duration_seconds INT,
  note TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN machine_inspections.inspection_result IS 'PASS | WARNING | FAIL';

CREATE INDEX IF NOT EXISTS idx_machine_inspections_gym_machine
  ON machine_inspections (gym_machine_id, inspection_date DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_machine_inspections_gym_date
  ON machine_inspections (gym_id, inspection_date DESC)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_machine_inspections_updated_at ON machine_inspections;
CREATE TRIGGER trg_machine_inspections_updated_at
  BEFORE UPDATE ON machine_inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- machine_inspection_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS machine_inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES machine_inspections(id) ON DELETE CASCADE,
  template_item_id UUID REFERENCES inspection_templates(id) ON DELETE SET NULL,
  item_key VARCHAR(80),
  result VARCHAR(10) NOT NULL DEFAULT 'PASS',
  score INT,
  note TEXT,
  photo_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN machine_inspection_items.result IS 'PASS | FAIL | NA';

CREATE INDEX IF NOT EXISTS idx_machine_inspection_items_inspection
  ON machine_inspection_items (inspection_id);

-- ---------------------------------------------------------------------------
-- machine_faults (CM)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS machine_faults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  gym_machine_id UUID NOT NULL REFERENCES gym_machines(id) ON DELETE CASCADE,
  inspection_id UUID REFERENCES machine_inspections(id) ON DELETE SET NULL,
  reporter_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  symptom TEXT NOT NULL,
  suspected_cause TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
  assignee_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN machine_faults.severity IS 'LOW | NORMAL | HIGH | CRITICAL';
COMMENT ON COLUMN machine_faults.status IS
  'OPEN | CHECKING | PART_ORDER | REPAIRING | TESTING | DONE';

CREATE INDEX IF NOT EXISTS idx_machine_faults_gym_status
  ON machine_faults (gym_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_machine_faults_machine
  ON machine_faults (gym_machine_id, created_at DESC)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_machine_faults_updated_at ON machine_faults;
CREATE TRIGGER trg_machine_faults_updated_at
  BEFORE UPDATE ON machine_faults
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- machine_repairs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS machine_repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fault_id UUID NOT NULL REFERENCES machine_faults(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  repair_company VARCHAR(200),
  engineer VARCHAR(120),
  labor_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  parts_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  repair_note TEXT,
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_machine_repairs_fault
  ON machine_repairs (fault_id)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_machine_repairs_updated_at ON machine_repairs;
CREATE TRIGGER trg_machine_repairs_updated_at
  BEFORE UPDATE ON machine_repairs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- machine_parts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS machine_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  gym_machine_id UUID NOT NULL REFERENCES gym_machines(id) ON DELETE CASCADE,
  part_name VARCHAR(200) NOT NULL,
  replacement_cycle_days INT,
  replacement_cycle_usage INT,
  last_replaced_at TIMESTAMPTZ,
  next_replace_date DATE,
  stock_quantity INT NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_machine_parts_machine
  ON machine_parts (gym_machine_id)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_machine_parts_updated_at ON machine_parts;
CREATE TRIGGER trg_machine_parts_updated_at
  BEFORE UPDATE ON machine_parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- gym_machine_photos (avoid conflict with catalog machine_images)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gym_machine_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_machine_id UUID NOT NULL REFERENCES gym_machines(id) ON DELETE CASCADE,
  image_type VARCHAR(30) NOT NULL DEFAULT 'CURRENT',
  image_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN gym_machine_photos.image_type IS
  'INSTALL | CURRENT | REPAIR | REPLACEMENT | INSPECTION';

CREATE INDEX IF NOT EXISTS idx_gym_machine_photos_machine
  ON gym_machine_photos (gym_machine_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- member_machine_reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_machine_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  gym_machine_id UUID NOT NULL REFERENCES gym_machines(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type VARCHAR(40) NOT NULL,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN member_machine_reports.report_type IS
  'noise | shake | cable | seat | pad | other';
COMMENT ON COLUMN member_machine_reports.status IS 'OPEN | REVIEWING | RESOLVED | DISMISSED';

CREATE INDEX IF NOT EXISTS idx_member_machine_reports_machine
  ON member_machine_reports (gym_machine_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_member_machine_reports_gym_status
  ON member_machine_reports (gym_id, status)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_member_machine_reports_updated_at ON member_machine_reports;
CREATE TRIGGER trg_member_machine_reports_updated_at
  BEFORE UPDATE ON member_machine_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- machine_pm_schedules (preventive maintenance)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS machine_pm_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  gym_machine_id UUID NOT NULL REFERENCES gym_machines(id) ON DELETE CASCADE,
  cycle_type VARCHAR(30) NOT NULL DEFAULT 'MONTHLY',
  usage_limit_count INT,
  usage_limit_volume NUMERIC(14, 2),
  last_completed_at TIMESTAMPTZ,
  next_due_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN machine_pm_schedules.cycle_type IS
  'DAILY | WEEKLY | MONTHLY | QUARTER | HALF_YEAR | YEARLY | USAGE_COUNT | USAGE_VOLUME';
COMMENT ON COLUMN machine_pm_schedules.status IS 'SCHEDULED | DUE | DONE | SKIPPED';

CREATE INDEX IF NOT EXISTS idx_machine_pm_schedules_due
  ON machine_pm_schedules (gym_id, next_due_at)
  WHERE deleted_at IS NULL AND status IN ('SCHEDULED', 'DUE');

DROP TRIGGER IF EXISTS trg_machine_pm_schedules_updated_at ON machine_pm_schedules;
CREATE TRIGGER trg_machine_pm_schedules_updated_at
  BEFORE UPDATE ON machine_pm_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- inspection_audit_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspection_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id UUID,
  action VARCHAR(60) NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspection_audit_logs_gym
  ON inspection_audit_logs (gym_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- RLS: enable deny-by-default for PostgREST (Express uses privileged role)
-- ---------------------------------------------------------------------------
ALTER TABLE inspection_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_faults ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_machine_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_machine_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_pm_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_audit_logs ENABLE ROW LEVEL SECURITY;
