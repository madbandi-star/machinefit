-- Squat, lunge, and Bulgarian split squat under Bodyweight brand
INSERT INTO machines (brand_id, code, name, muscle_group, machine_type, has_seat, has_back_pad, has_foot_plate, has_handle, rom_type, is_active)
SELECT b.id, v.code, v.name::jsonb, v.muscle_group, v.machine_type, v.has_seat, v.has_back_pad, v.has_foot_plate, v.has_handle, v.rom_type, true
FROM brands b
CROSS JOIN (VALUES
  ('BODYWEIGHT', 'BW_SQUAT', '{"ko":"스쿼트","en":"Squat","ja":"スクワット","zh":"深蹲"}', 'legs', 'bodyweight', false, false, true, false, 'full'),
  ('BODYWEIGHT', 'BW_LUNGE', '{"ko":"런지","en":"Lunge","ja":"ランジ","zh":"弓步"}', 'legs', 'bodyweight', false, false, true, false, 'full'),
  ('BODYWEIGHT', 'BW_BULGARIAN_SPLIT_SQUAT', '{"ko":"불가리안 스플릿스쿼트","en":"Bulgarian Split Squat","ja":"ブルガリアンスプリットスクワット","zh":"保加利亚分腿蹲"}', 'legs', 'bodyweight', false, false, true, false, 'full')
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
  v.rom_setting, v.weight_kg, v.tips::jsonb, v.warnings::jsonb
FROM machines m
CROSS JOIN (VALUES
  ('BW_SQUAT', 'male', 'intermediate', 160, 190, 'full', NULL,
    '{"en":["Keep knees in line with toes","Sit hips back and down"],"ko":["무릎을 발끝과 같은 방향","엉덩이를 뒤로 빼며 앉기"],"ja":["膝をつま先と同じ方向に","股関節を後ろに引いて下ろす"],"zh":["膝盖与脚尖同向","髋部后坐下"]}',
    '{"en":["Do not let knees cave inward"],"ko":["무릎이 안쪽으로 모이지 않게"],"ja":["膝が内側に入らないように"],"zh":["不要让膝盖内扣"]}'),
  ('BW_SQUAT', 'female', 'intermediate', 150, 180, 'full', NULL,
    '{"en":["Brace core before descending","Drive through heels to stand"],"ko":["하강 전 코어 긴장","발뒤꿈치로 일어서기"],"ja":["下ろす前にコアを固定","かかとで立ち上がる"],"zh":["下蹲前收紧核心","脚跟发力站起"]}',
    '{"en":["Avoid rounding the lower back"],"ko":["허리를 굽히지 마세요"],"ja":["腰を丸めない"],"zh":["不要弯腰弓背"]}'),
  ('BW_LUNGE', 'male', 'intermediate', 160, 190, 'full', NULL,
    '{"en":["Keep front knee over ankle","Torso upright"],"ko":["앞무릎을 발목 위에","상체 세우기"],"ja":["前膝を足首の上に","上体を起こす"],"zh":["前膝在脚踝上方","上身挺直"]}',
    '{"en":["Avoid pushing front knee too far forward"],"ko":["앞무릎이 과도하게 앞으로 나가지 않게"],"ja":["前膝が過度に前に出ないように"],"zh":["前膝不要过度前移"]}'),
  ('BW_LUNGE', 'female', 'intermediate', 150, 180, 'full', NULL,
    '{"en":["Step long enough for balance","Control the descent"],"ko":["균형을 위해 충분히 길게 스텝","하강 구간 컨트롤"],"ja":["バランスのため十分にステップ","下ろす動作をコントロール"],"zh":["步幅足够保持平衡","控制下降"]}',
    '{"en":["Do not bounce at the bottom"],"ko":["하단에서 반동 사용 금지"],"ja":["下で反動を使わない"],"zh":["不要在底部反弹"]}'),
  ('BW_BULGARIAN_SPLIT_SQUAT', 'male', 'intermediate', 160, 190, 'full', NULL,
    '{"en":["Rear foot on bench for balance","Lower until front thigh is parallel"],"ko":["뒷발을 벤치에 올려 균형","앞 허벅지가 수평까지"],"ja":["後ろ足をベンチに","前ももが水平まで"],"zh":["后脚放凳上保持平衡","前大腿蹲至水平"]}',
    '{"en":["Keep most weight on front leg"],"ko":["체중은 앞다리에 집중"],"ja":["体重は前足に"],"zh":["重心放在前腿"]}'),
  ('BW_BULGARIAN_SPLIT_SQUAT', 'female', 'intermediate', 150, 180, 'full', NULL,
    '{"en":["Adjust bench height for comfort","Pause briefly at bottom"],"ko":["편한 벤치 높이 조절","하단에서 잠시 멈춤"],"ja":["快適なベンチ高さに調整","下で一瞬止める"],"zh":["调整凳高至舒适","底部短暂停顿"]}',
    '{"en":["Avoid leaning too far forward"],"ko":["과도하게 앞으로 숙이지 마세요"],"ja":["過度に前傾しない"],"zh":["不要过度前倾"]}')
) AS v(code, gender, experience_level, height_min, height_max, rom_setting, weight_kg, tips, warnings)
WHERE m.code = v.code;
