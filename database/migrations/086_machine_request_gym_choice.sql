-- Machine request board: gym name choice (profile / custom / unknown)

ALTER TABLE machine_requests
  ADD COLUMN IF NOT EXISTS gym_choice_mode VARCHAR(20) NOT NULL DEFAULT 'unknown';

ALTER TABLE machine_requests
  ADD COLUMN IF NOT EXISTS gym_name VARCHAR(50);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'machine_requests_gym_choice_mode_chk'
  ) THEN
    ALTER TABLE machine_requests
      ADD CONSTRAINT machine_requests_gym_choice_mode_chk
      CHECK (gym_choice_mode IN ('profile', 'custom', 'unknown'));
  END IF;
END $$;
