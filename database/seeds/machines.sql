-- Machines seed (requires brands)
INSERT INTO machines (brand_id, code, name, muscle_group, machine_type, has_seat, has_back_pad, has_foot_plate, has_handle, rom_type, is_active)
SELECT b.id, v.code, v.name::jsonb, v.muscle_group, v.machine_type, v.has_seat, v.has_back_pad, v.has_foot_plate, v.has_handle, v.rom_type, true
FROM brands b
CROSS JOIN (VALUES
  ('HAMMER_STRENGTH', 'HS_ISO_LATERAL_HIGH_ROW', '{"ko":"아이소 레터럴 하이 로우","en":"Iso-Lateral High Row","ja":"アイソラテラルハイロー","zh":"等轴高位拉"}', 'back', 'plate_loaded', true, true, false, true, 'variable'),
  ('HAMMER_STRENGTH', 'HS_SELECTORIZED_CHEST_PRESS', '{"ko":"셀렉터라이즈드 체스트 프레스","en":"Selectorized Chest Press","ja":"セレクタライズドチェストプレス","zh":"选择式胸部推举"}', 'chest', 'selectorized', true, true, false, true, 'fixed'),
  ('HAMMER_STRENGTH', 'HS_LEG_EXTENSION', '{"ko":"레그 익스텐션","en":"Leg Extension","ja":"レッグエクステンション","zh":"腿部伸展"}', 'legs', 'selectorized', true, true, true, false, 'fixed'),
  ('HAMMER_STRENGTH', 'HS_LEG_CURL', '{"ko":"레그 컬","en":"Leg Curl","ja":"レッグカール","zh":"腿部弯举"}', 'legs', 'selectorized', true, true, true, false, 'fixed'),
  ('HAMMER_STRENGTH', 'HS_SHOULDER_PRESS', '{"ko":"숄더 프레스","en":"Shoulder Press","ja":"ショルダープレス","zh":"肩部推举"}', 'shoulders', 'plate_loaded', true, true, false, true, 'variable')
) AS v(brand_code, code, name, muscle_group, machine_type, has_seat, has_back_pad, has_foot_plate, has_handle, rom_type)
WHERE b.code = v.brand_code
ON CONFLICT (code) DO NOTHING;
