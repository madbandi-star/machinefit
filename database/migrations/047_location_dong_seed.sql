-- Seed more KR dong-level districts + optional free-text district_name

ALTER TABLE user_locations
  ADD COLUMN IF NOT EXISTS district_name VARCHAR(120);

ALTER TABLE user_gyms
  ADD COLUMN IF NOT EXISTS district_name VARCHAR(120);

ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS district_name VARCHAR(120);

-- Helper seed: (city_code, dong_code, name_ko, name_en, lat, lng, sort)
CREATE TEMP TABLE _seed_dongs (
  city_code VARCHAR(40),
  code VARCHAR(40),
  name_ko TEXT,
  name_en TEXT,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  sort_order INT
) ON COMMIT DROP;

INSERT INTO _seed_dongs VALUES
  -- 강서구
  ('gangseo','yeomchang','염창동','Yeomchang-dong',37.5469,126.8746,10),
  ('gangseo','deungchon','등촌동','Deungchon-dong',37.5507,126.8630,20),
  ('gangseo','gayang','가양동','Gayang-dong',37.5615,126.8540,30),
  ('gangseo','hwagok','화곡동','Hwagok-dong',37.5416,126.8403,40),
  ('gangseo','banghwa','방화동','Banghwa-dong',37.5770,126.8125,50),
  ('gangseo','gonghang','공항동','Gonghang-dong',37.5585,126.8105,60),
  ('gangseo','magok','마곡동','Magok-dong',37.5663,126.8275,70),
  -- 강남구
  ('gangnam','yeoksam','역삼동','Yeoksam-dong',37.5009,127.0374,10),
  ('gangnam','samsung','삼성동','Samseong-dong',37.5140,127.0565,20),
  ('gangnam','cheongdam','청담동','Cheongdam-dong',37.5194,127.0474,30),
  ('gangnam','apgujeong','압구정동','Apgujeong-dong',37.5270,127.0286,40),
  ('gangnam','daeichi','대치동','Daechi-dong',37.4945,127.0620,50),
  ('gangnam','nonhyeon','논현동','Nonhyeon-dong',37.5100,127.0260,60),
  ('gangnam','sinsa','신사동','Sinsa-dong',37.5165,127.0200,70),
  -- 마포구
  ('mapo','sangam','상암동','Sangam-dong',37.5790,126.8900,10),
  ('mapo','hapjeong','합정동','Hapjeong-dong',37.5494,126.9139,20),
  ('mapo','hongdae','서교동','Seogyo-dong',37.5547,126.9220,30),
  ('mapo','mangwon','망원동','Mangwon-dong',37.5560,126.9100,40),
  ('mapo','yeonnam','연남동','Yeonnam-dong',37.5662,126.9250,50),
  -- 송파구
  ('songpa','jamsil','잠실동','Jamsil-dong',37.5133,127.1001,10),
  ('songpa','songpa','송파동','Songpa-dong',37.5035,127.1120,20),
  ('songpa','garak','가락동','Garak-dong',37.4940,127.1180,30),
  ('songpa','munjeong','문정동','Munjeong-dong',37.4850,127.1220,40),
  ('songpa','olympic','방이동','Bangi-dong',37.5150,127.1260,50),
  -- 노원구
  ('nowon','sanggye','상계동','Sanggye-dong',37.6542,127.0610,10),
  ('nowon','junggye','중계동','Junggye-dong',37.6480,127.0740,20),
  ('nowon','hagye','하계동','Hagye-dong',37.6370,127.0680,30),
  ('nowon','gongneung','공릉동','Gongneung-dong',37.6250,127.0730,40),
  -- 용산구
  ('yongsan','ichon','이촌동','Ichon-dong',37.5220,126.9740,10),
  ('yongsan','hannam','한남동','Hannam-dong',37.5340,127.0090,20),
  ('yongsan','itaewon','이태원동','Itaewon-dong',37.5345,126.9940,30),
  ('yongsan','huam','후암동','Huam-dong',37.5480,126.9780,40),
  -- 종로구
  ('jongno','samcheong','삼청동','Samcheong-dong',37.5820,126.9830,10),
  ('jongno','hyehwa','혜화동','Hyehwa-dong',37.5825,127.0010,20),
  ('jongno','gwanghwamun','세종로','Sejong-ro',37.5720,126.9760,30),
  -- 중구
  ('jung','myeongdong','명동','Myeong-dong',37.5636,126.9860,10),
  ('jung','euljiro','을지로동','Euljiro-dong',37.5660,126.9910,20),
  ('jung','hoehyun','회현동','Hoehyeon-dong',37.5580,126.9780,30),
  -- 수원
  ('suwon','yeongtong','영통동','Yeongtong-dong',37.2510,127.0710,10),
  ('suwon','inye','인계동','Ingye-dong',37.2630,127.0280,20),
  ('suwon','gwonseon','권선동','Gwonseon-dong',37.2570,127.0220,30),
  -- 성남
  ('seongnam','bundang','분당동','Bundang-dong',37.3820,127.1180,10),
  ('seongnam','jeongja','정자동','Jeongja-dong',37.3660,127.1080,20),
  ('seongnam','sunae','수내동','Sunae-dong',37.3780,127.1140,30),
  -- 해운대
  ('haeundae','udae','우동','U-dong',35.1630,129.1630,10),
  ('haeundae','jwa','좌동','Jwa-dong',35.1690,129.1760,20),
  ('haeundae','jung','중동','Jung-dong',35.1620,129.1635,30);

INSERT INTO location_districts (city_id, code, name, latitude, longitude, sort_order)
SELECT ci.id, d.code,
       jsonb_build_object('ko', d.name_ko, 'en', d.name_en),
       d.lat, d.lng, d.sort_order
FROM _seed_dongs d
JOIN location_states st ON st.country_code = 'KR' AND st.code IN (
  'seoul','gyeonggi','busan'
)
JOIN location_cities ci ON ci.state_id = st.id AND ci.code = d.city_code
ON CONFLICT (city_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE;
