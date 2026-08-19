-- Verification metadata for MachineFit PRO tips (display text stays in pro_tips).
ALTER TABLE machines
  ADD COLUMN IF NOT EXISTS pro_tips_meta JSONB;

COMMENT ON COLUMN machines.pro_tips_meta IS
  'PRO tip verification: verification_status, verified_model, source_url, verified_structure, verified_adjustments, ...';

CREATE INDEX IF NOT EXISTS idx_machines_pro_tips_meta_status
  ON machines ((pro_tips_meta->>'verification_status'))
  WHERE pro_tips_meta IS NOT NULL;
