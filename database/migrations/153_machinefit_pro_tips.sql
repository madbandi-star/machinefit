-- MachineFit PRO tips use machines.pro_tips (already added in 034).
-- App validation caps each locale / line at 5000 UTF-8 bytes.

ALTER TABLE machines
  ADD COLUMN IF NOT EXISTS pro_tips JSONB;

COMMENT ON COLUMN machines.pro_tips IS
  'MachineFit PRO tips {ko:[],en:[]} — admin-managed; max 5000 UTF-8 bytes per locale (app-enforced)';
