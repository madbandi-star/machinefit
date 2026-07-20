-- Brand/machine catalog content fields for equipment data quality.
-- Additive only — does not change recommendation algorithm behavior.

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS description JSONB;

ALTER TABLE machines
  ADD COLUMN IF NOT EXISTS how_to JSONB,
  ADD COLUMN IF NOT EXISTS warnings JSONB,
  ADD COLUMN IF NOT EXISTS tips JSONB,
  ADD COLUMN IF NOT EXISTS beginner_tips JSONB,
  ADD COLUMN IF NOT EXISTS recommended_experience VARCHAR(20);

COMMENT ON COLUMN brands.description IS 'Localized short brand intro {ko,en,...}';
COMMENT ON COLUMN machines.how_to IS 'Localized usage steps {ko:[],en:[]} for coaching/TTS';
COMMENT ON COLUMN machines.warnings IS 'Localized cautions {ko:[],en:[]}';
COMMENT ON COLUMN machines.tips IS 'Localized form tips {ko:[],en:[]}';
COMMENT ON COLUMN machines.beginner_tips IS 'Localized beginner tips {ko:[],en:[]}';
COMMENT ON COLUMN machines.recommended_experience IS 'beginner | intermediate | advanced';
