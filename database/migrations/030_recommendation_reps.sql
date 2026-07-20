-- Recommended rep range on machine recommendations (goal-based, e.g. 8–12)

ALTER TABLE machine_recommendations
  ADD COLUMN IF NOT EXISTS recommended_reps_min SMALLINT,
  ADD COLUMN IF NOT EXISTS recommended_reps_max SMALLINT;

COMMENT ON COLUMN machine_recommendations.recommended_reps_min IS
  'Inclusive lower bound of recommended working reps for this recommendation';

COMMENT ON COLUMN machine_recommendations.recommended_reps_max IS
  'Inclusive upper bound of recommended working reps for this recommendation';
