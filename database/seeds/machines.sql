-- Machines seed (requires brands)
INSERT INTO machines (brand_id, code, name, muscle_group, machine_type, has_seat, has_back_pad, has_foot_plate, has_handle, rom_type, is_active)
SELECT b.id, v.code, v.name::jsonb, v.muscle_group, v.machine_type, v.has_seat, v.has_back_pad, v.has_foot_plate, v.has_handle, v.rom_type, true
FROM brands b
CROSS JOIN (VALUES
  ('FREE_WEIGHT', 'FW_DUMBBELL', '{"ko":"덤벨","en":"Dumbbell","ja":"ダンベル","zh":"哑铃"}', 'shoulders', 'free_weight', false, false, false, true, 'variable'),
  ('FREE_WEIGHT', 'FW_BARBELL', '{"ko":"바벨","en":"Barbell","ja":"バーベル","zh":"杠铃"}', 'chest', 'free_weight', false, false, false, true, 'variable'),
  ('FREE_WEIGHT', 'FW_SMITH', '{"ko":"스미스 머신","en":"Smith Machine","ja":"スミスマシン","zh":"史密斯机"}', 'full_body', 'smith', false, false, true, true, 'variable'),
  ('FREE_WEIGHT', 'FW_CABLE', '{"ko":"케이블","en":"Cable","ja":"ケーブル","zh":"绳索"}', 'back', 'cable', false, false, false, true, 'variable'),
  ('FREE_WEIGHT', 'FW_KETTLEBELL', '{"ko":"케틀벨","en":"Kettlebell","ja":"ケトルベル","zh":"壶铃"}', 'shoulders', 'free_weight', false, false, false, true, 'variable'),
  ('BODYWEIGHT', 'BW_PULL_UP', '{"ko":"풀업","en":"Pull-up","ja":"懸垂","zh":"引体向上"}', 'back', 'bodyweight', false, false, false, true, '최대'),
  ('BODYWEIGHT', 'BW_CHIN_UP', '{"ko":"친업","en":"Chin-up","ja":"チンアップ","zh":"反手引体"}', 'back', 'bodyweight', false, false, false, true, '최대'),
  ('BODYWEIGHT', 'BW_DIPS', '{"ko":"딥스","en":"Dips","ja":"ディップス","zh":"双杠臂屈伸"}', 'chest', 'bodyweight', false, false, false, true, '최대'),
  ('BODYWEIGHT', 'BW_PUSH_UP', '{"ko":"푸쉬업","en":"Push-up","ja":"プッシュアップ","zh":"俯卧撑"}', 'chest', 'bodyweight', false, false, false, false, '최대'),
  ('BODYWEIGHT', 'BW_SQUAT', '{"ko":"스쿼트","en":"Squat","ja":"スクワット","zh":"深蹲"}', 'legs', 'bodyweight', false, false, true, false, '최대'),
  ('BODYWEIGHT', 'BW_LUNGE', '{"ko":"런지","en":"Lunge","ja":"ランジ","zh":"弓步"}', 'legs', 'bodyweight', false, false, true, false, '최대'),
  ('BODYWEIGHT', 'BW_BULGARIAN_SPLIT_SQUAT', '{"ko":"불가리안 스플릿스쿼트","en":"Bulgarian Split Squat","ja":"ブルガリアンスプリットスクワット","zh":"保加利亚分腿蹲"}', 'legs', 'bodyweight', false, false, true, false, '최대'),
  ('HAMMER_STRENGTH', 'HS_ISO_LATERAL_HIGH_ROW', '{"ko":"아이소 레터럴 하이 로우","en":"Iso-Lateral High Row","ja":"アイソラテラルハイロー","zh":"等轴高位拉"}', 'back', 'plate_loaded', true, true, false, true, 'variable'),
  ('HAMMER_STRENGTH', 'HS_SELECTORIZED_CHEST_PRESS', '{"ko":"셀렉터라이즈드 체스트 프레스","en":"Selectorized Chest Press","ja":"セレクタライズドチェストプレス","zh":"选择式胸部推举"}', 'chest', 'selectorized', true, true, false, true, 'fixed'),
  ('HAMMER_STRENGTH', 'HS_LEG_EXTENSION', '{"ko":"레그 익스텐션","en":"Leg Extension","ja":"レッグエクステンション","zh":"腿部伸展"}', 'legs', 'selectorized', true, true, true, false, 'fixed'),
  ('HAMMER_STRENGTH', 'HS_LEG_CURL', '{"ko":"레그 컬","en":"Leg Curl","ja":"レッグカール","zh":"腿部弯举"}', 'legs', 'selectorized', true, true, true, false, 'fixed'),
  ('HAMMER_STRENGTH', 'HS_SHOULDER_PRESS', '{"ko":"숄더 프레스","en":"Shoulder Press","ja":"ショルダープレス","zh":"肩部推举"}', 'shoulders', 'plate_loaded', true, true, false, true, 'variable')
) AS v(brand_code, code, name, muscle_group, machine_type, has_seat, has_back_pad, has_foot_plate, has_handle, rom_type)
WHERE b.code = v.brand_code
ON CONFLICT (code) DO NOTHING;
