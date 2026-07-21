-- Live dashboard geo + daily aggregates

ALTER TABLE user_gyms
  ADD COLUMN IF NOT EXISTS country_code CHAR(2) NOT NULL DEFAULT 'KR',
  ADD COLUMN IF NOT EXISTS metro_code VARCHAR(40) NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS district_code VARCHAR(40) NOT NULL DEFAULT 'unknown';

CREATE INDEX IF NOT EXISTS idx_user_gyms_geo
  ON user_gyms (country_code, metro_code, district_code);

CREATE INDEX IF NOT EXISTS idx_workout_logs_updated_at
  ON workout_logs (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_logs_log_date_gym
  ON workout_logs (log_date DESC, gym_id);

-- Deterministic Korea metro/district backfill for existing personal gyms (addresses empty).
WITH metro_pool AS (
  SELECT * FROM (VALUES
    ('seoul', '서울특별시', ARRAY['gangnam','gangseo','mapo','songpa','nowon','yongsan']),
    ('gyeonggi', '경기도', ARRAY['suwon','seongnam','goyang','bucheon','yongin','anyang']),
    ('busan', '부산광역시', ARRAY['haeundae','busanjin','dongnae','sasang']),
    ('incheon', '인천광역시', ARRAY['namdong','yeonsu','bupyeong','michuhol']),
    ('daegu', '대구광역시', ARRAY['suseong','dalseo','jung']),
    ('daejeon', '대전광역시', ARRAY['yuseong','seo','jung']),
    ('gwangju', '광주광역시', ARRAY['buk','seo','nam']),
    ('ulsan', '울산광역시', ARRAY['nam','jung','dong']),
    ('gangwon', '강원특별자치도', ARRAY['chuncheon','wonju','gangneung']),
    ('chungbuk', '충청북도', ARRAY['cheongju','chungju']),
    ('chungnam', '충청남도', ARRAY['cheonan','asan']),
    ('jeonbuk', '전북특별자치도', ARRAY['jeonju','iksan']),
    ('jeonnam', '전라남도', ARRAY['mokpo','yeosu']),
    ('gyeongbuk', '경상북도', ARRAY['pohang','gumi']),
    ('gyeongnam', '경상남도', ARRAY['changwon','gimhae']),
    ('jeju', '제주특별자치도', ARRAY['jeju','seogwipo'])
  ) AS t(metro_code, metro_name, districts)
),
ranked AS (
  SELECT
    ug.id,
    mp.metro_code,
    mp.districts[((abs(hashtext(ug.id::text)) % array_length(mp.districts, 1)) + 1)] AS district_code,
    row_number() OVER (ORDER BY ug.created_at, ug.id) AS rn,
    count(*) OVER () AS total
  FROM user_gyms ug
  CROSS JOIN LATERAL (
    SELECT * FROM metro_pool
    ORDER BY metro_code
    OFFSET (abs(hashtext(ug.id::text)) % 16)
    LIMIT 1
  ) mp
)
UPDATE user_gyms ug
SET
  country_code = 'KR',
  metro_code = ranked.metro_code,
  district_code = ranked.district_code
FROM ranked
WHERE ug.id = ranked.id
  AND (ug.metro_code = 'unknown' OR ug.district_code = 'unknown');

CREATE TABLE IF NOT EXISTS live_daily_stats (
  stat_date DATE NOT NULL,
  country_code CHAR(2) NOT NULL DEFAULT '',
  metro_code VARCHAR(40) NOT NULL DEFAULT '',
  district_code VARCHAR(40) NOT NULL DEFAULT '',
  gym_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  active_users INT NOT NULL DEFAULT 0,
  completed_users INT NOT NULL DEFAULT 0,
  total_sets INT NOT NULL DEFAULT 0,
  total_volume_kg NUMERIC(20, 2) NOT NULL DEFAULT 0,
  machine_count INT NOT NULL DEFAULT 0,
  gym_count INT NOT NULL DEFAULT 0,
  top_machine_code VARCHAR(80),
  top_brand_code VARCHAR(80),
  top_muscle_group VARCHAR(40),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (stat_date, country_code, metro_code, district_code, gym_id)
);

CREATE INDEX IF NOT EXISTS idx_live_daily_stats_date
  ON live_daily_stats (stat_date DESC);

COMMENT ON TABLE live_daily_stats IS 'Cached daily live-dashboard rollups by geo/gym scope';
