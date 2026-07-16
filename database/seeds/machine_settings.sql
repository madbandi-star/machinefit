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
    '{"en":["Keep chest against pad","Use controlled tempo"],"ko":["가슴을 패드에 밀착","천천히 컨트롤하며 수행"],"ja":["胸をパッドに密着","テンポをコントロール"],"zh":["胸部贴紧垫子","控制节奏进行"]}',
    '{"en":["Do not round lower back"],"ko":["허리를 굽히지 마세요"],"ja":["腰を丸めない"],"zh":["不要弯腰弓背"]}'),
  ('HS_ISO_LATERAL_HIGH_ROW', 'male', 'intermediate', 170, 180, 5, 3, NULL, 2, 'full', 40,
    '{"en":["Keep chest against pad","Pull elbows back in line with shoulders"],"ko":["가슴을 패드에 밀착","팔꿈치를 어깨 라인에 맞춰 당기기"],"ja":["胸をパッドに密着","肘を肩のラインに合わせて引く"],"zh":["胸部贴紧垫子","肘部与肩部对齐后拉"]}',
    '{"en":["Do not round lower back"],"ko":["허리를 굽히지 마세요"],"ja":["腰を丸めない"],"zh":["不要弯腰弓背"]}'),
  ('HS_ISO_LATERAL_HIGH_ROW', 'male', 'advanced', 180, 190, 7, 4, NULL, 3, 'full', 55,
    '{"en":["Focus on scapular retraction","Full stretch at bottom"],"ko":["견갑골 수축에 집중","하단에서 충분히 스트레칭"],"ja":["肩甲骨の収縮に集中","下で十分にストレッチ"],"zh":["专注于肩胛骨收紧","在底部充分拉伸"]}',
    '{"en":["Avoid jerking the weight"],"ko":["무게를 급격히 당기지 마세요"],"ja":["重量を急に引かない"],"zh":["不要猛拉重量"]}'),
  ('HS_ISO_LATERAL_HIGH_ROW', 'female', 'intermediate', 155, 170, 4, 2, NULL, 1, 'full', 25,
    '{"en":["Adjust seat for comfortable reach","Squeeze at peak contraction"],"ko":["편안한 범위로 시트 조절","최고 수축 지점에서 짧게 멈춤"],"ja":["届きやすい位置にシートを調整","最大収縮で一瞬キープ"],"zh":["调整座椅至舒适范围","在最大收缩处短暂停顿"]}',
    '{"en":["Do not hyperextend elbows"],"ko":["팔꿈치를 과도하게 펴지 마세요"],"ja":["肘を過度に伸ばさない"],"zh":["不要过度伸直肘部"]}'),

  -- HS_SELECTORIZED_CHEST_PRESS
  ('HS_SELECTORIZED_CHEST_PRESS', 'male', 'intermediate', 170, 180, 4, 3, NULL, 2, 'full', 50,
    '{"en":["Retract shoulder blades","Press in slight arc"],"ko":["견갑골을 모으고","약간의 아크로 밀기"],"ja":["肩甲骨を寄せる","ややアークを描いて押す"],"zh":["收紧肩胛骨","以轻微弧线推出"]}',
    '{"en":["Do not lock elbows aggressively"],"ko":["팔꿈치를 과도하게 잠그지 마세요"],"ja":["肘を強く伸ばし切らない"],"zh":["不要过度锁死肘部"]}'),
  ('HS_SELECTORIZED_CHEST_PRESS', 'female', 'beginner', 150, 165, 3, 2, NULL, 1, 'full', 20,
    '{"en":["Keep wrists neutral","Control the negative"],"ko":["손목 중립 유지","하강 구간 컨트롤"],"ja":["手首をニュートラルに","下ろす動作をコントロール"],"zh":["保持手腕中立","控制下降阶段"]}',
    '{"en":["Avoid bouncing at bottom"],"ko":["하단에서 반동 사용 금지"],"ja":["下で反動を使わない"],"zh":["不要在底部反弹"]}'),

  -- HS_LEG_EXTENSION
  ('HS_LEG_EXTENSION', 'male', 'intermediate', 170, 180, 5, 4, 3, NULL, 'full', 45,
    '{"en":["Align knee with machine pivot","Pause at top"],"ko":["무릎을 머신 피벗에 맞추기","상단에서 잠시 멈춤"],"ja":["膝をマシンのピボットに合わせる","上で一瞬止める"],"zh":["膝盖对准器械 pivot","在顶端短暂停顿"]}',
    '{"en":["Avoid hyperextension"],"ko":["과도한 신전 금지"],"ja":["過度な伸展を避ける"],"zh":["避免过度伸展"]}'),
  ('HS_LEG_EXTENSION', 'female', 'intermediate', 155, 170, 4, 3, 2, NULL, 'full', 30,
    '{"en":["Point toes slightly inward for quad focus"],"ko":["발끝을 약간 안쪽으로"],"ja":["つま先をやや内側に向けて大腿四頭筋に集中"],"zh":["脚尖略向内以专注股四头肌"]}',
    '{"en":["Use lighter weight for warm-up sets"],"ko":["워밍업은 가벼운 중량으로"],"ja":["ウォームアップは軽い重量で"],"zh":["热身组使用较轻重量"]}'),

  -- HS_LEG_CURL
  ('HS_LEG_CURL', 'male', 'intermediate', 170, 180, 5, 3, 4, NULL, 'full', 40,
    '{"en":["Keep hips pressed into pad","Full range of motion"],"ko":["엉덩이를 패드에 고정","전 가동범위 사용"],"ja":["腰をパッドに固定","可動域いっぱいに"],"zh":["臀部贴紧垫面","使用完整活动范围"]}',
    '{"en":["Do not lift hips"],"ko":["엉덩이를 들지 마세요"],"ja":["腰を浮かせない"],"zh":["不要抬起臀部"]}'),

  -- HS_SHOULDER_PRESS
  ('HS_SHOULDER_PRESS', 'male', 'intermediate', 170, 180, 5, 3, NULL, 2, 'variable', 35,
    '{"en":["Keep core braced","Do not arch lower back"],"ko":["코어 긴장 유지","허리 과신전 금지"],"ja":["コアを固定","腰を反らさない"],"zh":["保持核心收紧","不要挺腰"]}',
    '{"en":["Stop if shoulder pain occurs"],"ko":["어깨 통증 시 즉시 중단"],"ja":["肩に痛みがあれば中止"],"zh":["肩部疼痛时立即停止"]}')
) AS v(machine_code, gender, experience_level, height_min, height_max, seat_pos, back_pad_pos, foot_pos, handle_pos, rom_setting, weight_kg, tips, warnings)
WHERE m.code = v.machine_code
ON CONFLICT DO NOTHING;
