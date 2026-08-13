-- Bodyweight estimated-load factors for consistent volume accounting.
-- Factors are biomechanical estimates, NOT external plate/dumbbell weight.
-- ("맨몸운동 부하계수는 운동 자세와 체중 분포를 기반으로 한 추정값이며
-- 실제 외부 중량과 동일한 의미가 아닙니다.")

ALTER TABLE machines
  ADD COLUMN IF NOT EXISTS bodyweight_load_factor NUMERIC(4, 3) NULL;

ALTER TABLE machines
  DROP CONSTRAINT IF EXISTS machines_bodyweight_load_factor_chk;

ALTER TABLE machines
  ADD CONSTRAINT machines_bodyweight_load_factor_chk
  CHECK (
    bodyweight_load_factor IS NULL
    OR (bodyweight_load_factor > 0 AND bodyweight_load_factor <= 1.5)
  );

COMMENT ON COLUMN machines.bodyweight_load_factor IS
  'Estimated bodyweight load factor (0–1.5). Admin override; NULL = shared default by code. Not external weight.';

-- Snapshot fields so past sessions do not drift when profile weight changes.
ALTER TABLE workout_logs
  ADD COLUMN IF NOT EXISTS bodyweight_kg_at_record NUMERIC(6, 2) NULL;

ALTER TABLE workout_logs
  ADD COLUMN IF NOT EXISTS applied_load_factor NUMERIC(4, 3) NULL;

ALTER TABLE workout_logs
  ADD COLUMN IF NOT EXISTS load_type TEXT NOT NULL DEFAULT 'external_weight';

ALTER TABLE workout_logs
  DROP CONSTRAINT IF EXISTS workout_logs_load_type_chk;

ALTER TABLE workout_logs
  ADD CONSTRAINT workout_logs_load_type_chk
  CHECK (load_type IN ('external_weight', 'bodyweight_estimated'));

COMMENT ON COLUMN workout_logs.bodyweight_kg_at_record IS
  'User/member body weight (kg) applied when this BW session was saved; preserved on later profile changes.';
COMMENT ON COLUMN workout_logs.applied_load_factor IS
  'Bodyweight load factor applied at save time for estimated-load sessions.';
COMMENT ON COLUMN workout_logs.load_type IS
  'external_weight = plate/dumbbell/machine load; bodyweight_estimated = bodyweight × factor.';

-- Seed known catalog defaults (idempotent).
UPDATE machines
SET bodyweight_load_factor = v.factor
FROM (
  VALUES
    ('BW_PULL_UP', 1.00),
    ('BW_CHIN_UP', 1.00),
    ('BW_DIPS', 0.90),
    ('BW_BULGARIAN_SPLIT_SQUAT', 0.85),
    ('BW_LUNGE', 0.80),
    ('BW_SQUAT', 0.75),
    ('BW_PUSH_UP', 0.65)
) AS v(code, factor)
WHERE machines.code = v.code
  AND machines.bodyweight_load_factor IS NULL;
