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
  v.rom_setting, v.weight_kg::numeric, v.tips::jsonb, v.warnings::jsonb
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
    '{"en":["Stop if shoulder pain occurs"],"ko":["어깨 통증 시 즉시 중단"],"ja":["肩に痛みがあれば中止"],"zh":["肩部疼痛时立即停止"]}'),

  -- FW_DUMBBELL
  ('FW_DUMBBELL', 'male', 'intermediate', 160, 190, NULL, NULL, NULL, NULL, 'full', 12,
    '{"en":["Choose a weight you can control for your target reps","Keep wrists neutral"],"ko":["목표 횟수를 컨트롤할 수 있는 중량 선택","손목 중립 유지"],"ja":["目標回数をコントロールできる重量を選ぶ","手首をニュートラルに"],"zh":["选择能控制目标次数的重量","保持手腕中立"]}',
    '{"en":["Do not drop dumbbells from height"],"ko":["덤벨을 높은 곳에서 떨어뜨리지 마세요"],"ja":["ダンベルを高い位置から落とさない"],"zh":["不要从高处扔下哑铃"]}'),

  -- FW_BARBELL
  ('FW_BARBELL', 'male', 'intermediate', 160, 190, NULL, NULL, NULL, NULL, 'full', 40,
    '{"en":["Use collars on both sides","Brace core before each set"],"ko":["양쪽에 칼라 고정","세트 전 코어 브레이싱"],"ja":["両側にカラーで固定","セット前にコアを固める"],"zh":["两侧使用卡扣","每组前收紧核心"]}',
    '{"en":["Do not lift without spotter on heavy sets if unsure"],"ko":["무거운 중량은 보조 없이 무리하지 마세요"],"ja":["重い重量は無理に一人で行わない"],"zh":["大重量不确定时不要独自训练"]}'),

  -- FW_SMITH
  ('FW_SMITH', 'male', 'intermediate', 160, 190, NULL, NULL, NULL, NULL, 'variable', 60,
    '{"en":["Lock safety stops before heavy sets","Keep bar path vertical"],"ko":["고중량 전에 안전 스토퍼 고정","바를 수직으로 이동"],"ja":["高重量前に安全ストッパーを固定","バーを垂直に動かす"],"zh":["大重量前固定安全挡","保持杠铃垂直路径"]}',
    '{"en":["Do not rotate wrists under load"],"ko":["하중 중 손목을 비틀지 마세요"],"ja":["負荷中に手首を捻らない"],"zh":["负重时不要扭动手腕"]}'),

  -- FW_CABLE
  ('FW_CABLE', 'male', 'intermediate', 160, 190, NULL, NULL, NULL, NULL, 'variable', 25,
    '{"en":["Stand stable before pulling","Control the return phase"],"ko":["당기기 전 자세 고정","복귀 구간 컨트롤"],"ja":["引く前に姿勢を固定","戻す動作をコントロール"],"zh":["拉动前站稳","控制回位阶段"]}',
    '{"en":["Avoid jerking the stack"],"ko":["무게 스택을 급격히 당기지 마세요"],"ja":["ウェイトスタックを急に引かない"],"zh":["不要猛拉配重"]}'),

  -- FW_KETTLEBELL
  ('FW_KETTLEBELL', 'male', 'intermediate', 160, 190, NULL, NULL, NULL, NULL, 'full', 16,
    '{"en":["Grip the handle firmly","Use hip drive on swings"],"ko":["손잡이를 단단히 잡기","스윙 시 엉덩이 힘 활용"],"ja":["ハンドルをしっかり握る","スイング時は股関節を使う"],"zh":["握紧把手","摆动时使用髋部发力"]}',
    '{"en":["Keep clearance around your body"],"ko":["주변에 충분한 공간 확보"],"ja":["周囲に十分なスペースを確保"],"zh":["确保周围有足够空间"]}'),

  -- BW_PULL_UP
  ('BW_PULL_UP', 'male', 'intermediate', 160, 190, NULL, NULL, NULL, NULL, 'full', NULL,
    '{"en":["Start from a dead hang","Pull chest toward the bar"],"ko":["데드행에서 시작","가슴을 바 쪽으로 당기기"],"ja":["デッドハングから開始","胸をバーに引き寄せる"],"zh":["从悬垂开始","将胸部拉向横杆"]}',
    '{"en":["Avoid kipping if focusing on strength"],"ko":["근력 위주면 키핑 피하기"],"ja":["筋力重視ならキップを避ける"],"zh":["侧重力量时避免借力摆动"]}'),

  -- BW_CHIN_UP
  ('BW_CHIN_UP', 'male', 'intermediate', 160, 190, NULL, NULL, NULL, NULL, 'full', NULL,
    '{"en":["Use supinated grip","Keep elbows close to body"],"ko":["손바닥 자신 쪽 그립","팔꿈치를 몸 가까이"],"ja":["手のひらを自分側に","肘を体の近くに"],"zh":["采用反手抓握","肘部贴近身体"]}',
    '{"en":["Do not swing the torso"],"ko":["상체를 흔들지 마세요"],"ja":["体幹を揺らさない"],"zh":["不要摆动躯干"]}'),

  -- BW_DIPS
  ('BW_DIPS', 'male', 'intermediate', 160, 190, NULL, NULL, NULL, NULL, 'full', NULL,
    '{"en":["Keep shoulders down on descent","Lean slightly forward for chest focus"],"ko":["하강 시 어깨 내리기","가슴 자극을 위해 약간 숙이기"],"ja":["下ろす時は肩を下げる","胸に効かせるためやや前傾"],"zh":["下降时沉肩","略前倾以刺激胸部"]}',
    '{"en":["Stop if shoulder pain occurs"],"ko":["어깨 통증 시 즉시 중단"],"ja":["肩に痛みがあれば中止"],"zh":["肩部疼痛时立即停止"]}'),

  -- BW_PUSH_UP
  ('BW_PUSH_UP', 'male', 'intermediate', 160, 190, NULL, NULL, NULL, NULL, 'full', NULL,
    '{"en":["Keep body in a straight line","Lower chest near the floor"],"ko":["몸을 일자로 유지","가슴을 바닥 가까이"],"ja":["体を一直線に","胸を床近くまで"],"zh":["身体保持一条直线","胸部接近地面"]}',
    '{"en":["Do not sag the hips"],"ko":["엉덩이가 처지지 않게"],"ja":["腰が落ちないように"],"zh":["不要塌腰"]}'),

  -- BW_SQUAT
  ('BW_SQUAT', 'male', 'intermediate', 160, 190, NULL, NULL, NULL, NULL, 'full', NULL,
    '{"en":["Keep knees in line with toes","Sit hips back and down"],"ko":["무릎을 발끝과 같은 방향","엉덩이를 뒤로 빼며 앉기"],"ja":["膝をつま先と同じ方向に","股関節を後ろに引いて下ろす"],"zh":["膝盖与脚尖同向","髋部后坐下"]}',
    '{"en":["Do not let knees cave inward"],"ko":["무릎이 안쪽으로 모이지 않게"],"ja":["膝が内側に入らないように"],"zh":["不要让膝盖内扣"]}'),

  -- BW_LUNGE
  ('BW_LUNGE', 'male', 'intermediate', 160, 190, NULL, NULL, NULL, NULL, 'full', NULL,
    '{"en":["Keep front knee over ankle","Torso upright"],"ko":["앞무릎을 발목 위에","상체 세우기"],"ja":["前膝を足首の上に","上体を起こす"],"zh":["前膝在脚踝上方","上身挺直"]}',
    '{"en":["Avoid pushing front knee too far forward"],"ko":["앞무릎이 과도하게 앞으로 나가지 않게"],"ja":["前膝が過度に前に出ないように"],"zh":["前膝不要过度前移"]}'),

  -- BW_BULGARIAN_SPLIT_SQUAT
  ('BW_BULGARIAN_SPLIT_SQUAT', 'male', 'intermediate', 160, 190, NULL, NULL, NULL, NULL, 'full', NULL,
    '{"en":["Rear foot on bench for balance","Lower until front thigh is parallel"],"ko":["뒷발을 벤치에 올려 균형","앞 허벅지가 수평까지"],"ja":["後ろ足をベンチに","前ももが水平まで"],"zh":["后脚放凳上保持平衡","前大腿蹲至水平"]}',
    '{"en":["Keep most weight on front leg"],"ko":["체중은 앞다리에 집중"],"ja":["体重は前足に"],"zh":["重心放在前腿"]}')
) AS v(machine_code, gender, experience_level, height_min, height_max, seat_pos, back_pad_pos, foot_pos, handle_pos, rom_setting, weight_kg, tips, warnings)
WHERE m.code = v.machine_code
ON CONFLICT DO NOTHING;
