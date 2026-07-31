-- Update Hammer Strength primary catalog images to packaged PNG covers,
-- and ensure Incline Chest Press / V-Squat rows exist for the new photos.

-- 1) Point existing primary machine_images at PNG assets (stale .svg → .png).
UPDATE machine_images mi
SET image_url = v.image_url,
    updated_at = NOW()
FROM machines m
JOIN (VALUES
  ('HS_ISO_LATERAL_HIGH_ROW', '/machinefit/assets/machines/hammer_strength/hs_iso_lateral_high_row.png'),
  ('HS_ISO_LATERAL_ROW', '/machinefit/assets/machines/hammer_strength/hs_iso_lateral_row.png'),
  ('HS_LAT_PULLDOWN', '/machinefit/assets/machines/hammer_strength/hs_lat_pulldown.png'),
  ('HS_ISO_LATERAL_CHEST_PRESS', '/machinefit/assets/machines/hammer_strength/hs_iso_lateral_chest_press.png'),
  ('HS_ISO_LATERAL_INCLINE_CHEST_PRESS', '/machinefit/assets/machines/hammer_strength/hs_iso_lateral_incline_chest_press.png'),
  ('HS_SHOULDER_PRESS', '/machinefit/assets/machines/hammer_strength/hs_shoulder_press.png'),
  ('HS_LEG_PRESS', '/machinefit/assets/machines/hammer_strength/hs_leg_press.png'),
  ('HS_LEG_EXTENSION', '/machinefit/assets/machines/hammer_strength/hs_leg_extension.png'),
  ('HS_LEG_CURL', '/machinefit/assets/machines/hammer_strength/hs_leg_curl.png'),
  ('HS_V_SQUAT', '/machinefit/assets/machines/hammer_strength/hs_v_squat.png')
) AS v(code, image_url)
  ON m.code = v.code
WHERE mi.machine_id = m.id
  AND mi.is_primary = true
  AND mi.image_url IS DISTINCT FROM v.image_url;

-- 2) Insert missing HS machines (Incline / V-Squat) if brand exists and code missing.
INSERT INTO machines (
  brand_id, code, name, muscle_group, machine_type,
  has_seat, has_back_pad, has_foot_plate, has_handle, rom_type,
  description, is_active
)
SELECT
  b.id,
  v.code,
  v.name::jsonb,
  v.muscle_group,
  v.machine_type,
  v.has_seat,
  v.has_back_pad,
  v.has_foot_plate,
  v.has_handle,
  v.rom_type,
  v.description::jsonb,
  true
FROM brands b
JOIN (VALUES
  (
    'HS_ISO_LATERAL_INCLINE_CHEST_PRESS',
    '{"ko":"아이소 레터럴 인클라인 체스트 프레스","en":"Iso-Lateral Incline Chest Press","ja":"アイソラテラルインクラインチェストプレス","zh":"等轴上斜胸部推举"}',
    'chest',
    'plate_loaded',
    true, true, false, true, 'variable',
    '{"ko":"아이소 레터럴 인클라인 체스트 프레스는 상부 가슴을 중심으로 삼두와 앞어깨까지 함께 쓰는 플레이트 로디드 머신입니다.","en":"The Iso-Lateral Incline Chest Press is a plate-loaded machine that targets the upper chest while also involving the triceps and front delts."}'
  ),
  (
    'HS_V_SQUAT',
    '{"ko":"브이 스쿼트","en":"V-Squat","ja":"Vスクワット","zh":"V型深蹲"}',
    'legs',
    'plate_loaded',
    true, true, true, true, 'variable',
    '{"ko":"브이 스쿼트는 허벅지와 둔근을 중심으로 햄스트링까지 함께 쓰는 플레이트 로디드 머신입니다.","en":"The V-Squat is a plate-loaded machine that targets the quads and glutes while also involving the hamstrings."}'
  )
) AS v(code, name, muscle_group, machine_type, has_seat, has_back_pad, has_foot_plate, has_handle, rom_type, description)
  ON b.code = 'HAMMER_STRENGTH'
WHERE NOT EXISTS (
  SELECT 1 FROM machines m WHERE m.code = v.code
);

-- 3) Ensure primary images for Incline / V-Squat.
INSERT INTO machine_images (machine_id, image_url, alt_text, sort_order, is_primary)
SELECT m.id, v.image_url, v.alt_text::jsonb, 0, true
FROM machines m
JOIN (VALUES
  ('HS_ISO_LATERAL_INCLINE_CHEST_PRESS', '/machinefit/assets/machines/hammer_strength/hs_iso_lateral_incline_chest_press.png', '{"ko":"아이소 레터럴 인클라인 체스트 프레스","en":"Iso-Lateral Incline Chest Press"}'),
  ('HS_V_SQUAT', '/machinefit/assets/machines/hammer_strength/hs_v_squat.png', '{"ko":"브이 스쿼트","en":"V-Squat"}')
) AS v(code, image_url, alt_text)
  ON m.code = v.code
WHERE NOT EXISTS (
  SELECT 1 FROM machine_images mi
  WHERE mi.machine_id = m.id AND mi.is_primary = true
);
