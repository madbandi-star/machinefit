-- Future-ready tip tiers for machines (data only; no UI/logic yet).
-- Mirrors beginner_tips shape: localized string arrays { "ko": [...], "en": [...] }.

ALTER TABLE machines
  ADD COLUMN IF NOT EXISTS intermediate_tips JSONB,
  ADD COLUMN IF NOT EXISTS advanced_tips JSONB,
  ADD COLUMN IF NOT EXISTS pro_tips JSONB;

COMMENT ON COLUMN machines.intermediate_tips IS 'Localized intermediate tips {ko:[],en:[]} — reserved for future display';
COMMENT ON COLUMN machines.advanced_tips IS 'Localized advanced tips {ko:[],en:[]} — reserved for future display';
COMMENT ON COLUMN machines.pro_tips IS 'Localized pro tips {ko:[],en:[]} — reserved for future display';
