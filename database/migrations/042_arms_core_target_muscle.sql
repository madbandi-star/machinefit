-- Allow arms/core as free-weight target muscle groups (align with TARGET_MUSCLE_GROUPS)

COMMENT ON COLUMN machine_recommendations.target_muscle_group IS
  'User-selected muscle focus for free-weight sessions: back, chest, legs, shoulders, biceps, triceps, arms, core';

COMMENT ON COLUMN workout_logs.target_muscle_group IS
  'Target muscle for free-weight logs (back, chest, legs, shoulders, biceps, triceps, arms, core); empty string for machines';

ALTER TABLE machine_recommendations
  DROP CONSTRAINT IF EXISTS machine_recommendations_target_muscle_group_check;

ALTER TABLE machine_recommendations
  ADD CONSTRAINT machine_recommendations_target_muscle_group_check
  CHECK (
    target_muscle_group IS NULL
    OR target_muscle_group IN (
      'back', 'chest', 'legs', 'shoulders', 'biceps', 'triceps', 'arms', 'core'
    )
  );

ALTER TABLE workout_logs
  DROP CONSTRAINT IF EXISTS workout_logs_target_muscle_group_check;

ALTER TABLE workout_logs
  ADD CONSTRAINT workout_logs_target_muscle_group_check
  CHECK (
    target_muscle_group = ''
    OR target_muscle_group IN (
      'back', 'chest', 'legs', 'shoulders', 'biceps', 'triceps', 'arms', 'core'
    )
  );
