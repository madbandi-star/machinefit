-- Repair: ensure 80 standard machine types (+ aliases/muscles/soft-links) exist.
-- Idempotent. Safe if 133 already applied fully.

-- ===== Standard machine types =====
INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_CHEST_PRESS',
  '{"ko":"체스트 프레스","en":"Chest Press"}'::jsonb,
  'chest',
  10,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'chest', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_CHEST_PRESS'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Chest Press', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_CHEST_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Chest Press')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '체스트프레스', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_CHEST_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('체스트프레스')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_INCLINE_CHEST_PRESS',
  '{"ko":"인클라인 체스트 프레스","en":"Incline Chest Press"}'::jsonb,
  'chest',
  20,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'chest', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_INCLINE_CHEST_PRESS'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Incline Chest Press', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_INCLINE_CHEST_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Incline Chest Press')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '인클라인 체스트프레스', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_INCLINE_CHEST_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('인클라인 체스트프레스')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_DECLINE_CHEST_PRESS',
  '{"ko":"디클라인 체스트 프레스","en":"Decline Chest Press"}'::jsonb,
  'chest',
  30,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'chest', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_DECLINE_CHEST_PRESS'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Decline Chest Press', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_DECLINE_CHEST_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Decline Chest Press')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_CONVERGING_CHEST_PRESS',
  '{"ko":"컨버징 체스트 프레스","en":"Converging Chest Press"}'::jsonb,
  'chest',
  40,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'chest', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_CONVERGING_CHEST_PRESS'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Converging Chest Press', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_CONVERGING_CHEST_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Converging Chest Press')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_ISO_LATERAL_CHEST_PRESS',
  '{"ko":"아이소래터럴 체스트 프레스","en":"Iso-Lateral Chest Press"}'::jsonb,
  'chest',
  50,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'chest', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_ISO_LATERAL_CHEST_PRESS'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Iso-Lateral Chest Press', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ISO_LATERAL_CHEST_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Iso-Lateral Chest Press')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Isolateral Chest Press', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ISO_LATERAL_CHEST_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Isolateral Chest Press')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_PLATE_LOADED_CHEST_PRESS',
  '{"ko":"플레이트로드 체스트 프레스","en":"Plate-Loaded Chest Press"}'::jsonb,
  'chest',
  60,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'chest', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_PLATE_LOADED_CHEST_PRESS'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Plate Loaded Chest Press', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_PLATE_LOADED_CHEST_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Plate Loaded Chest Press')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_PEC_DECK',
  '{"ko":"펙덱","en":"Pec Deck"}'::jsonb,
  'chest',
  70,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'chest', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_PEC_DECK'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Pec Deck', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_PEC_DECK'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Pec Deck')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Pec Fly', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_PEC_DECK'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Pec Fly')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '펙플라이', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_PEC_DECK'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('펙플라이')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_REAR_DELT_REVERSE_PEC',
  '{"ko":"리어 델트 / 리버스 펙덱","en":"Rear Delt / Reverse Pec Deck"}'::jsonb,
  'shoulders',
  80,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'shoulders', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_REAR_DELT_REVERSE_PEC'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Reverse Pec Deck', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_REAR_DELT_REVERSE_PEC'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Reverse Pec Deck')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '리어델트', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_REAR_DELT_REVERSE_PEC'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('리어델트')
  );

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', FALSE, 10
FROM standard_machine_types t WHERE t.code = 'STD_REAR_DELT_REVERSE_PEC'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;

INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_FLY_MACHINE',
  '{"ko":"플라이 머신","en":"Fly Machine"}'::jsonb,
  'chest',
  90,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'chest', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_FLY_MACHINE'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Chest Fly', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_FLY_MACHINE'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Chest Fly')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '플라이', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_FLY_MACHINE'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('플라이')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_DIP_MACHINE',
  '{"ko":"딥 머신","en":"Dip Machine"}'::jsonb,
  'chest',
  100,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'chest', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_DIP_MACHINE'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Dip Machine', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_DIP_MACHINE'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Dip Machine')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '딥머신', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_DIP_MACHINE'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('딥머신')
  );

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'triceps', FALSE, 10
FROM standard_machine_types t WHERE t.code = 'STD_DIP_MACHINE'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;

INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_ASSISTED_DIP',
  '{"ko":"어시스트 딥","en":"Assisted Dip"}'::jsonb,
  'chest',
  110,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'chest', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_ASSISTED_DIP'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Assisted Dip', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ASSISTED_DIP'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Assisted Dip')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '어시스티드 딥', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ASSISTED_DIP'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('어시스티드 딥')
  );

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'triceps', FALSE, 10
FROM standard_machine_types t WHERE t.code = 'STD_ASSISTED_DIP'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;

INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_SUPER_INCLINE_PRESS',
  '{"ko":"슈퍼 인클라인 프레스","en":"Super Incline Press"}'::jsonb,
  'chest',
  120,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'chest', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_SUPER_INCLINE_PRESS'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Super Incline Press', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_SUPER_INCLINE_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Super Incline Press')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_LAT_PULLDOWN',
  '{"ko":"랫풀다운","en":"Lat Pulldown"}'::jsonb,
  'back',
  130,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_LAT_PULLDOWN'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Lat Pulldown', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_LAT_PULLDOWN'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Lat Pulldown')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Lat Pull Down', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_LAT_PULLDOWN'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Lat Pull Down')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '랫 풀다운', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_LAT_PULLDOWN'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('랫 풀다운')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_WIDE_LAT_PULLDOWN',
  '{"ko":"와이드 랫풀다운","en":"Wide Lat Pulldown"}'::jsonb,
  'back',
  140,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_WIDE_LAT_PULLDOWN'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Wide Lat Pulldown', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_WIDE_LAT_PULLDOWN'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Wide Lat Pulldown')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_FRONT_PULLDOWN',
  '{"ko":"프론트 풀다운","en":"Front Pulldown"}'::jsonb,
  'back',
  150,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_FRONT_PULLDOWN'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Front Pulldown', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_FRONT_PULLDOWN'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Front Pulldown')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_ISO_LATERAL_LAT_PULLDOWN',
  '{"ko":"아이소래터럴 랫풀다운","en":"Iso-Lateral Lat Pulldown"}'::jsonb,
  'back',
  160,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_ISO_LATERAL_LAT_PULLDOWN'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Iso-Lateral Lat Pulldown', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ISO_LATERAL_LAT_PULLDOWN'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Iso-Lateral Lat Pulldown')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_HIGH_ROW',
  '{"ko":"하이로우","en":"High Row"}'::jsonb,
  'back',
  170,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_HIGH_ROW'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'High Row', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_HIGH_ROW'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('High Row')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'High-Row', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_HIGH_ROW'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('High-Row')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '하이 로우', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_HIGH_ROW'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('하이 로우')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_ISO_LATERAL_HIGH_ROW',
  '{"ko":"아이소래터럴 하이로우","en":"Iso-Lateral High Row"}'::jsonb,
  'back',
  180,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_ISO_LATERAL_HIGH_ROW'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Iso-Lateral High Row', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ISO_LATERAL_HIGH_ROW'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Iso-Lateral High Row')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Isolateral High Row', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ISO_LATERAL_HIGH_ROW'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Isolateral High Row')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_SEATED_ROW',
  '{"ko":"시티드 로우","en":"Seated Row"}'::jsonb,
  'back',
  190,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_SEATED_ROW'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Seated Row', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_SEATED_ROW'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Seated Row')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '시티드로우', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_SEATED_ROW'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('시티드로우')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_ROW_MACHINE',
  '{"ko":"로우 머신","en":"Row Machine"}'::jsonb,
  'back',
  200,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_ROW_MACHINE'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Row Machine', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ROW_MACHINE'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Row Machine')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_LOW_ROW',
  '{"ko":"로우 로우","en":"Low Row"}'::jsonb,
  'back',
  210,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_LOW_ROW'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Low Row', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_LOW_ROW'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Low Row')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '로우로우', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_LOW_ROW'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('로우로우')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_MID_ROW',
  '{"ko":"미드 로우","en":"Mid Row"}'::jsonb,
  'back',
  220,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_MID_ROW'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Mid Row', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_MID_ROW'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Mid Row')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '미드로우', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_MID_ROW'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('미드로우')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_ISO_LATERAL_ROW',
  '{"ko":"아이소래터럴 로우","en":"Iso-Lateral Row"}'::jsonb,
  'back',
  230,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_ISO_LATERAL_ROW'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Iso-Lateral Row', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ISO_LATERAL_ROW'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Iso-Lateral Row')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Isolateral Row', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ISO_LATERAL_ROW'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Isolateral Row')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_ISO_LATERAL_LOW_ROW',
  '{"ko":"아이소래터럴 로우 로우","en":"Iso-Lateral Low Row"}'::jsonb,
  'back',
  240,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_ISO_LATERAL_LOW_ROW'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Iso-Lateral Low Row', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ISO_LATERAL_LOW_ROW'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Iso-Lateral Low Row')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_CHEST_SUPPORTED_ROW',
  '{"ko":"체스트 서포티드 로우","en":"Chest Supported Row"}'::jsonb,
  'back',
  250,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_CHEST_SUPPORTED_ROW'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Chest Supported Row', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_CHEST_SUPPORTED_ROW'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Chest Supported Row')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_T_BAR_ROW',
  '{"ko":"T바 로우 머신","en":"T-Bar Row Machine"}'::jsonb,
  'back',
  260,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_T_BAR_ROW'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'T-Bar Row', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_T_BAR_ROW'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('T-Bar Row')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'T Bar Row', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_T_BAR_ROW'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('T Bar Row')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_PULLOVER',
  '{"ko":"풀오버","en":"Pullover"}'::jsonb,
  'back',
  270,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_PULLOVER'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Pullover', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_PULLOVER'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Pullover')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '풀 오버', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_PULLOVER'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('풀 오버')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_ASSISTED_PULLUP',
  '{"ko":"어시스트 풀업 / 친업","en":"Assisted Pull-Up / Chin-Up"}'::jsonb,
  'back',
  280,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_ASSISTED_PULLUP'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Assisted Pull Up', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ASSISTED_PULLUP'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Assisted Pull Up')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Assisted Chin Up', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ASSISTED_PULLUP'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Assisted Chin Up')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '어시스트 풀업', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ASSISTED_PULLUP'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('어시스트 풀업')
  );

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'biceps', FALSE, 10
FROM standard_machine_types t WHERE t.code = 'STD_ASSISTED_PULLUP'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;

INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_SHOULDER_PRESS',
  '{"ko":"숄더 프레스","en":"Shoulder Press"}'::jsonb,
  'shoulders',
  290,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'shoulders', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_SHOULDER_PRESS'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Shoulder Press', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_SHOULDER_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Shoulder Press')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Military Press', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_SHOULDER_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Military Press')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_ISO_LATERAL_SHOULDER_PRESS',
  '{"ko":"아이소래터럴 숄더 프레스","en":"Iso-Lateral Shoulder Press"}'::jsonb,
  'shoulders',
  300,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'shoulders', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_ISO_LATERAL_SHOULDER_PRESS'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Iso-Lateral Shoulder Press', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ISO_LATERAL_SHOULDER_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Iso-Lateral Shoulder Press')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_PLATE_LOADED_SHOULDER_PRESS',
  '{"ko":"플레이트로드 숄더 프레스","en":"Plate-Loaded Shoulder Press"}'::jsonb,
  'shoulders',
  310,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'shoulders', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_PLATE_LOADED_SHOULDER_PRESS'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Plate Loaded Shoulder Press', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_PLATE_LOADED_SHOULDER_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Plate Loaded Shoulder Press')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_LATERAL_RAISE',
  '{"ko":"레터럴 레이즈","en":"Lateral Raise"}'::jsonb,
  'shoulders',
  320,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'shoulders', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_LATERAL_RAISE'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Lateral Raise', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_LATERAL_RAISE'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Lateral Raise')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Side Raise', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_LATERAL_RAISE'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Side Raise')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_MACHINE_LATERAL_RAISE',
  '{"ko":"머신 레터럴 레이즈","en":"Machine Lateral Raise"}'::jsonb,
  'shoulders',
  330,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'shoulders', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_MACHINE_LATERAL_RAISE'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Machine Lateral Raise', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_MACHINE_LATERAL_RAISE'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Machine Lateral Raise')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_REAR_DELT',
  '{"ko":"리어 델트","en":"Rear Delt"}'::jsonb,
  'shoulders',
  340,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'shoulders', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_REAR_DELT'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Rear Delt', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_REAR_DELT'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Rear Delt')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Rear Deltoid', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_REAR_DELT'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Rear Deltoid')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_FRONT_RAISE',
  '{"ko":"프론트 레이즈","en":"Front Raise"}'::jsonb,
  'shoulders',
  350,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'shoulders', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_FRONT_RAISE'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Front Raise', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_FRONT_RAISE'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Front Raise')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_UPRIGHT_ROW',
  '{"ko":"업라이트 로우","en":"Upright Row"}'::jsonb,
  'shoulders',
  360,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'shoulders', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_UPRIGHT_ROW'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Upright Row', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_UPRIGHT_ROW'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Upright Row')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_ROTATOR_MACHINE',
  '{"ko":"로테이터 머신","en":"Rotator Machine"}'::jsonb,
  'shoulders',
  370,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'shoulders', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_ROTATOR_MACHINE'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Rotator Cuff Machine', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ROTATOR_MACHINE'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Rotator Cuff Machine')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '로테이터', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ROTATOR_MACHINE'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('로테이터')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_SHOULDER_LATERAL_COMBO',
  '{"ko":"숄더 프레스 / 레터럴 복합 머신","en":"Shoulder Press / Lateral Combo"}'::jsonb,
  'shoulders',
  380,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'shoulders', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_SHOULDER_LATERAL_COMBO'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Shoulder Lateral Combo', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_SHOULDER_LATERAL_COMBO'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Shoulder Lateral Combo')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_LEG_PRESS',
  '{"ko":"레그 프레스","en":"Leg Press"}'::jsonb,
  'legs',
  390,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_LEG_PRESS'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Leg Press', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_LEG_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Leg Press')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '레그프레스', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_LEG_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('레그프레스')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_45_LEG_PRESS',
  '{"ko":"45도 레그 프레스","en":"45° Leg Press"}'::jsonb,
  'legs',
  400,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_45_LEG_PRESS'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '45 Degree Leg Press', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_45_LEG_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('45 Degree Leg Press')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '45 Leg Press', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_45_LEG_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('45 Leg Press')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_HORIZONTAL_LEG_PRESS',
  '{"ko":"수평 레그 프레스","en":"Horizontal Leg Press"}'::jsonb,
  'legs',
  410,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_HORIZONTAL_LEG_PRESS'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Horizontal Leg Press', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_HORIZONTAL_LEG_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Horizontal Leg Press')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_HACK_SQUAT',
  '{"ko":"핵 스쿼트","en":"Hack Squat"}'::jsonb,
  'legs',
  420,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_HACK_SQUAT'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Hack Squat', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_HACK_SQUAT'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Hack Squat')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '핵스쿼트', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_HACK_SQUAT'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('핵스쿼트')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_SQUAT_PRESS',
  '{"ko":"스쿼트 프레스","en":"Squat Press"}'::jsonb,
  'legs',
  430,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_SQUAT_PRESS'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Squat Press', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_SQUAT_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Squat Press')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'V Squat', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_SQUAT_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('V Squat')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_BELT_SQUAT',
  '{"ko":"벨트 스쿼트","en":"Belt Squat"}'::jsonb,
  'legs',
  440,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_BELT_SQUAT'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Belt Squat', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_BELT_SQUAT'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Belt Squat')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_LEG_EXTENSION',
  '{"ko":"레그 익스텐션","en":"Leg Extension"}'::jsonb,
  'legs',
  450,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_LEG_EXTENSION'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Leg Extension', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_LEG_EXTENSION'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Leg Extension')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '레그익스텐션', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_LEG_EXTENSION'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('레그익스텐션')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_SEATED_LEG_CURL',
  '{"ko":"시티드 레그 컬","en":"Seated Leg Curl"}'::jsonb,
  'legs',
  460,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_SEATED_LEG_CURL'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Seated Leg Curl', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_SEATED_LEG_CURL'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Seated Leg Curl')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_LYING_LEG_CURL',
  '{"ko":"라잉 레그 컬","en":"Lying Leg Curl"}'::jsonb,
  'legs',
  470,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_LYING_LEG_CURL'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Lying Leg Curl', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_LYING_LEG_CURL'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Lying Leg Curl')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Prone Leg Curl', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_LYING_LEG_CURL'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Prone Leg Curl')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_STANDING_LEG_CURL',
  '{"ko":"스탠딩 레그 컬","en":"Standing Leg Curl"}'::jsonb,
  'legs',
  480,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_STANDING_LEG_CURL'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Standing Leg Curl', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_STANDING_LEG_CURL'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Standing Leg Curl')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_SINGLE_LEG_CURL',
  '{"ko":"싱글 레그 컬","en":"Single Leg Curl"}'::jsonb,
  'legs',
  490,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_SINGLE_LEG_CURL'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Single Leg Curl', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_SINGLE_LEG_CURL'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Single Leg Curl')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_HIP_THRUST',
  '{"ko":"힙 쓰러스트","en":"Hip Thrust"}'::jsonb,
  'legs',
  500,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_HIP_THRUST'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Hip Thrust', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_HIP_THRUST'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Hip Thrust')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '힙쓰러스트', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_HIP_THRUST'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('힙쓰러스트')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_GLUTE_DRIVE',
  '{"ko":"글루트 드라이브","en":"Glute Drive"}'::jsonb,
  'legs',
  510,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_GLUTE_DRIVE'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Glute Drive', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_GLUTE_DRIVE'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Glute Drive')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_GLUTE_KICKBACK',
  '{"ko":"글루트 킥백","en":"Glute Kickback"}'::jsonb,
  'legs',
  520,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_GLUTE_KICKBACK'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Glute Kickback', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_GLUTE_KICKBACK'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Glute Kickback')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_HIP_ABDUCTION',
  '{"ko":"힙 어브덕션","en":"Hip Abduction"}'::jsonb,
  'legs',
  530,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_HIP_ABDUCTION'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Hip Abduction', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_HIP_ABDUCTION'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Hip Abduction')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Abduction', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_HIP_ABDUCTION'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Abduction')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_HIP_ADDUCTION',
  '{"ko":"힙 어덕션","en":"Hip Adduction"}'::jsonb,
  'legs',
  540,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_HIP_ADDUCTION'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Hip Adduction', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_HIP_ADDUCTION'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Hip Adduction')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Adduction', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_HIP_ADDUCTION'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Adduction')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_GLUTE_HIP_MACHINE',
  '{"ko":"글루트 / 힙 머신","en":"Glute / Hip Machine"}'::jsonb,
  'legs',
  550,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_GLUTE_HIP_MACHINE'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Glute Machine', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_GLUTE_HIP_MACHINE'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Glute Machine')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Hip Machine', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_GLUTE_HIP_MACHINE'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Hip Machine')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_STANDING_CALF',
  '{"ko":"스탠딩 카프","en":"Standing Calf"}'::jsonb,
  'legs',
  560,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_STANDING_CALF'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Standing Calf Raise', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_STANDING_CALF'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Standing Calf Raise')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_SEATED_CALF',
  '{"ko":"시티드 카프","en":"Seated Calf"}'::jsonb,
  'legs',
  570,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_SEATED_CALF'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Seated Calf Raise', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_SEATED_CALF'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Seated Calf Raise')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_LEG_PRESS_CALF',
  '{"ko":"레그 프레스 카프","en":"Leg Press Calf"}'::jsonb,
  'legs',
  580,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_LEG_PRESS_CALF'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Leg Press Calf', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_LEG_PRESS_CALF'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Leg Press Calf')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_BICEPS_CURL',
  '{"ko":"바이셉 컬","en":"Biceps Curl"}'::jsonb,
  'biceps',
  590,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'biceps', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_BICEPS_CURL'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Biceps Curl', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_BICEPS_CURL'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Biceps Curl')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Bicep Curl', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_BICEPS_CURL'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Bicep Curl')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '바이셉스 컬', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_BICEPS_CURL'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('바이셉스 컬')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_PREACHER_CURL',
  '{"ko":"프리처 컬","en":"Preacher Curl"}'::jsonb,
  'biceps',
  600,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'biceps', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_PREACHER_CURL'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Preacher Curl', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_PREACHER_CURL'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Preacher Curl')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_ISO_LATERAL_BICEPS_CURL',
  '{"ko":"아이소래터럴 바이셉 컬","en":"Iso-Lateral Biceps Curl"}'::jsonb,
  'biceps',
  610,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'biceps', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_ISO_LATERAL_BICEPS_CURL'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Iso-Lateral Biceps Curl', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ISO_LATERAL_BICEPS_CURL'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Iso-Lateral Biceps Curl')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_ARM_CURL',
  '{"ko":"암 컬","en":"Arm Curl"}'::jsonb,
  'arms',
  620,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'arms', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_ARM_CURL'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Arm Curl', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ARM_CURL'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Arm Curl')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_TRICEPS_EXTENSION',
  '{"ko":"트라이셉스 익스텐션","en":"Triceps Extension"}'::jsonb,
  'triceps',
  630,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'triceps', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_TRICEPS_EXTENSION'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Triceps Extension', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_TRICEPS_EXTENSION'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Triceps Extension')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '트라이셉스 익스텐션', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_TRICEPS_EXTENSION'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('트라이셉스 익스텐션')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_TRICEPS_PRESS',
  '{"ko":"트라이셉스 프레스","en":"Triceps Press"}'::jsonb,
  'triceps',
  640,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'triceps', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_TRICEPS_PRESS'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Triceps Press', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_TRICEPS_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Triceps Press')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_DIP_TRICEPS_MACHINE',
  '{"ko":"딥 / 트라이셉스 머신","en":"Dip / Triceps Machine"}'::jsonb,
  'triceps',
  650,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'triceps', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_DIP_TRICEPS_MACHINE'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Triceps Dip Machine', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_DIP_TRICEPS_MACHINE'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Triceps Dip Machine')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_BICEPS_TRICEPS_COMBO',
  '{"ko":"바이셉스 / 트라이셉스 복합 머신","en":"Biceps / Triceps Combo"}'::jsonb,
  'arms',
  660,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'arms', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_BICEPS_TRICEPS_COMBO'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Biceps Triceps Combo', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_BICEPS_TRICEPS_COMBO'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Biceps Triceps Combo')
  );

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'biceps', FALSE, 10
FROM standard_machine_types t WHERE t.code = 'STD_BICEPS_TRICEPS_COMBO'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;
INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'triceps', FALSE, 20
FROM standard_machine_types t WHERE t.code = 'STD_BICEPS_TRICEPS_COMBO'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;

INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_AB_CRUNCH',
  '{"ko":"앱 크런치","en":"Ab Crunch"}'::jsonb,
  'core',
  670,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'core', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_AB_CRUNCH'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Ab Crunch', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_AB_CRUNCH'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Ab Crunch')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Crunch Machine', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_AB_CRUNCH'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Crunch Machine')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_ABDOMINAL',
  '{"ko":"어브도미널","en":"Abdominal"}'::jsonb,
  'core',
  680,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'core', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_ABDOMINAL'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Abdominal', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ABDOMINAL'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Abdominal')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Abs Machine', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ABDOMINAL'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Abs Machine')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_ROTARY_TORSO',
  '{"ko":"로터리 토르소","en":"Rotary Torso"}'::jsonb,
  'core',
  690,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'core', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_ROTARY_TORSO'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Rotary Torso', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ROTARY_TORSO'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Rotary Torso')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_SIDE_BEND',
  '{"ko":"사이드 밴드","en":"Side Bend"}'::jsonb,
  'core',
  700,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'core', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_SIDE_BEND'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Side Bend', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_SIDE_BEND'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Side Bend')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Oblique Machine', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_SIDE_BEND'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Oblique Machine')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_BACK_EXTENSION',
  '{"ko":"백 익스텐션","en":"Back Extension"}'::jsonb,
  'core',
  710,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'core', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_BACK_EXTENSION'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Back Extension', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_BACK_EXTENSION'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Back Extension')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Lower Back', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_BACK_EXTENSION'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Lower Back')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_HIP_EXTENSION',
  '{"ko":"힙 익스텐션","en":"Hip Extension"}'::jsonb,
  'core',
  720,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'core', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_HIP_EXTENSION'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Hip Extension', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_HIP_EXTENSION'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Hip Extension')
  );


INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_ABS_BACK_COMBO',
  '{"ko":"복근 / 허리 복합 머신","en":"Abs / Back Combo"}'::jsonb,
  'core',
  730,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'core', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_ABS_BACK_COMBO'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Abs Back Combo', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ABS_BACK_COMBO'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Abs Back Combo')
  );

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', FALSE, 20
FROM standard_machine_types t WHERE t.code = 'STD_ABS_BACK_COMBO'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;

INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_CABLE_CROSSOVER',
  '{"ko":"케이블 크로스오버","en":"Cable Crossover"}'::jsonb,
  'chest',
  740,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'chest', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_CABLE_CROSSOVER'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Cable Crossover', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_CABLE_CROSSOVER'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Cable Crossover')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '케이블 크로스', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_CABLE_CROSSOVER'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('케이블 크로스')
  );

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'shoulders', FALSE, 10
FROM standard_machine_types t WHERE t.code = 'STD_CABLE_CROSSOVER'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;

INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_DUAL_ADJUSTABLE_PULLEY',
  '{"ko":"듀얼 어저스터블 풀리","en":"Dual Adjustable Pulley"}'::jsonb,
  'full_body',
  750,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'full_body', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_DUAL_ADJUSTABLE_PULLEY'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Dual Adjustable Pulley', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_DUAL_ADJUSTABLE_PULLEY'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Dual Adjustable Pulley')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'DAP', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_DUAL_ADJUSTABLE_PULLEY'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('DAP')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Functional Trainer', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_DUAL_ADJUSTABLE_PULLEY'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Functional Trainer')
  );

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', FALSE, 10
FROM standard_machine_types t WHERE t.code = 'STD_DUAL_ADJUSTABLE_PULLEY'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;
INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'chest', FALSE, 20
FROM standard_machine_types t WHERE t.code = 'STD_DUAL_ADJUSTABLE_PULLEY'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;
INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'shoulders', FALSE, 30
FROM standard_machine_types t WHERE t.code = 'STD_DUAL_ADJUSTABLE_PULLEY'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;
INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'arms', FALSE, 40
FROM standard_machine_types t WHERE t.code = 'STD_DUAL_ADJUSTABLE_PULLEY'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;

INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_MULTI_JUNGLE_GYM',
  '{"ko":"멀티 정글짐","en":"Multi Jungle Gym"}'::jsonb,
  'full_body',
  760,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'full_body', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_MULTI_JUNGLE_GYM'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Jungle Gym', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_MULTI_JUNGLE_GYM'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Jungle Gym')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Multi Station', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_MULTI_JUNGLE_GYM'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Multi Station')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '정글짐', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_MULTI_JUNGLE_GYM'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('정글짐')
  );

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', FALSE, 10
FROM standard_machine_types t WHERE t.code = 'STD_MULTI_JUNGLE_GYM'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;
INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'chest', FALSE, 20
FROM standard_machine_types t WHERE t.code = 'STD_MULTI_JUNGLE_GYM'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;
INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'shoulders', FALSE, 30
FROM standard_machine_types t WHERE t.code = 'STD_MULTI_JUNGLE_GYM'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;
INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'arms', FALSE, 40
FROM standard_machine_types t WHERE t.code = 'STD_MULTI_JUNGLE_GYM'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;
INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', FALSE, 50
FROM standard_machine_types t WHERE t.code = 'STD_MULTI_JUNGLE_GYM'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;

INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_ASSISTED_PULLUP_DIP',
  '{"ko":"어시스트 풀업 / 딥","en":"Assisted Pull-Up / Dip"}'::jsonb,
  'full_body',
  770,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'full_body', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_ASSISTED_PULLUP_DIP'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Assisted Pull Up Dip', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ASSISTED_PULLUP_DIP'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Assisted Pull Up Dip')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Assist Combo', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_ASSISTED_PULLUP_DIP'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Assist Combo')
  );

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', FALSE, 10
FROM standard_machine_types t WHERE t.code = 'STD_ASSISTED_PULLUP_DIP'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;
INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'chest', FALSE, 20
FROM standard_machine_types t WHERE t.code = 'STD_ASSISTED_PULLUP_DIP'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;
INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'triceps', FALSE, 30
FROM standard_machine_types t WHERE t.code = 'STD_ASSISTED_PULLUP_DIP'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;

INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_SMITH_MACHINE',
  '{"ko":"스미스 머신","en":"Smith Machine"}'::jsonb,
  'full_body',
  780,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'full_body', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_SMITH_MACHINE'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Smith Machine', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_SMITH_MACHINE'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Smith Machine')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, '스미스', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_SMITH_MACHINE'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('스미스')
  );

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', FALSE, 10
FROM standard_machine_types t WHERE t.code = 'STD_SMITH_MACHINE'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;
INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'chest', FALSE, 20
FROM standard_machine_types t WHERE t.code = 'STD_SMITH_MACHINE'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;
INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'shoulders', FALSE, 30
FROM standard_machine_types t WHERE t.code = 'STD_SMITH_MACHINE'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;

INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_POWER_RACK',
  '{"ko":"파워 랙","en":"Power Rack"}'::jsonb,
  'full_body',
  790,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'full_body', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_POWER_RACK'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Power Rack', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_POWER_RACK'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Power Rack')
  );
INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Power Cage', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_POWER_RACK'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Power Cage')
  );

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', FALSE, 10
FROM standard_machine_types t WHERE t.code = 'STD_POWER_RACK'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;
INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', FALSE, 20
FROM standard_machine_types t WHERE t.code = 'STD_POWER_RACK'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;
INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'chest', FALSE, 30
FROM standard_machine_types t WHERE t.code = 'STD_POWER_RACK'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;
INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'shoulders', FALSE, 40
FROM standard_machine_types t WHERE t.code = 'STD_POWER_RACK'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;

INSERT INTO standard_machine_types (code, name, primary_muscle_group, sort_order, is_active)
VALUES (
  'STD_HALF_RACK',
  '{"ko":"하프 랙","en":"Half Rack"}'::jsonb,
  'full_body',
  800,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle_group = EXCLUDED.primary_muscle_group,
  sort_order = CASE WHEN standard_machine_types.sort_order = 0 THEN EXCLUDED.sort_order ELSE standard_machine_types.sort_order END,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'full_body', TRUE, 0
FROM standard_machine_types t WHERE t.code = 'STD_HALF_RACK'
ON CONFLICT (standard_type_id, muscle_group) DO UPDATE SET is_primary = TRUE;

INSERT INTO standard_machine_aliases (standard_type_id, alias, locale)
SELECT t.id, 'Half Rack', NULL
FROM standard_machine_types t
WHERE t.code = 'STD_HALF_RACK'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases a
    WHERE a.standard_type_id = t.id AND lower(a.alias) = lower('Half Rack')
  );

INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'legs', FALSE, 10
FROM standard_machine_types t WHERE t.code = 'STD_HALF_RACK'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;
INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'back', FALSE, 20
FROM standard_machine_types t WHERE t.code = 'STD_HALF_RACK'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;
INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'chest', FALSE, 30
FROM standard_machine_types t WHERE t.code = 'STD_HALF_RACK'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;
INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
SELECT t.id, 'shoulders', FALSE, 40
FROM standard_machine_types t WHERE t.code = 'STD_HALF_RACK'
ON CONFLICT (standard_type_id, muscle_group) DO NOTHING;

