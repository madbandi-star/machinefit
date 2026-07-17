-- Smith machine, cable, and kettlebell under Free Weight brand
INSERT INTO machines (brand_id, code, name, muscle_group, machine_type, has_seat, has_back_pad, has_foot_plate, has_handle, rom_type, is_active)
SELECT b.id, v.code, v.name::jsonb, v.muscle_group, v.machine_type, v.has_seat, v.has_back_pad, v.has_foot_plate, v.has_handle, v.rom_type, true
FROM brands b
CROSS JOIN (VALUES
  ('FREE_WEIGHT', 'FW_SMITH', '{"ko":"스미스 머신","en":"Smith Machine","ja":"スミスマシン","zh":"史密斯机"}', 'legs', 'smith', false, false, true, true, 'variable'),
  ('FREE_WEIGHT', 'FW_CABLE', '{"ko":"케이블","en":"Cable","ja":"ケーブル","zh":"绳索"}', 'back', 'cable', false, false, false, true, 'variable'),
  ('FREE_WEIGHT', 'FW_KETTLEBELL', '{"ko":"케틀벨","en":"Kettlebell","ja":"ケトルベル","zh":"壶铃"}', 'shoulders', 'free_weight', false, false, false, true, 'variable')
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
  ('FW_SMITH', 'male', 'intermediate', 160, 190, 'variable', 60,
    '{"en":["Lock safety stops before heavy sets","Keep bar path vertical"],"ko":["고중량 전에 안전 스토퍼 고정","바를 수직으로 이동"],"ja":["高重量前に安全ストッパーを固定","バーを垂直に動かす"],"zh":["大重量前固定安全挡","保持杠铃垂直路径"]}',
    '{"en":["Do not rotate wrists under load"],"ko":["하중 중 손목을 비틀지 마세요"],"ja":["負荷中に手首を捻らない"],"zh":["负重时不要扭动手腕"]}'),
  ('FW_SMITH', 'female', 'intermediate', 150, 180, 'variable', 35,
    '{"en":["Start with empty bar to find rack height","Feet shoulder-width apart"],"ko":["빈 바로 랙 높이 확인","발을 어깨 너비로"],"ja":["空バーでラック高さを確認","足を肩幅に"],"zh":["用空杆确认架高","双脚与肩同宽"]}',
    '{"en":["Avoid locking knees aggressively"],"ko":["무릎을 과도하게 잠그지 마세요"],"ja":["膝を強く伸ばし切らない"],"zh":["不要过度锁膝"]}'),
  ('FW_CABLE', 'male', 'intermediate', 160, 190, 'variable', 25,
    '{"en":["Stand stable before pulling","Control the return phase"],"ko":["당기기 전 자세 고정","복귀 구간 컨트롤"],"ja":["引く前に姿勢を固定","戻す動作をコントロール"],"zh":["拉动前站稳","控制回位阶段"]}',
    '{"en":["Avoid jerking the stack"],"ko":["무게 스택을 급격히 당기지 마세요"],"ja":["ウェイトスタックを急に引かない"],"zh":["不要猛拉配重"]}'),
  ('FW_CABLE', 'female', 'intermediate', 150, 180, 'variable', 15,
    '{"en":["Adjust pulley height for the exercise","Keep shoulders down"],"ko":["운동에 맞게 풀리 높이 조절","어깨 내리기"],"ja":["種目に合わせてプーリー高さ調整","肩を下げる"],"zh":["按动作调整滑轮高度","沉肩"]}',
    '{"en":["Do not lean back excessively"],"ko":["과도하게 상체를 젖히지 마세요"],"ja":["上体を過度に反らさない"],"zh":["不要过度后仰"]}'),
  ('FW_KETTLEBELL', 'male', 'intermediate', 160, 190, 'full', 16,
    '{"en":["Grip the handle firmly","Use hip drive on swings"],"ko":["손잡이를 단단히 잡기","스윙 시 엉덩이 힘 활용"],"ja":["ハンドルをしっかり握る","スイング時は股関節を使う"],"zh":["握紧把手","摆动时使用髋部发力"]}',
    '{"en":["Keep clearance around your body"],"ko":["주변에 충분한 공간 확보"],"ja":["周囲に十分なスペースを確保"],"zh":["确保周围有足够空间"]}'),
  ('FW_KETTLEBELL', 'female', 'intermediate', 150, 180, 'full', 12,
    '{"en":["Start with lighter bell for technique","Brace core on every rep"],"ko":["기술 연습은 가벼운 중량으로","매 반복마다 코어 긴장"],"ja":["技術練習は軽い重量から","毎レップでコアを固定"],"zh":["技术练习从轻重量开始","每次动作收紧核心"]}',
    '{"en":["Do not swing near others"],"ko":["주변 사람 근처에서 스윙하지 마세요"],"ja":["人の近くでスイングしない"],"zh":["不要在他人附近摆动"]}')
) AS v(code, gender, experience_level, height_min, height_max, rom_setting, weight_kg, tips, warnings)
WHERE m.code = v.code;
