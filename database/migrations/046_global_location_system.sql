-- Global Location system: countries/states/cities/districts + user_locations
-- Clears hash-assigned LIVE dummy geo on user_gyms.

-- ---------------------------------------------------------------------------
-- 1) Enhance countries + hierarchy tables
-- ---------------------------------------------------------------------------
ALTER TABLE countries
  ADD COLUMN IF NOT EXISTS flag_emoji VARCHAR(8),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 1000;

CREATE TABLE IF NOT EXISTS location_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code CHAR(2) NOT NULL REFERENCES countries(code) ON UPDATE CASCADE,
  code VARCHAR(40) NOT NULL,
  name JSONB NOT NULL,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (country_code, code)
);

CREATE INDEX IF NOT EXISTS idx_location_states_country
  ON location_states (country_code, sort_order, code);

CREATE TABLE IF NOT EXISTS location_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID NOT NULL REFERENCES location_states(id) ON DELETE CASCADE,
  code VARCHAR(40) NOT NULL,
  name JSONB NOT NULL,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (state_id, code)
);

CREATE INDEX IF NOT EXISTS idx_location_cities_state
  ON location_cities (state_id, sort_order, code);

CREATE TABLE IF NOT EXISTS location_districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES location_cities(id) ON DELETE CASCADE,
  code VARCHAR(40) NOT NULL,
  name JSONB NOT NULL,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (city_id, code)
);

CREATE INDEX IF NOT EXISTS idx_location_districts_city
  ON location_districts (city_id, sort_order, code);

