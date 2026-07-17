-- Free Weight brand with dumbbell and barbell
INSERT INTO brands (code, name, is_active) VALUES
  ('FREE_WEIGHT', '{"ko":"프리웨이트","en":"Free Weight","ja":"フリーウェイト","zh":"自由重量"}', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO machines (brand_id, code, name, muscle_group, machine_type, has_seat, has_back_pad, has_foot_plate, has_handle, rom_type, is_active)
SELECT b.id, v.code, v.name::jsonb, v.muscle_group, v.machine_type, v.has_seat, v.has_back_pad, v.has_foot_plate, v.has_handle, v.rom_type, true
FROM brands b
CROSS JOIN (VALUES
  ('FREE_WEIGHT', 'FW_DUMBBELL', '{"ko":"덤벨","en":"Dumbbell","ja":"ダンベル","zh":"哑铃"}', 'shoulders', 'free_weight', false, false, false, true, 'variable'),
  ('FREE_WEIGHT', 'FW_BARBELL', '{"ko":"바벨","en":"Barbell","ja":"バーベル","zh":"杠铃"}', 'chest', 'free_weight', false, false, false, true, 'variable')
) AS v(brand_code, code, name, muscle_group, machine_type, has_seat, has_back_pad, has_foot_plate, has_handle, rom_type)
WHERE b.code = v.brand_code
ON CONFLICT (code) DO NOTHING;

INSERT INTO machine_settings (
  machine_id, gender, experience_level,
  height_min_cm, height_max_cm,
  seat_position, back_pad_position, foot_position, handle_position,
  rom_setting, weight_kg, tips, warnings
)
SELECT m.id, v.gender, v.experience_level,
  v.height_min, v.height_max,
  NULL, NULL, NULL, NULL,
  v.rom_setting, v.weight_kg::numeric, v.tips::jsonb, v.warnings::jsonb
FROM machines m
CROSS JOIN (VALUES
  ('FW_DUMBBELL', 'male', 'intermediate', 160, 190, 'full', 12,
    '{"en":["Choose a weight you can control for your target reps","Keep wrists neutral"],"ko":["목표 횟수를 컨트롤할 수 있는 중량 선택","손목 중립 유지"],"ja":["目標回数をコントロールできる重量を選ぶ","手首をニュートラルに"],"zh":["选择能控制目标次数的重量","保持手腕中立"]}',
    '{"en":["Do not drop dumbbells from height"],"ko":["덤벨을 높은 곳에서 떨어뜨리지 마세요"],"ja":["ダンベルを高い位置から落とさない"],"zh":["不要从高处扔下哑铃"]}'),
  ('FW_DUMBBELL', 'female', 'intermediate', 150, 180, 'full', 8,
    '{"en":["Start lighter and focus on form","Control the lowering phase"],"ko":["가벼운 중량으로 폼에 집중","하강 구간을 천천히"],"ja":["軽めから始めフォームに集中","下ろす動作をゆっくり"],"zh":["从轻重量开始注重动作","缓慢控制下降"]}',
    '{"en":["Avoid swinging the weights"],"ko":["무게를 흔들어 반동 쓰지 마세요"],"ja":["反動で振らない"],"zh":["不要借力摆动"]}'),
  ('FW_BARBELL', 'male', 'intermediate', 160, 190, 'full', 40,
    '{"en":["Use collars on both sides","Brace core before each set"],"ko":["양쪽에 칼라 고정","세트 전 코어 브레이싱"],"ja":["両側にカラーで固定","セット前にコアを固める"],"zh":["两侧使用卡扣","每组前收紧核心"]}',
    '{"en":["Do not lift without spotter on heavy sets if unsure"],"ko":["무거운 중량은 보조 없이 무리하지 마세요"],"ja":["重い重量は無理に一人で行わない"],"zh":["大重量不确定时不要独自训练"]}'),
  ('FW_BARBELL', 'female', 'intermediate', 150, 180, 'full', 25,
    '{"en":["Grip width comfortable for your shoulders","Control bar path"],"ko":["어깨에 편한 그립 너비","바 경로를 컨트롤"],"ja":["肩に合ったグリップ幅","バーの軌道をコントロール"],"zh":["选择肩部舒适的握距","控制杠铃轨迹"]}',
    '{"en":["Avoid bouncing the bar"],"ko":["바를 튕기지 마세요"],"ja":["バーを弾ませない"],"zh":["不要让杠铃反弹"]}')
) AS v(code, gender, experience_level, height_min, height_max, rom_setting, weight_kg, tips, warnings)
WHERE m.code = v.code;
