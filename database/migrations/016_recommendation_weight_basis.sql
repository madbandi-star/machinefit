ALTER TABLE machine_recommendations
  ADD COLUMN IF NOT EXISTS weight_basis JSONB;
