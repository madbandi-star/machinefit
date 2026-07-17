-- Bodyweight brand with pull-up, chin-up, dips, and push-up
INSERT INTO brands (code, name, is_active) VALUES
  ('BODYWEIGHT', '{"ko":"맨몸운동","en":"Bodyweight","ja":"自重トレ","zh":"自重训练"}', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO machines (brand_id, code, name, muscle_group, machine_type, has_seat, has_back_pad, has_foot_plate, has_handle, rom_type, is_active)
SELECT b.id, v.code, v.name::jsonb, v.muscle_group, v.machine_type, v.has_seat, v.has_back_pad, v.has_foot_plate, v.has_handle, v.rom_type, true
FROM brands b
CROSS JOIN (VALUES
  ('BODYWEIGHT', 'BW_PULL_UP', '{"ko":"풀업","en":"Pull-up","ja":"懸垂","zh":"引体向上"}', 'back', 'bodyweight', false, false, false, true, 'full'),
  ('BODYWEIGHT', 'BW_CHIN_UP', '{"ko":"친업","en":"Chin-up","ja":"チンアップ","zh":"反手引体"}', 'back', 'bodyweight', false, false, false, true, 'full'),
  ('BODYWEIGHT', 'BW_DIPS', '{"ko":"딥스","en":"Dips","ja":"ディップス","zh":"双杠臂屈伸"}', 'chest', 'bodyweight', false, false, false, true, 'full'),
  ('BODYWEIGHT', 'BW_PUSH_UP', '{"ko":"푸쉬업","en":"Push-up","ja":"プッシュアップ","zh":"俯卧撑"}', 'chest', 'bodyweight', false, false, false, false, 'full')
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
  ('BW_PULL_UP', 'male', 'intermediate', 160, 190, 'full', NULL,
    '{"en":["Start from a dead hang","Pull chest toward the bar"],"ko":["데드행에서 시작","가슴을 바 쪽으로 당기기"],"ja":["デッドハングから開始","胸をバーに引き寄せる"],"zh":["从悬垂开始","将胸部拉向横杆"]}',
    '{"en":["Avoid kipping if focusing on strength"],"ko":["근력 위주면 키핑 피하기"],"ja":["筋力重視ならキップを避ける"],"zh":["侧重力量时避免借力摆动"]}'),
  ('BW_PULL_UP', 'female', 'intermediate', 150, 180, 'full', NULL,
    '{"en":["Use assisted band if needed","Full range at the top"],"ko":["필요하면 밴드 보조 사용","상단까지 가동범위 확보"],"ja":["必要ならバンド補助","上まで可動域確保"],"zh":["必要时使用弹力带辅助","顶端充分伸展"]}',
    '{"en":["Do not drop from the bar suddenly"],"ko":["바에서 갑자기 떨어지지 마세요"],"ja":["バーから急に離れない"],"zh":["不要突然松手落下"]}'),
  ('BW_CHIN_UP', 'male', 'intermediate', 160, 190, 'full', NULL,
    '{"en":["Use supinated grip","Keep elbows close to body"],"ko":["손바닥 자신 쪽 그립","팔꿈치를 몸 가까이"],"ja":["手のひらを自分側に","肘を体の近くに"],"zh":["采用反手抓握","肘部贴近身体"]}',
    '{"en":["Do not swing the torso"],"ko":["상체를 흔들지 마세요"],"ja":["体幹を揺らさない"],"zh":["不要摆动躯干"]}'),
  ('BW_CHIN_UP', 'female', 'intermediate', 150, 180, 'full', NULL,
    '{"en":["Control the lowering phase","Squeeze at the top"],"ko":["하강 구간 컨트롤","상단에서 짧게 멈춤"],"ja":["下ろす動作をコントロール","上で一瞬キープ"],"zh":["控制下降","顶端短暂停顿"]}',
    '{"en":["Avoid wrist strain with neutral grip if needed"],"ko":["필요하면 중립 그립으로 손목 부담 줄이기"],"ja":["必要ならニュートラルグリップで手首負担軽減"],"zh":["必要时用中立握法减轻手腕负担"]}'),
  ('BW_DIPS', 'male', 'intermediate', 160, 190, 'full', NULL,
    '{"en":["Keep shoulders down on descent","Lean slightly forward for chest focus"],"ko":["하강 시 어깨 내리기","가슴 자극을 위해 약간 숙이기"],"ja":["下ろす時は肩を下げる","胸に効かせるためやや前傾"],"zh":["下降时沉肩","略前倾以刺激胸部"]}',
    '{"en":["Stop if shoulder pain occurs"],"ko":["어깨 통증 시 즉시 중단"],"ja":["肩に痛みがあれば中止"],"zh":["肩部疼痛时立即停止"]}'),
  ('BW_DIPS', 'female', 'intermediate', 150, 180, 'full', NULL,
    '{"en":["Use bench or band assistance if needed","Do not lock elbows hard"],"ko":["필요하면 벤치·밴드 보조","팔꿈치 과신전 금지"],"ja":["必要ならベンチやバンド補助","肘を強く伸ばし切らない"],"zh":["必要时用凳或弹力带辅助","不要过度锁肘"]}',
    '{"en":["Avoid dropping into the bottom"],"ko":["하단에서 떨어지듯 내려가지 마세요"],"ja":["下で落ち込まない"],"zh":["不要在底部砸落"]}'),
  ('BW_PUSH_UP', 'male', 'intermediate', 160, 190, 'full', NULL,
    '{"en":["Keep body in a straight line","Lower chest near the floor"],"ko":["몸을 일자로 유지","가슴을 바닥 가까이"],"ja":["体を一直線に","胸を床近くまで"],"zh":["身体保持一条直线","胸部接近地面"]}',
    '{"en":["Do not sag the hips"],"ko":["엉덩이가 처지지 않게"],"ja":["腰が落ちないように"],"zh":["不要塌腰"]}'),
  ('BW_PUSH_UP', 'female', 'intermediate', 150, 180, 'full', NULL,
    '{"en":["Incline on bench if needed","Hands slightly wider than shoulders"],"ko":["필요하면 벤치 인클라인","손을 어깨보다 약간 넓게"],"ja":["必要ならベンチインクライン","手を肩よりやや広く"],"zh":["必要时做上斜俯卧撑","手略宽于肩"]}',
    '{"en":["Keep neck neutral"],"ko":["목 중립 유지"],"ja":["首をニュートラルに"],"zh":["保持颈部中立"]}')
) AS v(code, gender, experience_level, height_min, height_max, rom_setting, weight_kg, tips, warnings)
WHERE m.code = v.code;