-- ===== Soft-link existing catalog machines (only when unset) =====
UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'HS_ISO_LATERAL_HIGH_ROW'
  AND t.code = 'STD_ISO_LATERAL_HIGH_ROW'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'HS_SELECTORIZED_CHEST_PRESS'
  AND t.code = 'STD_CHEST_PRESS'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'HS_LEG_EXTENSION'
  AND t.code = 'STD_LEG_EXTENSION'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'HS_LEG_CURL'
  AND t.code = 'STD_SEATED_LEG_CURL'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'HS_SHOULDER_PRESS'
  AND t.code = 'STD_SHOULDER_PRESS'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'HS_ISO_LATERAL_ROW'
  AND t.code = 'STD_ISO_LATERAL_ROW'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'HS_ISO_LATERAL_CHEST_PRESS'
  AND t.code = 'STD_ISO_LATERAL_CHEST_PRESS'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'HS_ISO_LATERAL_INCLINE_CHEST_PRESS'
  AND t.code = 'STD_INCLINE_CHEST_PRESS'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'HS_LAT_PULLDOWN'
  AND t.code = 'STD_LAT_PULLDOWN'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'HS_LEG_PRESS'
  AND t.code = 'STD_LEG_PRESS'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'HS_V_SQUAT'
  AND t.code = 'STD_SQUAT_PRESS'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'HS_PEC_FLY'
  AND t.code = 'STD_PEC_DECK'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'HS_BICEPS_CURL'
  AND t.code = 'STD_BICEPS_CURL'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'HS_TRICEPS_EXTENSION'
  AND t.code = 'STD_TRICEPS_EXTENSION'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'LF_CHEST_PRESS'
  AND t.code = 'STD_CHEST_PRESS'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'LF_SHOULDER_PRESS'
  AND t.code = 'STD_SHOULDER_PRESS'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'LF_LAT_PULLDOWN'
  AND t.code = 'STD_LAT_PULLDOWN'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'LF_SEATED_ROW'
  AND t.code = 'STD_SEATED_ROW'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'LF_LEG_PRESS'
  AND t.code = 'STD_LEG_PRESS'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'LF_LEG_EXTENSION'
  AND t.code = 'STD_LEG_EXTENSION'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'LF_LEG_CURL'
  AND t.code = 'STD_SEATED_LEG_CURL'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'LF_PEC_FLY'
  AND t.code = 'STD_PEC_DECK'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'LF_ABDOMINAL'
  AND t.code = 'STD_ABDOMINAL'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'LF_BACK_EXTENSION'
  AND t.code = 'STD_BACK_EXTENSION'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'LF_BICEPS_CURL'
  AND t.code = 'STD_BICEPS_CURL'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'LF_TRICEPS_PRESS'
  AND t.code = 'STD_TRICEPS_PRESS'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'CY_CHEST_PRESS'
  AND t.code = 'STD_CHEST_PRESS'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'CY_SHOULDER_PRESS'
  AND t.code = 'STD_SHOULDER_PRESS'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'CY_LAT_PULLDOWN'
  AND t.code = 'STD_LAT_PULLDOWN'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'CY_SEATED_ROW'
  AND t.code = 'STD_SEATED_ROW'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'CY_LEG_PRESS'
  AND t.code = 'STD_LEG_PRESS'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'CY_LEG_EXTENSION'
  AND t.code = 'STD_LEG_EXTENSION'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'CY_LEG_CURL'
  AND t.code = 'STD_SEATED_LEG_CURL'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'CY_PEC_FLY'
  AND t.code = 'STD_PEC_DECK'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'CY_ABDOMINAL'
  AND t.code = 'STD_ABDOMINAL'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'CY_BACK_EXTENSION'
  AND t.code = 'STD_BACK_EXTENSION'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'CY_BICEPS_CURL'
  AND t.code = 'STD_BICEPS_CURL'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'CY_TRICEPS_EXTENSION'
  AND t.code = 'STD_TRICEPS_EXTENSION'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'TG_CHEST_PRESS'
  AND t.code = 'STD_CHEST_PRESS'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'TG_SHOULDER_PRESS'
  AND t.code = 'STD_SHOULDER_PRESS'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'TG_LAT_MACHINE'
  AND t.code = 'STD_LAT_PULLDOWN'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'TG_LOW_ROW'
  AND t.code = 'STD_LOW_ROW'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'TG_LEG_PRESS'
  AND t.code = 'STD_LEG_PRESS'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'TG_LEG_EXTENSION'
  AND t.code = 'STD_LEG_EXTENSION'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'TG_LEG_CURL'
  AND t.code = 'STD_SEATED_LEG_CURL'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'TG_PEC_FLY'
  AND t.code = 'STD_PEC_DECK'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'TG_ABDOMINAL'
  AND t.code = 'STD_ABDOMINAL'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'TG_LOWER_BACK'
  AND t.code = 'STD_BACK_EXTENSION'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'TG_BICEPS_CURL'
  AND t.code = 'STD_BICEPS_CURL'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'TG_TRICEPS_EXTENSION'
  AND t.code = 'STD_TRICEPS_EXTENSION'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'FW_SMITH'
  AND t.code = 'STD_SMITH_MACHINE'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'FW_CABLE'
  AND t.code = 'STD_DUAL_ADJUSTABLE_PULLEY'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'BW_PULL_UP'
  AND t.code = 'STD_ASSISTED_PULLUP'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'BW_CHIN_UP'
  AND t.code = 'STD_ASSISTED_PULLUP'
  AND m.standard_type_id IS NULL;

UPDATE machines m
SET standard_type_id = t.id, updated_at = NOW()
FROM standard_machine_types t
WHERE m.code = 'BW_DIPS'
  AND t.code = 'STD_DIP_MACHINE'
  AND m.standard_type_id IS NULL;
