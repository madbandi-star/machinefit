-- Add Japanese and Chinese translations to tips/warnings (machine_settings + saved recommendations)

-- HS_ISO_LATERAL_HIGH_ROW / male / beginner
UPDATE machine_settings ms
SET
  tips = tips || '{"ja":["胸をパッドに密着","テンポをコントロール"],"zh":["胸部贴紧垫子","控制节奏进行"]}'::jsonb,
  warnings = warnings || '{"ja":["腰を丸めない"],"zh":["不要弯腰弓背"]}'::jsonb
FROM machines m
WHERE ms.machine_id = m.id
  AND m.code = 'HS_ISO_LATERAL_HIGH_ROW'
  AND ms.gender = 'male'
  AND ms.experience_level = 'beginner'
  AND ms.height_min_cm = 160
  AND ms.height_max_cm = 170;

-- HS_ISO_LATERAL_HIGH_ROW / male / intermediate
UPDATE machine_settings ms
SET
  tips = tips || '{"ja":["胸をパッドに密着","肘を肩のラインに合わせて引く"],"zh":["胸部贴紧垫子","肘部与肩部对齐后拉"]}'::jsonb,
  warnings = warnings || '{"ja":["腰を丸めない"],"zh":["不要弯腰弓背"]}'::jsonb
FROM machines m
WHERE ms.machine_id = m.id
  AND m.code = 'HS_ISO_LATERAL_HIGH_ROW'
  AND ms.gender = 'male'
  AND ms.experience_level = 'intermediate'
  AND ms.height_min_cm = 170
  AND ms.height_max_cm = 180;

-- HS_ISO_LATERAL_HIGH_ROW / male / advanced
UPDATE machine_settings ms
SET
  tips = tips || '{"ja":["肩甲骨の収縮に集中","下で十分にストレッチ"],"zh":["专注于肩胛骨收紧","在底部充分拉伸"]}'::jsonb,
  warnings = warnings || '{"ja":["重量を急に引かない"],"zh":["不要猛拉重量"]}'::jsonb
FROM machines m
WHERE ms.machine_id = m.id
  AND m.code = 'HS_ISO_LATERAL_HIGH_ROW'
  AND ms.gender = 'male'
  AND ms.experience_level = 'advanced'
  AND ms.height_min_cm = 180
  AND ms.height_max_cm = 190;

-- HS_ISO_LATERAL_HIGH_ROW / female / intermediate
UPDATE machine_settings ms
SET
  tips = tips || '{"ja":["届きやすい位置にシートを調整","最大収縮で一瞬キープ"],"zh":["调整座椅至舒适范围","在最大收缩处短暂停顿"]}'::jsonb,
  warnings = warnings || '{"ja":["肘を過度に伸ばさない"],"zh":["不要过度伸直肘部"]}'::jsonb
FROM machines m
WHERE ms.machine_id = m.id
  AND m.code = 'HS_ISO_LATERAL_HIGH_ROW'
  AND ms.gender = 'female'
  AND ms.experience_level = 'intermediate'
  AND ms.height_min_cm = 155
  AND ms.height_max_cm = 170;

-- HS_SELECTORIZED_CHEST_PRESS / male / intermediate
UPDATE machine_settings ms
SET
  tips = tips || '{"ja":["肩甲骨を寄せる","ややアークを描いて押す"],"zh":["收紧肩胛骨","以轻微弧线推出"]}'::jsonb,
  warnings = warnings || '{"ja":["肘を強く伸ばし切らない"],"zh":["不要过度锁死肘部"]}'::jsonb
FROM machines m
WHERE ms.machine_id = m.id
  AND m.code = 'HS_SELECTORIZED_CHEST_PRESS'
  AND ms.gender = 'male'
  AND ms.experience_level = 'intermediate'
  AND ms.height_min_cm = 170
  AND ms.height_max_cm = 180;

-- HS_SELECTORIZED_CHEST_PRESS / female / beginner
UPDATE machine_settings ms
SET
  tips = tips || '{"ja":["手首をニュートラルに","下ろす動作をコントロール"],"zh":["保持手腕中立","控制下降阶段"]}'::jsonb,
  warnings = warnings || '{"ja":["下で反動を使わない"],"zh":["不要在底部反弹"]}'::jsonb
FROM machines m
WHERE ms.machine_id = m.id
  AND m.code = 'HS_SELECTORIZED_CHEST_PRESS'
  AND ms.gender = 'female'
  AND ms.experience_level = 'beginner'
  AND ms.height_min_cm = 150
  AND ms.height_max_cm = 165;

