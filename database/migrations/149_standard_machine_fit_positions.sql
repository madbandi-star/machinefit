-- Default seat / back-pad / foot / handle for 공통 머신 (standard types).
-- Does not overwrite brand-specific machine_settings values that are already set.

ALTER TABLE standard_machine_types
  ADD COLUMN IF NOT EXISTS seat_position INT,
  ADD COLUMN IF NOT EXISTS back_pad_position INT,
  ADD COLUMN IF NOT EXISTS foot_position INT,
  ADD COLUMN IF NOT EXISTS handle_position INT;

COMMENT ON COLUMN standard_machine_types.seat_position IS
  'Default seat position for this standard type. NULL = not applicable.';
COMMENT ON COLUMN standard_machine_types.back_pad_position IS
  'Default back-pad position for this standard type. NULL = not applicable.';
COMMENT ON COLUMN standard_machine_types.foot_position IS
  'Default foot-plate position for this standard type. NULL = not applicable.';
COMMENT ON COLUMN standard_machine_types.handle_position IS
  'Default handle position for this standard type. NULL = not applicable.';

UPDATE standard_machine_types AS t SET
  seat_position = v.seat,
  back_pad_position = v.back,
  foot_position = v.foot,
  handle_position = v.handle,
  updated_at = NOW()
FROM (VALUES
  ('STD_CHEST_PRESS', 4, NULL::int, NULL::int, 2),
  ('STD_INCLINE_CHEST_PRESS', 4, NULL, NULL, 2),
  ('STD_DECLINE_CHEST_PRESS', 4, NULL, NULL, 2),
  ('STD_CONVERGING_CHEST_PRESS', 4, NULL, NULL, 2),
  ('STD_ISO_LATERAL_CHEST_PRESS', 4, NULL, NULL, 2),
  ('STD_PLATE_LOADED_CHEST_PRESS', 4, NULL, NULL, 2),
  ('STD_PEC_DECK', 4, NULL, NULL, 2),
  ('STD_FLY_MACHINE', 4, NULL, NULL, 2),
  ('STD_DIP_MACHINE', 4, NULL, NULL, 2),
  ('STD_ASSISTED_DIP', 4, NULL, 3, 2),
  ('STD_SUPER_INCLINE_PRESS', 4, NULL, NULL, 2),
  ('STD_LAT_PULLDOWN', 4, NULL, 3, NULL),
  ('STD_WIDE_LAT_PULLDOWN', 4, NULL, 3, NULL),
  ('STD_FRONT_PULLDOWN', 4, NULL, 3, NULL),
  ('STD_ISO_LATERAL_LAT_PULLDOWN', 4, 3, 3, NULL),
  ('STD_HIGH_ROW', 4, 3, 3, 2),
  ('STD_ISO_LATERAL_HIGH_ROW', 4, 3, 3, 2),
  ('STD_SEATED_ROW', 4, 3, 3, 2),
  ('STD_ROW_MACHINE', 4, 3, 3, 2),
  ('STD_LOW_ROW', 4, 3, 3, 2),
  ('STD_MID_ROW', 4, 3, 3, 2),
  ('STD_ISO_LATERAL_ROW', 4, 3, 3, 2),
  ('STD_ISO_LATERAL_LOW_ROW', 4, 3, 3, 2),
  ('STD_CHEST_SUPPORTED_ROW', 4, 4, 3, 2),
  ('STD_T_BAR_ROW', 4, 4, 3, 2),
  ('STD_PULLOVER', 4, 3, 3, 2),
  ('STD_ASSISTED_PULLUP', 4, NULL, 3, 2),
  ('STD_SHOULDER_PRESS', 4, 4, NULL, 2),
  ('STD_ISO_LATERAL_SHOULDER_PRESS', 4, 4, NULL, 2),
  ('STD_PLATE_LOADED_SHOULDER_PRESS', 4, 4, NULL, 2),
  ('STD_LATERAL_RAISE', 4, NULL, NULL, 2),
  ('STD_MACHINE_LATERAL_RAISE', 4, NULL, NULL, 2),
  ('STD_REAR_DELT', 4, 4, NULL, 2),
  ('STD_REAR_DELT_REVERSE_PEC', 4, 4, NULL, 2),
  ('STD_FRONT_RAISE', 4, NULL, NULL, 2),
  ('STD_UPRIGHT_ROW', 4, 3, NULL, 2),
  ('STD_ROTATOR_MACHINE', 4, 3, NULL, 2),
  ('STD_SHOULDER_LATERAL_COMBO', 4, 4, NULL, 2),
  ('STD_LEG_PRESS', NULL, 3, 4, NULL),
  ('STD_45_LEG_PRESS', NULL, 3, 4, NULL),
  ('STD_HORIZONTAL_LEG_PRESS', NULL, 3, 4, NULL),
  ('STD_HACK_SQUAT', NULL, 3, 4, 2),
  ('STD_SQUAT_PRESS', NULL, 3, 4, 2),
  ('STD_BELT_SQUAT', NULL, NULL, 4, 2),
  ('STD_LEG_EXTENSION', 4, 3, 3, NULL),
  ('STD_SEATED_LEG_CURL', 4, 3, 3, NULL),
  ('STD_LYING_LEG_CURL', NULL, 3, 3, NULL),
  ('STD_STANDING_LEG_CURL', NULL, NULL, 3, 2),
  ('STD_SINGLE_LEG_CURL', 4, 3, 3, NULL),
  ('STD_HIP_THRUST', 4, 3, 4, 2),
  ('STD_GLUTE_DRIVE', 4, 3, 4, 2),
  ('STD_GLUTE_KICKBACK', 4, NULL, 4, 2),
  ('STD_HIP_ABDUCTION', 4, 3, 3, 2),
  ('STD_HIP_ADDUCTION', 4, 3, 3, 2),
  ('STD_GLUTE_HIP_MACHINE', 4, 3, 3, 2),
  ('STD_STANDING_CALF', NULL, NULL, 4, 2),
  ('STD_SEATED_CALF', 4, 3, 4, 2),
  ('STD_LEG_PRESS_CALF', NULL, 3, 4, NULL),
  ('STD_BICEPS_CURL', 4, 3, NULL, 2),
  ('STD_PREACHER_CURL', 4, 3, 3, 2),
  ('STD_ISO_LATERAL_BICEPS_CURL', 4, 3, NULL, 2),
  ('STD_ARM_CURL', 4, 3, NULL, 2),
  ('STD_TRICEPS_EXTENSION', 4, 3, NULL, 2),
  ('STD_TRICEPS_PRESS', 4, 3, NULL, 2),
  ('STD_DIP_TRICEPS_MACHINE', 4, 3, NULL, 2),
  ('STD_BICEPS_TRICEPS_COMBO', 4, 3, NULL, 2),
  ('STD_AB_CRUNCH', 4, 3, 3, 2),
  ('STD_ABDOMINAL', 4, 3, 3, 2),
  ('STD_ROTARY_TORSO', 4, 3, 3, 2),
  ('STD_SIDE_BEND', 4, 3, 3, 2),
  ('STD_BACK_EXTENSION', NULL, 3, 3, 2),
  ('STD_HIP_EXTENSION', 4, 3, 3, 2),
  ('STD_ABS_BACK_COMBO', 4, 3, 3, 2),
  ('STD_CABLE_CROSSOVER', NULL, NULL, NULL, 1),
  ('STD_DUAL_ADJUSTABLE_PULLEY', NULL, NULL, NULL, 1),
  ('STD_MULTI_JUNGLE_GYM', NULL, NULL, NULL, 1),
  ('STD_ASSISTED_PULLUP_DIP', 4, NULL, 3, 2),
  ('STD_SMITH_MACHINE', NULL, NULL, NULL, NULL),
  ('STD_POWER_RACK', NULL, NULL, NULL, NULL),
  ('STD_HALF_RACK', NULL, NULL, NULL, NULL)
) AS v(code, seat, back, foot, handle)
WHERE t.code = v.code;