-- ---------------------------------------------------------------------------
-- 2) User profile location (optional)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_locations (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  country_code CHAR(2) REFERENCES countries(code) ON UPDATE CASCADE,
  state_id UUID REFERENCES location_states(id) ON DELETE SET NULL,
  city_id UUID REFERENCES location_cities(id) ON DELETE SET NULL,
  district_id UUID REFERENCES location_districts(id) ON DELETE SET NULL,
  postal_code VARCHAR(32),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  -- hidden | country | city | gym
  visibility VARCHAR(20) NOT NULL DEFAULT 'city'
    CHECK (visibility IN ('hidden', 'country', 'city', 'gym')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_locations IS
  'Optional member location. NULL country_code means unset.';

-- ---------------------------------------------------------------------------
-- 3) Personal gym location columns + clear dummy LIVE geo
-- ---------------------------------------------------------------------------
ALTER TABLE user_gyms
  ADD COLUMN IF NOT EXISTS state_id UUID REFERENCES location_states(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES location_cities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES location_districts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(32),
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(30),
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS location_set BOOLEAN NOT NULL DEFAULT FALSE;

-- Allow unset region codes (remove hash dummy assignments).
ALTER TABLE user_gyms
  ALTER COLUMN country_code DROP DEFAULT,
  ALTER COLUMN metro_code DROP DEFAULT,
  ALTER COLUMN district_code DROP DEFAULT;

ALTER TABLE user_gyms
  ALTER COLUMN country_code DROP NOT NULL,
  ALTER COLUMN metro_code DROP NOT NULL,
  ALTER COLUMN district_code DROP NOT NULL;

UPDATE user_gyms
SET country_code = NULL,
    metro_code = NULL,
    district_code = NULL,
    location_set = FALSE
WHERE location_set = FALSE
   OR metro_code IS DISTINCT FROM NULL
   OR district_code IS DISTINCT FROM NULL
   OR country_code IS NOT NULL;

-- Force-clear previous hash backfill for all personal gyms (real location must be set again).
UPDATE user_gyms
SET country_code = NULL,
    metro_code = NULL,
    district_code = NULL,
    state_id = NULL,
    city_id = NULL,
    district_id = NULL,
    location_set = FALSE;

CREATE INDEX IF NOT EXISTS idx_user_gyms_location_set
  ON user_gyms (location_set, country_code, metro_code, district_code);

-- ---------------------------------------------------------------------------
-- 4) Public gyms (catalog) optional hierarchy refs
-- ---------------------------------------------------------------------------
ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS state_id UUID REFERENCES location_states(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES location_cities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES location_districts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(32);

-- ---------------------------------------------------------------------------
-- 5) Seed countries (ISO subset + flags) and hierarchy samples
-- ---------------------------------------------------------------------------
INSERT INTO countries (code, name, default_timezone, flag_emoji, is_active, sort_order) VALUES
  ('KR', '{"ko":"대한민국","en":"South Korea"}', 'Asia/Seoul', '🇰🇷', TRUE, 10),
  ('US', '{"ko":"미국","en":"United States"}', 'America/New_York', '🇺🇸', TRUE, 20),
  ('JP', '{"ko":"일본","en":"Japan"}', 'Asia/Tokyo', '🇯🇵', TRUE, 30),
  ('CN', '{"ko":"중국","en":"China"}', 'Asia/Shanghai', '🇨🇳', TRUE, 40),
  ('GB', '{"ko":"영국","en":"United Kingdom"}', 'Europe/London', '🇬🇧', TRUE, 50),
  ('CA', '{"ko":"캐나다","en":"Canada"}', 'America/Toronto', '🇨🇦', TRUE, 60),
  ('AU', '{"ko":"호주","en":"Australia"}', 'Australia/Sydney', '🇦🇺', TRUE, 70),
  ('DE', '{"ko":"독일","en":"Germany"}', 'Europe/Berlin', '🇩🇪', TRUE, 80),
  ('FR', '{"ko":"프랑스","en":"France"}', 'Europe/Paris', '🇫🇷', TRUE, 90),
  ('SG', '{"ko":"싱가포르","en":"Singapore"}', 'Asia/Singapore', '🇸🇬', TRUE, 100),
  ('TH', '{"ko":"태국","en":"Thailand"}', 'Asia/Bangkok', '🇹🇭', TRUE, 110),
  ('VN', '{"ko":"베트남","en":"Vietnam"}', 'Asia/Ho_Chi_Minh', '🇻🇳', TRUE, 120),
  ('IN', '{"ko":"인도","en":"India"}', 'Asia/Kolkata', '🇮🇳', TRUE, 130),
  ('BR', '{"ko":"브라질","en":"Brazil"}', 'America/Sao_Paulo', '🇧🇷', TRUE, 140),
  ('MX', '{"ko":"멕시코","en":"Mexico"}', 'America/Mexico_City', '🇲🇽', TRUE, 150),
  ('TW', '{"ko":"대만","en":"Taiwan"}', 'Asia/Taipei', '🇹🇼', TRUE, 160),
  ('HK', '{"ko":"홍콩","en":"Hong Kong"}', 'Asia/Hong_Kong', '🇭🇰', TRUE, 170),
  ('PH', '{"ko":"필리핀","en":"Philippines"}', 'Asia/Manila', '🇵🇭', TRUE, 180),
  ('ID', '{"ko":"인도네시아","en":"Indonesia"}', 'Asia/Jakarta', '🇮🇩', TRUE, 190),
  ('MY', '{"ko":"말레이시아","en":"Malaysia"}', 'Asia/Kuala_Lumpur', '🇲🇾', TRUE, 200),
  ('NZ', '{"ko":"뉴질랜드","en":"New Zealand"}', 'Pacific/Auckland', '🇳🇿', TRUE, 210),
  ('ES', '{"ko":"스페인","en":"Spain"}', 'Europe/Madrid', '🇪🇸', TRUE, 220),
  ('IT', '{"ko":"이탈리아","en":"Italy"}', 'Europe/Rome', '🇮🇹', TRUE, 230),
  ('NL', '{"ko":"네덜란드","en":"Netherlands"}', 'Europe/Amsterdam', '🇳🇱', TRUE, 240),
  ('SE', '{"ko":"스웨덴","en":"Sweden"}', 'Europe/Stockholm', '🇸🇪', TRUE, 250),
  ('AE', '{"ko":"아랍에미리트","en":"United Arab Emirates"}', 'Asia/Dubai', '🇦🇪', TRUE, 260)
ON CONFLICT (code) DO UPDATE SET
  flag_emoji = EXCLUDED.flag_emoji,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  name = EXCLUDED.name,
  default_timezone = EXCLUDED.default_timezone;

-- Helper: upsert state
CREATE TEMP TABLE _seed_states (
  country_code CHAR(2),
  code VARCHAR(40),
  name_ko TEXT,
  name_en TEXT,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  sort_order INT
) ON COMMIT DROP;

INSERT INTO _seed_states VALUES
  -- Korea metros
  ('KR','seoul','서울특별시','Seoul',37.5665,126.9780,10),
  ('KR','gyeonggi','경기도','Gyeonggi',37.4138,127.5183,20),
  ('KR','busan','부산광역시','Busan',35.1796,129.0756,30),
  ('KR','incheon','인천광역시','Incheon',37.4563,126.7052,40),
  ('KR','daegu','대구광역시','Daegu',35.8714,128.6014,50),
  ('KR','daejeon','대전광역시','Daejeon',36.3504,127.3845,60),
  ('KR','gwangju','광주광역시','Gwangju',35.1595,126.8526,70),
  ('KR','ulsan','울산광역시','Ulsan',35.5384,129.3114,80),
  ('KR','sejong','세종특별자치시','Sejong',36.4800,127.2890,90),
  ('KR','gangwon','강원특별자치도','Gangwon',37.8228,128.1555,100),
  ('KR','chungbuk','충청북도','Chungbuk',36.8000,127.7000,110),
  ('KR','chungnam','충청남도','Chungnam',36.5184,126.8000,120),
  ('KR','jeonbuk','전북특별자치도','Jeonbuk',35.8200,127.1500,130),
  ('KR','jeonnam','전라남도','Jeonnam',34.8679,126.9910,140),
  ('KR','gyeongbuk','경상북도','Gyeongbuk',36.4919,128.8889,150),
  ('KR','gyeongnam','경상남도','Gyeongnam',35.4606,128.2132,160),
  ('KR','jeju','제주특별자치도','Jeju',33.4996,126.5312,170),
  -- US states (major)
  ('US','ca','캘리포니아','California',36.7783,-119.4179,10),
  ('US','ny','뉴욕','New York',40.7128,-74.0060,20),
  ('US','tx','텍사스','Texas',31.9686,-99.9018,30),
  ('US','wa','워싱턴','Washington',47.7511,-120.7401,40),
  ('US','fl','플로리다','Florida',27.6648,-81.5158,50),
  ('US','il','일리노이','Illinois',40.6331,-89.3985,60),
  -- Japan prefectures (major)
  ('JP','tokyo','도쿄','Tokyo',35.6762,139.6503,10),
  ('JP','osaka','오사카','Osaka',34.6937,135.5023,20),
  ('JP','kanagawa','가나가와','Kanagawa',35.4478,139.6425,30),
  ('JP','aichi','아이치','Aichi',35.1802,136.9066,40),
  -- Others
  ('GB','england','잉글랜드','England',51.5074,-0.1278,10),
  ('SG','sg','싱가포르','Singapore',1.3521,103.8198,10),
  ('AU','nsw','뉴사우스웨일스','New South Wales',-33.8688,151.2093,10),
  ('CA','on','온타리오','Ontario',43.6532,-79.3832,10),
  ('DE','be','베를린','Berlin',52.5200,13.4050,10),
  ('FR','idf','일드프랑스','Île-de-France',48.8566,2.3522,10),
  ('TH','bkk','방콕','Bangkok',13.7563,100.5018,10),
  ('VN','hn','하노이','Hanoi',21.0278,105.8342,10),
  ('VN','hcm','호치민','Ho Chi Minh City',10.8231,106.6297,20);

INSERT INTO location_states (country_code, code, name, latitude, longitude, sort_order)
SELECT country_code, code,
       jsonb_build_object('ko', name_ko, 'en', name_en),
       lat, lng, sort_order
FROM _seed_states
ON CONFLICT (country_code, code) DO UPDATE SET
  name = EXCLUDED.name,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE;

CREATE TEMP TABLE _seed_cities (
  country_code CHAR(2),
  state_code VARCHAR(40),
  code VARCHAR(40),
  name_ko TEXT,
  name_en TEXT,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  sort_order INT
) ON COMMIT DROP;

INSERT INTO _seed_cities VALUES
  -- Seoul districts as cities for LIVE drill-down
  ('KR','seoul','gangnam','강남구','Gangnam-gu',37.5172,127.0473,10),
  ('KR','seoul','gangseo','강서구','Gangseo-gu',37.5509,126.8495,20),
  ('KR','seoul','mapo','마포구','Mapo-gu',37.5663,126.9019,30),
  ('KR','seoul','songpa','송파구','Songpa-gu',37.5145,127.1059,40),
  ('KR','seoul','nowon','노원구','Nowon-gu',37.6542,127.0568,50),
  ('KR','seoul','yongsan','용산구','Yongsan-gu',37.5384,126.9654,60),
  ('KR','seoul','jongno','종로구','Jongno-gu',37.5735,126.9788,70),
  ('KR','seoul','jung','중구','Jung-gu',37.5636,126.9970,80),
  ('KR','gyeonggi','suwon','수원시','Suwon',37.2636,127.0286,10),
  ('KR','gyeonggi','seongnam','성남시','Seongnam',37.4201,127.1262,20),
  ('KR','gyeonggi','goyang','고양시','Goyang',37.6584,126.8320,30),
  ('KR','gyeonggi','bucheon','부천시','Bucheon',37.5034,126.7660,40),
  ('KR','gyeonggi','yongin','용인시','Yongin',37.2411,127.1776,50),
  ('KR','busan','haeundae','해운대구','Haeundae-gu',35.1631,129.1635,10),
  ('KR','busan','busanjin','부산진구','Busanjin-gu',35.1629,129.0532,20),
  ('KR','incheon','yeonsu','연수구','Yeonsu-gu',37.4101,126.6783,10),
  ('US','ca','los-angeles','로스앤젤레스','Los Angeles',34.0522,-118.2437,10),
  ('US','ca','san-francisco','샌프란시스코','San Francisco',37.7749,-122.4194,20),
  ('US','ca','san-diego','샌디에이고','San Diego',32.7157,-117.1611,30),
  ('US','ny','new-york-city','뉴욕시','New York City',40.7128,-74.0060,10),
  ('US','tx','austin','오스틴','Austin',30.2672,-97.7431,10),
  ('US','wa','seattle','시애틀','Seattle',47.6062,-122.3321,10),
  ('JP','tokyo','shinjuku','신주쿠','Shinjuku',35.6938,139.7034,10),
  ('JP','tokyo','shibuya','시부야','Shibuya',35.6595,139.7004,20),
  ('JP','tokyo','minato','미나토','Minato',35.6581,139.7514,30),
  ('JP','osaka','osaka-city','오사카시','Osaka City',34.6937,135.5023,10),
  ('GB','england','london','런던','London',51.5074,-0.1278,10),
  ('SG','sg','central','센트럴','Central',1.3000,103.8000,10),
  ('AU','nsw','sydney','시드니','Sydney',-33.8688,151.2093,10),
  ('CA','on','toronto','토론토','Toronto',43.6532,-79.3832,10),
  ('DE','be','berlin-city','베를린','Berlin',52.5200,13.4050,10),
  ('FR','idf','paris','파리','Paris',48.8566,2.3522,10),
  ('TH','bkk','bangkok-city','방콕','Bangkok',13.7563,100.5018,10),
  ('VN','hn','hanoi-city','하노이','Hanoi',21.0278,105.8342,10),
  ('VN','hcm','hcmc','호치민','Ho Chi Minh City',10.8231,106.6297,10);

INSERT INTO location_cities (state_id, code, name, latitude, longitude, sort_order)
SELECT s.id, c.code,
       jsonb_build_object('ko', c.name_ko, 'en', c.name_en),
       c.lat, c.lng, c.sort_order
FROM _seed_cities c
JOIN location_states s ON s.country_code = c.country_code AND s.code = c.state_code
ON CONFLICT (state_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE;

-- Sample districts under Gangseo (optional level)
INSERT INTO location_districts (city_id, code, name, latitude, longitude, sort_order)
SELECT ci.id, d.code, jsonb_build_object('ko', d.name_ko, 'en', d.name_en), d.lat, d.lng, d.sort_order
FROM (VALUES
  ('yeomchang','염창동','Yeomchang-dong',37.5469,126.8746,10),
  ('deungchon','등촌동','Deungchon-dong',37.5507,126.8630,20),
  ('gayang','가양동','Gayang-dong',37.5615,126.8540,30)
) AS d(code, name_ko, name_en, lat, lng, sort_order)
JOIN location_states st ON st.country_code = 'KR' AND st.code = 'seoul'
JOIN location_cities ci ON ci.state_id = st.id AND ci.code = 'gangseo'
ON CONFLICT (city_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  is_active = TRUE;
