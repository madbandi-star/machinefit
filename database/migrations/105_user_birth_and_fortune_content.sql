-- Birth profile for 「오늘의 헬창운세」 + editable fortune content catalog.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS birth_time TIME,
  ADD COLUMN IF NOT EXISTS birth_time_unknown BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_birth_time_unknown_chk;
ALTER TABLE users
  ADD CONSTRAINT users_birth_time_unknown_chk
  CHECK (
    birth_time_unknown = false
    OR birth_time IS NULL
  );

CREATE TABLE IF NOT EXISTS fortune_content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  code TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'ko',
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  priority INT NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  data_conditions JSONB,
  score_weights JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fortune_content_items_category_chk CHECK (
    category IN (
      'keyword', 'headline', 'strategy', 'pre_workout', 'post_workout',
      'avoid', 'one_liner', 'style', 'condition', 'body_part'
    )
  ),
  CONSTRAINT fortune_content_items_code_locale_uq UNIQUE (code, locale, category)
);

CREATE INDEX IF NOT EXISTS idx_fortune_content_active_cat
  ON fortune_content_items (locale, category, is_active, priority);

-- Seed KO catalog (idempotent via ON CONFLICT)
INSERT INTO fortune_content_items (category, code, locale, title, body, priority, is_active) VALUES
  ('keyword', 'PR_DAY', 'ko', 'PR DAY', '기록을 노려볼 만한 날', 10, true),
  ('keyword', 'DUMBBELL_DAY', 'ko', 'DUMBBELL DAY', '덤벨과 궁합이 좋은 날', 20, true),
  ('keyword', 'FREE_WEIGHT_DAY', 'ko', 'FREE WEIGHT DAY', '프리웨이트와 궁합이 좋은 날', 30, true),
  ('keyword', 'DROP_SET_DAY', 'ko', 'DROP SET DAY', '드랍세트가 잘 맞는 날', 40, true),
  ('keyword', 'SUPER_SET_DAY', 'ko', 'SUPER SET DAY', '슈퍼세트가 잘 맞는 날', 50, true),
  ('keyword', 'VOLUME_DAY', 'ko', 'VOLUME DAY', '볼륨에 집중하기 좋은 날', 60, true),
  ('keyword', 'RECOVERY_DAY', 'ko', 'RECOVERY DAY', '회복을 우선하기 좋은 날', 70, true),
  ('keyword', 'CARDIO_DAY', 'ko', 'CARDIO DAY', '가벼운 유산소와 궁합이 좋은 날', 80, true),
  ('keyword', 'CONTROL_DAY', 'ko', 'CONTROL DAY', '컨트롤·자극에 집중하기 좋은 날', 90, true),
  ('keyword', 'LEG_DAY', 'ko', 'LEG DAY', '하체와 궁합이 좋은 날', 100, true),
  ('keyword', 'CHEST_DAY', 'ko', 'CHEST DAY', '가슴과 궁합이 좋은 날', 110, true),
  ('keyword', 'BACK_DAY', 'ko', 'BACK DAY', '등과 궁합이 좋은 날', 120, true),
  ('headline', 'PR_PUSH', 'ko', '오늘은 기록을 노려볼 만한 날입니다.', '평소보다 힘이 잘 붙는 느낌으로 접근해 보세요.', 10, true),
  ('headline', 'DUMBBELL_COMPAT', 'ko', '오늘은 덤벨과 궁합이 좋은 날입니다.', '머신 위주였다면 덤벨을 하나 더해 보세요.', 20, true),
  ('headline', 'CONTROL_FOCUS', 'ko', '오늘은 욕심보다 자극에 집중하는 날입니다.', '중량보다 자세와 템포에 신경 써 보세요.', 30, true),
  ('headline', 'RECOVERY_LISTEN', 'ko', '오늘은 몸이 보내는 신호에 귀를 기울여야 하는 날입니다.', '무리한 도전보다 회복 페이스를 추천해요.', 40, true),
  ('headline', 'VOLUME_BUILD', 'ko', '오늘은 볼륨을 쌓기 좋은 날입니다.', '세트 수를 조금 늘려보는 걸 추천해요.', 50, true),
  ('headline', 'FREE_WEIGHT', 'ko', '오늘은 프리웨이트와 궁합이 좋은 날입니다.', '바벨·덤벨로 변화를 줘 보세요.', 60, true),
  ('headline', 'MACHINE_STEADY', 'ko', '오늘은 머신으로 안정적으로 운동하기 좋은 날입니다.', '컨트롤된 가동범위로 접근해 보세요.', 70, true),
  ('headline', 'LIGHT_START', 'ko', '오늘은 가볍게 시작하기 좋은 날입니다.', '워밍업과 준비세트에 여유를 두세요.', 80, true),
  ('strategy', 'PR_CHALLENGE', 'ko', 'PR 도전', '준비세트를 충분히 한 뒤 마지막 세트에서 기록을 고려해 보세요.', 10, true),
  ('strategy', 'DROP_SET', 'ko', '드랍세트', '본세트 후 중량을 낮춰 자극을 이어가 보세요.', 20, true),
  ('strategy', 'SUPER_SET', 'ko', '슈퍼세트', '서로 다른 부위를 짧게 이어 운동해 보세요.', 30, true),
  ('strategy', 'VOLUME_UP', 'ko', '볼륨 증가', '평소보다 세트나 반복을 조금 늘려 보세요.', 40, true),
  ('strategy', 'WEIGHT_HOLD', 'ko', '중량 유지', '오늘은 중량을 유지하고 자세에 집중해 보세요.', 50, true),
  ('strategy', 'SLOW_CONTROL', 'ko', '컨트롤 중심', '천천히, 가동범위 끝까지 수행해 보세요.', 60, true),
  ('strategy', 'PYRAMID', 'ko', '피라미드 세트', '중량을 올리며 반복을 조절해 보세요.', 70, true),
  ('strategy', 'HIGH_WEIGHT_LOW_REP', 'ko', '고중량 저반복', '워밍업 후 낮은 반복으로 힘을 실어 보세요.', 80, true),
  ('style', 'BARBELL', 'ko', '바벨', '바벨 운동', 10, true),
  ('style', 'DUMBBELL', 'ko', '덤벨', '덤벨 운동', 20, true),
  ('style', 'MACHINE', 'ko', '머신', '머신 운동', 30, true),
  ('style', 'FREE_WEIGHT', 'ko', '프리웨이트', '프리웨이트 운동', 40, true),
  ('style', 'CABLE', 'ko', '케이블', '케이블 운동', 50, true),
  ('style', 'BODYWEIGHT', 'ko', '맨몸', '맨몸운동', 60, true),
  ('condition', 'AGGRESSIVE', 'ko', '공격적인 운동', '컨디션이 좋다면 평소보다 조금 더 도전해 보세요.', 10, true),
  ('condition', 'NORMAL', 'ko', '평소 강도', '평소와 비슷한 강도로 진행해 보세요.', 20, true),
  ('condition', 'LIGHT', 'ko', '가볍게 운동', '오늘은 가벼운 강도를 추천해요.', 30, true),
  ('condition', 'RECOVERY', 'ko', '회복 중심', '회복을 우선하는 페이스를 추천해요.', 40, true),
  ('condition', 'REST', 'ko', '휴식 권장', '오늘은 휴식을 고려해 보세요.', 50, true),
  ('pre_workout', 'WARMUP_LIGHT', 'ko', '가벼운 워밍업', '오늘은 충분한 준비세트와 가벼운 워밍업에 집중하세요.', 10, true),
  ('pre_workout', 'DYNAMIC_WARMUP', 'ko', '동적 워밍업', '운동 전 동적 워밍업을 추천합니다.', 20, true),
  ('pre_workout', 'MOBILITY', 'ko', '관절 가동성', '운동 전 관절 가동성 준비에 시간을 주세요.', 30, true),
  ('pre_workout', 'PREP_SETS', 'ko', '충분한 준비세트', '첫 본세트 전에 준비세트를 충분히 가져가세요.', 40, true),
  ('pre_workout', 'GRADUAL', 'ko', '점진적 강도', '운동 강도를 점진적으로 올려 보세요.', 50, true),
  ('post_workout', 'LIGHT_CARDIO', 'ko', '가벼운 유산소', '오늘은 운동 후 가벼운 유산소로 마무리해 보세요.', 10, true),
  ('post_workout', 'STRETCH', 'ko', '스트레칭', '운동 후 스트레칭으로 마무리해 보세요.', 20, true),
  ('post_workout', 'COOLDOWN', 'ko', '쿨다운', '오늘은 운동 후 쿨다운에 집중해 보세요.', 30, true),
  ('post_workout', 'HYDRATION', 'ko', '수분 섭취', '운동 후 충분한 수분 섭취를 추천해요.', 40, true),
  ('post_workout', 'RECOVERY_FOCUS', 'ko', '회복 중심', '오늘은 운동 후 회복에 여유를 두세요.', 50, true),
  ('avoid', 'HEAVY_EGO', 'ko', '무리한 고중량', '오늘은 무리한 고중량은 피하는 것을 추천해요.', 10, true),
  ('avoid', 'SAME_MUSCLE_VOLUME', 'ko', '같은 부위 과도한 볼륨', '같은 부위 과도한 볼륨은 피하는 편이 좋아요.', 20, true),
  ('avoid', 'NO_WARMUP_HEAVY', 'ko', '준비 없이 고중량', '준비운동 없이 바로 고중량은 피하는 것을 추천해요.', 30, true),
  ('avoid', 'PR_WHEN_FATIGUED', 'ko', '피로 속 PR', '회복이 부족한 상태에서의 무리한 PR 도전은 피하는 편이 좋아요.', 40, true),
  ('avoid', 'SKIP_REST', 'ko', '세트 간 휴식 생략', '세트 간 휴식을 너무 줄이는 것은 피하는 것을 추천해요.', 50, true),
  ('one_liner', 'ONE_MORE_SET', 'ko', '평소보다 한 세트 더.', '하지만 마지막 한 세트는 욕심내지 마세요.', 10, true),
  ('one_liner', 'PREP_WINS', 'ko', '기록은 욕심보다 준비에서 나온다.', '준비세트를 아끼지 마세요.', 20, true),
  ('one_liner', 'CONTROL_FIRST', 'ko', '자극이 먼저, 중량은 나중.', '자세가 무너지면 중량을 낮추세요.', 30, true),
  ('one_liner', 'LISTEN_BODY', 'ko', '몸이 보내는 신호를 무시하지 마세요.', '오늘은 페이스 조절이 미덕입니다.', 40, true),
  ('one_liner', 'CHANGE_STIMULUS', 'ko', '익숙한 자극을 조금만 바꿔 보세요.', '변화가 성장을 만듭니다.', 50, true),
  ('body_part', 'CHEST', 'ko', '가슴', '가슴', 10, true),
  ('body_part', 'BACK', 'ko', '등', '등', 20, true),
  ('body_part', 'SHOULDERS', 'ko', '어깨', '어깨', 30, true),
  ('body_part', 'LEGS', 'ko', '하체', '하체', 40, true),
  ('body_part', 'BICEPS', 'ko', '이두', '이두', 50, true),
  ('body_part', 'TRICEPS', 'ko', '삼두', '삼두', 60, true),
  ('body_part', 'CORE', 'ko', '복근', '복근', 70, true),
  ('body_part', 'FULL_BODY', 'ko', '전신', '전신', 80, true)
ON CONFLICT (code, locale, category) DO NOTHING;