-- HS_LEG_EXTENSION / male / intermediate
UPDATE machine_settings ms
SET
  tips = tips || '{"ja":["膝をマシンのピボットに合わせる","上で一瞬止める"],"zh":["膝盖对准器械 pivot","在顶端短暂停顿"]}'::jsonb,
  warnings = warnings || '{"ja":["過度な伸展を避ける"],"zh":["避免过度伸展"]}'::jsonb
FROM machines m
WHERE ms.machine_id = m.id
  AND m.code = 'HS_LEG_EXTENSION'
  AND ms.gender = 'male'
  AND ms.experience_level = 'intermediate'
  AND ms.height_min_cm = 170
  AND ms.height_max_cm = 180;

-- HS_LEG_EXTENSION / female / intermediate
UPDATE machine_settings ms
SET
  tips = tips || '{"ja":["つま先をやや内側に向けて大腿四頭筋に集中"],"zh":["脚尖略向内以专注股四头肌"]}'::jsonb,
  warnings = warnings || '{"ja":["ウォームアップは軽い重量で"],"zh":["热身组使用较轻重量"]}'::jsonb
FROM machines m
WHERE ms.machine_id = m.id
  AND m.code = 'HS_LEG_EXTENSION'
  AND ms.gender = 'female'
  AND ms.experience_level = 'intermediate'
  AND ms.height_min_cm = 155
  AND ms.height_max_cm = 170;

-- HS_LEG_CURL / male / intermediate
UPDATE machine_settings ms
SET
  tips = tips || '{"ja":["腰をパッドに固定","可動域いっぱいに"],"zh":["臀部贴紧垫面","使用完整活动范围"]}'::jsonb,
  warnings = warnings || '{"ja":["腰を浮かせない"],"zh":["不要抬起臀部"]}'::jsonb
FROM machines m
WHERE ms.machine_id = m.id
  AND m.code = 'HS_LEG_CURL'
  AND ms.gender = 'male'
  AND ms.experience_level = 'intermediate'
  AND ms.height_min_cm = 170
  AND ms.height_max_cm = 180;

-- HS_SHOULDER_PRESS / male / intermediate
UPDATE machine_settings ms
SET
  tips = tips || '{"ja":["コアを固定","腰を反らさない"],"zh":["保持核心收紧","不要挺腰"]}'::jsonb,
  warnings = warnings || '{"ja":["肩に痛みがあれば中止"],"zh":["肩部疼痛时立即停止"]}'::jsonb
FROM machines m
WHERE ms.machine_id = m.id
  AND m.code = 'HS_SHOULDER_PRESS'
  AND ms.gender = 'male'
  AND ms.experience_level = 'intermediate'
  AND ms.height_min_cm = 170
  AND ms.height_max_cm = 180;

-- Backfill saved recommendations (match by existing English tips JSON)
UPDATE machine_recommendations
SET tips = tips || '{"ja":["胸をパッドに密着","テンポをコントロール"],"zh":["胸部贴紧垫子","控制节奏进行"]}'::jsonb
WHERE tips @> '{"en":["Keep chest against pad","Use controlled tempo"]}'::jsonb;

UPDATE machine_recommendations
SET tips = tips || '{"ja":["胸をパッドに密着","肘を肩のラインに合わせて引く"],"zh":["胸部贴紧垫子","肘部与肩部对齐后拉"]}'::jsonb
WHERE tips @> '{"en":["Keep chest against pad","Pull elbows back in line with shoulders"]}'::jsonb;

UPDATE machine_recommendations
SET tips = tips || '{"ja":["肩甲骨の収縮に集中","下で十分にストレッチ"],"zh":["专注于肩胛骨收紧","在底部充分拉伸"]}'::jsonb
WHERE tips @> '{"en":["Focus on scapular retraction","Full stretch at bottom"]}'::jsonb;

UPDATE machine_recommendations
SET tips = tips || '{"ja":["届きやすい位置にシートを調整","最大収縮で一瞬キープ"],"zh":["调整座椅至舒适范围","在最大收缩处短暂停顿"]}'::jsonb
WHERE tips @> '{"en":["Adjust seat for comfortable reach","Squeeze at peak contraction"]}'::jsonb;

UPDATE machine_recommendations
SET tips = tips || '{"ja":["肩甲骨を寄せる","ややアークを描いて押す"],"zh":["收紧肩胛骨","以轻微弧线推出"]}'::jsonb
WHERE tips @> '{"en":["Retract shoulder blades","Press in slight arc"]}'::jsonb;

