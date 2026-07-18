-- Optional target muscle group for free-weight recommendations

ALTER TABLE machine_recommendations
  ADD COLUMN IF NOT EXISTS target_muscle_group VARCHAR(20);

COMMENT ON COLUMN machine_recommendations.target_muscle_group IS 'User-selected muscle focus for free-weight sessions';
