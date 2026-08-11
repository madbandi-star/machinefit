-- Platform accounts: age floor 14 (KR PIPA-aligned). Gym facility members are unchanged.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_age_check;

UPDATE users
SET age = NULL
WHERE age IS NOT NULL AND age < 14;

ALTER TABLE users
  ADD CONSTRAINT users_age_check CHECK (age IS NULL OR (age >= 14 AND age <= 100));

COMMENT ON COLUMN users.age IS 'User age in years; platform accounts must be 14+';