UPDATE machine_recommendations
SET tips = tips || '{"ja":["肩甲骨を寄せる"],"zh":["收紧肩胛骨"]}'::jsonb
WHERE tips @> '{"en":["Retract shoulder blades"]}'::jsonb
  AND NOT (tips ? 'ja');

UPDATE machine_recommendations
SET tips = tips || '{"ja":["手首をニュートラルに","下ろす動作をコントロール"],"zh":["保持手腕中立","控制下降阶段"]}'::jsonb
WHERE tips @> '{"en":["Keep wrists neutral","Control the negative"]}'::jsonb;

UPDATE machine_recommendations
SET tips = tips || '{"ja":["膝をマシンのピボットに合わせる","上で一瞬止める"],"zh":["膝盖对准器械 pivot","在顶端短暂停顿"]}'::jsonb
WHERE tips @> '{"en":["Align knee with machine pivot","Pause at top"]}'::jsonb;

UPDATE machine_recommendations
SET tips = tips || '{"ja":["膝をマシンのピボットに合わせる"],"zh":["膝盖对准器械 pivot"]}'::jsonb
WHERE tips @> '{"en":["Align knee with machine pivot"]}'::jsonb
  AND NOT (tips ? 'ja');

UPDATE machine_recommendations
SET tips = tips || '{"ja":["つま先をやや内側に向けて大腿四頭筋に集中"],"zh":["脚尖略向内以专注股四头肌"]}'::jsonb
WHERE tips @> '{"en":["Point toes slightly inward for quad focus"]}'::jsonb;

UPDATE machine_recommendations
SET tips = tips || '{"ja":["腰をパッドに固定","可動域いっぱいに"],"zh":["臀部贴紧垫面","使用完整活动范围"]}'::jsonb
WHERE tips @> '{"en":["Keep hips pressed into pad","Full range of motion"]}'::jsonb;

UPDATE machine_recommendations
SET tips = tips || '{"ja":["コアを固定","腰を反らさない"],"zh":["保持核心收紧","不要挺腰"]}'::jsonb
WHERE tips @> '{"en":["Keep core braced","Do not arch lower back"]}'::jsonb;

UPDATE machine_recommendations
SET warnings = warnings || '{"ja":["腰を丸めない"],"zh":["不要弯腰弓背"]}'::jsonb
WHERE warnings @> '{"en":["Do not round lower back"]}'::jsonb;

UPDATE machine_recommendations
SET warnings = warnings || '{"ja":["重量を急に引かない"],"zh":["不要猛拉重量"]}'::jsonb
WHERE warnings @> '{"en":["Avoid jerking the weight"]}'::jsonb;

UPDATE machine_recommendations
SET warnings = warnings || '{"ja":["肘を過度に伸ばさない"],"zh":["不要过度伸直肘部"]}'::jsonb
WHERE warnings @> '{"en":["Do not hyperextend elbows"]}'::jsonb;

UPDATE machine_recommendations
SET warnings = warnings || '{"ja":["肘を強く伸ばし切らない"],"zh":["不要过度锁死肘部"]}'::jsonb
WHERE warnings @> '{"en":["Do not lock elbows aggressively"]}'::jsonb;

UPDATE machine_recommendations
SET warnings = warnings || '{"ja":["下で反動を使わない"],"zh":["不要在底部反弹"]}'::jsonb
WHERE warnings @> '{"en":["Avoid bouncing at bottom"]}'::jsonb;

UPDATE machine_recommendations
SET warnings = warnings || '{"ja":["過度な伸展を避ける"],"zh":["避免过度伸展"]}'::jsonb
WHERE warnings @> '{"en":["Avoid hyperextension"]}'::jsonb;

UPDATE machine_recommendations
SET warnings = warnings || '{"ja":["ウォームアップは軽い重量で"],"zh":["热身组使用较轻重量"]}'::jsonb
WHERE warnings @> '{"en":["Use lighter weight for warm-up sets"]}'::jsonb;

UPDATE machine_recommendations
SET warnings = warnings || '{"ja":["腰を浮かせない"],"zh":["不要抬起臀部"]}'::jsonb
WHERE warnings @> '{"en":["Do not lift hips"]}'::jsonb;

UPDATE machine_recommendations
SET warnings = warnings || '{"ja":["肩に痛みがあれば中止"],"zh":["肩部疼痛时立即停止"]}'::jsonb
WHERE warnings @> '{"en":["Stop if shoulder pain occurs"]}'::jsonb;