-- Fill only empty position fields on existing recommendation rules.
UPDATE machine_settings ms
SET
  seat_position = COALESCE(ms.seat_position, t.seat_position),
  back_pad_position = COALESCE(ms.back_pad_position, t.back_pad_position),
  foot_position = COALESCE(ms.foot_position, t.foot_position),
  handle_position = COALESCE(ms.handle_position, t.handle_position),
  updated_at = NOW()
FROM machines m
JOIN standard_machine_types t ON t.id = m.standard_type_id
WHERE ms.machine_id = m.id;

-- 공통 머신 copies that have no rules yet.
INSERT INTO machine_settings (
  machine_id, gender, experience_level,
  height_min_cm, height_max_cm,
  seat_position, back_pad_position, foot_position, handle_position,
  rom_setting
)
SELECT
  m.id,
  g.gender,
  'intermediate',
  150,
  200,
  t.seat_position,
  t.back_pad_position,
  t.foot_position,
  t.handle_position,
  '최대'
FROM machines m
JOIN standard_machine_types t ON t.id = m.standard_type_id
CROSS JOIN (VALUES ('male'), ('female')) AS g(gender)
WHERE NOT EXISTS (
  SELECT 1 FROM machine_settings ms WHERE ms.machine_id = m.id
);

-- Existing records: fill only NULL position columns.
UPDATE machine_recommendations r
SET
  seat_position = COALESCE(r.seat_position, t.seat_position),
  back_pad_position = COALESCE(r.back_pad_position, t.back_pad_position),
  foot_position = COALESCE(r.foot_position, t.foot_position),
  handle_position = COALESCE(r.handle_position, t.handle_position),
  updated_at = NOW()
FROM machines m
JOIN standard_machine_types t ON t.id = m.standard_type_id
WHERE r.machine_id = m.id;
