-- Recommend-weight hardening:
-- 1) gym_members.experience_level for non-self member recommendations
-- 2) Expand bodyweight catalog with reserved load-factor codes
--
-- Bodyweight load factors remain estimates (not external plate weight).

ALTER TABLE gym_members
  ADD COLUMN IF NOT EXISTS experience_level TEXT NULL;

ALTER TABLE gym_members
  DROP CONSTRAINT IF EXISTS gym_members_experience_level_chk;

ALTER TABLE gym_members
  ADD CONSTRAINT gym_members_experience_level_chk
  CHECK (
    experience_level IS NULL
    OR experience_level IN ('beginner', 'intermediate', 'advanced', 'professional')
  );

COMMENT ON COLUMN gym_members.experience_level IS
  'Training experience for gym-member recommendations; NULL falls back to intermediate.';

-- Copy self-member experience from linked account when missing.
UPDATE gym_members gm
SET experience_level = u.experience_level
FROM users u
WHERE gm.is_self = TRUE
  AND gm.linked_user_id = u.id
  AND gm.experience_level IS NULL
  AND u.experience_level IS NOT NULL;

-- Additional bodyweight machines (idempotent).
INSERT INTO machines (
  brand_id, code, name, muscle_group, machine_type,
  has_seat, has_back_pad, has_foot_plate, has_handle, rom_type, is_active,
  bodyweight_load_factor
)
SELECT
  b.id,
  v.code,
  v.name::jsonb,
  v.muscle_group,
  'bodyweight',
  false, false, false, false,
  '최대',
  true,
  v.factor
FROM brands b
CROSS JOIN (VALUES
  ('BW_STEP_UP', '{"ko":"스텝업","en":"Step-up","ja":"ステップアップ","zh":"踏步上台"}', 'legs', 0.80),
  ('BW_HINDU_SQUAT', '{"ko":"힌두 스쿼트","en":"Hindu Squat","ja":"ヒンドゥースクワット","zh":"印度深蹲"}', 'legs', 0.75),
  ('BW_PISTOL_SQUAT', '{"ko":"피스톨 스쿼트","en":"Pistol Squat","ja":"ピストルスクワット","zh":"单腿深蹲"}', 'legs', 0.75),
  ('BW_INCLINE_PUSH_UP', '{"ko":"인클라인 푸시업","en":"Incline Push-up","ja":"インクラインプッシュアップ","zh":"上斜俯卧撑"}', 'chest', 0.55),
  ('BW_DECLINE_PUSH_UP', '{"ko":"디클라인 푸시업","en":"Decline Push-up","ja":"デクラインプッシュアップ","zh":"下斜俯卧撑"}', 'chest', 0.70),
  ('BW_PIKE_PUSH_UP', '{"ko":"파이크 푸시업","en":"Pike Push-up","ja":"パイクプッシュアップ","zh":"派克俯卧撑"}', 'shoulders', 0.70),
  ('BW_HANDSTAND_PUSH_UP', '{"ko":"핸드스탠드 푸시업","en":"Handstand Push-up","ja":"ハンドスタンドプッシュアップ","zh":"倒立俯卧撑"}', 'shoulders', 0.80),
  ('BW_BENCH_DIPS', '{"ko":"벤치 딥스","en":"Bench Dips","ja":"ベンチディップス","zh":"凳上双杠臂屈伸"}', 'triceps', 0.75),
  ('BW_BURPEE', '{"ko":"버피","en":"Burpee","ja":"バーピー","zh":"波比跳"}', 'full_body', 0.70),
  ('BW_MOUNTAIN_CLIMBER', '{"ko":"마운틴 클라이머","en":"Mountain Climber","ja":"マウンテンクライマー","zh":"登山跑"}', 'core', 0.50),
  ('BW_PLANK', '{"ko":"플랭크","en":"Plank","ja":"プランク","zh":"平板支撑"}', 'core', 0.50),
  ('BW_SIDE_PLANK', '{"ko":"사이드 플랭크","en":"Side Plank","ja":"サイドプランク","zh":"侧平板"}', 'core', 0.50),
  ('BW_CRUNCH', '{"ko":"크런치","en":"Crunch","ja":"クランチ","zh":"卷腹"}', 'core', 0.50),
  ('BW_SIT_UP', '{"ko":"싯업","en":"Sit-up","ja":"シットアップ","zh":"仰卧起坐"}', 'core', 0.50),
  ('BW_LEG_RAISE', '{"ko":"레그레이즈","en":"Leg Raise","ja":"レッグレイズ","zh":"抬腿"}', 'core', 0.55),
  ('BW_HANGING_LEG_RAISE', '{"ko":"행잉 레그레이즈","en":"Hanging Leg Raise","ja":"ハンギングレッグレイズ","zh":"悬垂抬腿"}', 'core', 1.00),
  ('BW_V_UP', '{"ko":"V업","en":"V-up","ja":"Vアップ","zh":"V字两头起"}', 'core', 0.50),
  ('BW_RUSSIAN_TWIST', '{"ko":"러시안 트위스트","en":"Russian Twist","ja":"ロシアンツイスト","zh":"俄罗斯转体"}', 'core', 0.50),
  ('BW_SUPERMAN', '{"ko":"슈퍼맨","en":"Superman","ja":"スーパーマン","zh":"超人式"}', 'back', 0.50),
  ('BW_BACK_EXTENSION', '{"ko":"백 익스텐션(맨몸)","en":"Back Extension (BW)","ja":"バックエクステンション","zh":"徒手挺身"}', 'back', 0.60),
  ('BW_GLUTE_BRIDGE', '{"ko":"글루트 브릿지","en":"Glute Bridge","ja":"グルートブリッジ","zh":"臀桥"}', 'legs', 0.60),
  ('BW_HIP_THRUST', '{"ko":"힙 쓰러스트(맨몸)","en":"Hip Thrust (BW)","ja":"ヒップスラスト","zh":"徒手臀推"}', 'legs', 0.60),
  ('BW_CALF_RAISE', '{"ko":"카프레이즈(맨몸)","en":"Calf Raise (BW)","ja":"カーフレイズ","zh":"徒手提踵"}', 'legs', 0.90),
  ('BW_WALL_SIT', '{"ko":"월싯","en":"Wall Sit","ja":"ウォールシット","zh":"靠墙静蹲"}', 'legs', 0.75)
) AS v(code, name, muscle_group, factor)
WHERE b.code = 'BODYWEIGHT'
ON CONFLICT (code) DO UPDATE
SET
  bodyweight_load_factor = COALESCE(machines.bodyweight_load_factor, EXCLUDED.bodyweight_load_factor),
  is_active = TRUE;
