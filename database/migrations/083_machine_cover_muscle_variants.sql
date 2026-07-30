-- Allow optional per-target-muscle cover images for free-weight machines
-- (e.g. FW_BARBELL + back = barbell row, FW_BARBELL + chest = bench press).
-- NULL target_muscle_group = default cover (existing behavior).

ALTER TABLE machine_cover_images
  ADD COLUMN IF NOT EXISTS id UUID;

UPDATE machine_cover_images
SET id = gen_random_uuid()
WHERE id IS NULL;

ALTER TABLE machine_cover_images
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN id SET NOT NULL;

ALTER TABLE machine_cover_images
  DROP CONSTRAINT IF EXISTS machine_cover_images_pkey;

ALTER TABLE machine_cover_images
  DROP CONSTRAINT IF EXISTS machine_cover_images_machine_code_key;

ALTER TABLE machine_cover_images
  ADD COLUMN IF NOT EXISTS target_muscle_group VARCHAR(40);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'machine_cover_images_pkey'
  ) THEN
    ALTER TABLE machine_cover_images ADD PRIMARY KEY (id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_machine_cover_default_machine
  ON machine_cover_images (machine_id)
  WHERE target_muscle_group IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_machine_cover_muscle_machine
  ON machine_cover_images (machine_id, target_muscle_group)
  WHERE target_muscle_group IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_machine_cover_default_code
  ON machine_cover_images (machine_code)
  WHERE target_muscle_group IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_machine_cover_muscle_code
  ON machine_cover_images (machine_code, target_muscle_group)
  WHERE target_muscle_group IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_machine_cover_images_muscle
  ON machine_cover_images (machine_code, target_muscle_group);

COMMENT ON COLUMN machine_cover_images.target_muscle_group IS
  'Optional target muscle for free-weight covers (back/chest/…). NULL = default cover.';
