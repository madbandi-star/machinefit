-- Machine settings seed (recommendation rules)
INSERT INTO machine_settings (
  machine_id, gender, experience_level,
  height_min_cm, height_max_cm,
  seat_position, back_pad_position, foot_position, handle_position,
  rom_setting, weight_kg, tips, warnings
)
SELECT m.id, v.gender, v.experience_level,
  v.height_min, v.height_max,
  v.seat_pos, v.back_pad_pos, v.foot_pos, v.handle_pos,
  v.rom_setting, v.weight_kg, v.tips::jsonb, v.warnings::jsonb
FROM machines m
CROSS JOIN (VALUES
  -- HS_ISO_LATERAL_HIGH_ROW
  ('HS_ISO_LATERAL_HIGH_ROW', 'male', 'beginner', 160, 170, 3, 2, NULL, 1, 'full', 25,
    '{"en":["Keep chest against pad","Use controlled tempo"],"ko":["가슴을 패드에 밀착","천천히 컨트롤하며 수행"]}',
    '{"en":["Do not round lower back"],"ko":["허리를 굽히지 마세요"]}'),
  ('HS_ISO_LATERAL_HIGH_ROW', 'male', 'intermediate', 170, 180, 5, 3, NULL, 2, 'full', 40,
    '{"en":["Keep chest against pad","Pull elbows back in line with shoulders"],"ko":["가슴을 패드에 밀착","팔꿈치를 어깨 라인에 맞춰 당기기"]}',
    '{"en":["Do not round lower back"],"ko":["허리를 굽히지 마세요"]}'),
  ('HS_ISO_LATERAL_HIGH_ROW', 'male', 'advanced', 180, 190, 7, 4, NULL, 3, 'full', 55,
    '{"en":["Focus on scapular retraction","Full stretch at bottom"],"ko":["견갑골 수축에 집중","하단에서 충분히 스트레칭"]}',
    '{"en":["Avoid jerking the weight"],"ko":["무게를 급격히 당기지 마세요"]}'),
  ('HS_ISO_LATERAL_HIGH_ROW', 'female', 'intermediate', 155, 170, 4, 2, NULL, 1, 'full', 25,
    '{"en":["Adjust seat for comfortable reach","Squeeze at peak contraction"],"ko":["편안한 범위로 시트 조절","최고 수축 지점에서 짧게 멈춤"]}',
    '{"en":["Do not hyperextend elbows"],"ko":["팔꿈치를 과도하게 펴지 마세요"]}'),

  -- HS_SELECTORIZED_CHEST_PRESS
  ('HS_SELECTORIZED_CHEST_PRESS', 'male', 'intermediate', 170, 180, 4, 3, NULL, 2, 'full', 50,
    '{"en":["Retract shoulder blades","Press in slight arc"],"ko":["견갑골을 모으고","약간의 아크로 밀기"]}',
    '{"en":["Do not lock elbows aggressively"],"ko":["팔꿈치를 과도하게 잠그지 마세요"]}'),
  ('HS_SELECTORIZED_CHEST_PRESS', 'female', 'beginner', 150, 165, 3, 2, NULL, 1, 'full', 20,
    '{"en":["Keep wrists neutral","Control the negative"],"ko":["손목 중립 유지","하강 구간 컨트롤"]}',
    '{"en":["Avoid bouncing at bottom"],"ko":["하단에서 반동 사용 금지"]}'),

  -- HS_LEG_EXTENSION
  ('HS_LEG_EXTENSION', 'male', 'intermediate', 170, 180, 5, 4, 3, NULL, 'full', 45,
    '{"en":["Align knee with machine pivot","Pause at top"],"ko":["무릎을 머신 피벗에 맞추기","상단에서 잠시 멈춤"]}',
    '{"en":["Avoid hyperextension"],"ko":["과도한 신전 금지"]}'),
  ('HS_LEG_EXTENSION', 'female', 'intermediate', 155, 170, 4, 3, 2, NULL, 'full', 30,
    '{"en":["Point toes slightly inward for quad focus"],"ko":["발끝을 약간 안쪽으로"]}',
    '{"en":["Use lighter weight for warm-up sets"],"ko":["워밍업은 가벼운 중량으로"]}'),

  -- HS_LEG_CURL
  ('HS_LEG_CURL', 'male', 'intermediate', 170, 180, 5, 3, 4, NULL, 'full', 40,
    '{"en":["Keep hips pressed into pad","Full range of motion"],"ko":["엉덩이를 패드에 고정","전 가동범위 사용"]}',
    '{"en":["Do not lift hips"],"ko":["엉덩이를 들지 마세요"]}'),

  -- HS_SHOULDER_PRESS
  ('HS_SHOULDER_PRESS', 'male', 'intermediate', 170, 180, 5, 3, NULL, 2, 'variable', 35,
    '{"en":["Keep core braced","Do not arch lower back"],"ko":["코어 긴장 유지","허리 과신전 금지"]}',
    '{"en":["Stop if shoulder pain occurs"],"ko":["어깨 통증 시 즉시 중단"]}')
) AS v(machine_code, gender, experience_level, height_min, height_max, seat_pos, back_pad_pos, foot_pos, handle_pos, rom_setting, weight_kg, tips, warnings)
WHERE m.code = v.machine_code
ON CONFLICT DO NOTHING;
