-- Community / DC Inside 헬스갤 famous & high-end machine gyms (curated).
-- Upserts into gym_directory without touching owner-managed gyms.

INSERT INTO gym_directory (
  id, name, name_normalized, address, state_name, city_name, district_name,
  latitude, longitude, source, source_ref, is_active
)
VALUES
('687f72f4-5e3b-5e61-a40b-8243a0c367e0'::uuid, '올라잇짐 망포점', '올라잇짐망포점', '경기도 수원시 영통구 영통로 136', '경기도', '수원시 영통구', NULL, NULL, NULL, 'community_famous', 'dc:올라잇짐망포점:경기도:수원시 영통구', TRUE),
('ac457021-e25a-55bc-90ae-c36c0489f7b5'::uuid, '올라잇짐', '올라잇짐', '경기도 수원시 영통구 영통로 136', '경기도', '수원시 영통구', NULL, NULL, NULL, 'community_famous', 'dc:올라잇짐:경기도:수원시 영통구', TRUE),
('6ada594e-c0b7-5754-a2c9-0e41320a9478'::uuid, '올라잇짐 만덕점', '올라잇짐만덕점', '부산광역시 북구 만덕3로33번길 4-9', '부산광역시', '북구', NULL, NULL, NULL, 'community_famous', 'dc:올라잇짐만덕점:부산광역시:북구', TRUE),
('a662f2be-6be4-59fc-be2d-f413074c51d2'::uuid, '올라잇짐 나성점', '올라잇짐나성점', '세종특별자치시 한누리대로 253', '세종특별자치시', '세종시', NULL, NULL, NULL, 'community_famous', 'dc:올라잇짐나성점:세종특별자치시:세종시', TRUE),
('58eb3594-b766-5fd2-bdd3-6c5d9dd14232'::uuid, '지방부수리 불당점', '지방부수리불당점', '충청남도 천안시 서북구 검은들1길 26', '충청남도', '천안시 서북구', NULL, NULL, NULL, 'community_famous', 'dc:지방부수리불당점:충청남도:천안시 서북구', TRUE),
('bdc52882-9efd-5be0-87b3-547da53e0d4f'::uuid, '지방부수리', '지방부수리', '충청남도 천안시 서북구 검은들1길 26', '충청남도', '천안시 서북구', NULL, NULL, NULL, 'community_famous', 'dc:지방부수리:충청남도:천안시 서북구', TRUE),
('b8904baf-b179-58ae-b57d-fe43855a58d9'::uuid, '브이짐 김포점', '브이짐김포점', '경기도 김포시 풍무로 20', '경기도', '김포시', NULL, NULL, NULL, 'community_famous', 'dc:브이짐김포점:경기도:김포시', TRUE),
('f2e497a3-e813-5c4d-8416-b345a3514afd'::uuid, '브이짐', '브이짐', '경기도 김포시 풍무로 20', '경기도', '김포시', NULL, NULL, NULL, 'community_famous', 'dc:브이짐:경기도:김포시', TRUE),
('45b3cdf6-737d-5aeb-841e-cd3248b93431'::uuid, '피플짐 천안성정점', '피플짐천안성정점', '충청남도 천안시 서북구 동서대로 129-12', '충청남도', '천안시 서북구', NULL, NULL, NULL, 'community_famous', 'dc:피플짐천안성정점:충청남도:천안시 서북구', TRUE),
('02644651-4503-5d5a-ad44-848498e1a193'::uuid, '피플짐 천안점', '피플짐천안점', '충청남도 천안시 서북구 동서대로 129-12', '충청남도', '천안시 서북구', NULL, NULL, NULL, 'community_famous', 'dc:피플짐천안점:충청남도:천안시 서북구', TRUE),
('2a0f2cd9-cc10-5d6b-962a-a4002546825d'::uuid, '피플짐', '피플짐', '충청남도 천안시 서북구 동서대로 129-12', '충청남도', '천안시 서북구', NULL, NULL, NULL, 'community_famous', 'dc:피플짐:충청남도:천안시 서북구', TRUE),
('87a16b92-4d21-5e36-8dd1-b2b8a62dd45a'::uuid, '자마이카 신림점', '자마이카신림점', '서울특별시 관악구 신림로 340', '서울특별시', '관악구', NULL, NULL, NULL, 'community_famous', 'dc:자마이카신림점:서울특별시:관악구', TRUE),
('2f5576a6-79af-569e-a6a2-9bc52f6c9b0c'::uuid, '자마이카', '자마이카', '서울특별시 관악구 신림로 340', '서울특별시', '관악구', NULL, NULL, NULL, 'community_famous', 'dc:자마이카:서울특별시:관악구', TRUE),
('d9921373-80ef-5c9e-ac24-d7e3f6c306e0'::uuid, '자미이카 신림점', '자미이카신림점', '서울특별시 관악구 신림로 340', '서울특별시', '관악구', NULL, NULL, NULL, 'community_famous', 'dc:자미이카신림점:서울특별시:관악구', TRUE),
('d1db5bba-3359-5d7c-9b91-cb9fd81f774a'::uuid, '밀리언짐 회룡점', '밀리언짐회룡점', '경기도 의정부시 평화로 359', '경기도', '의정부시', NULL, NULL, NULL, 'community_famous', 'dc:밀리언짐회룡점:경기도:의정부시', TRUE),
('940325a8-560c-5902-a64b-618655a35e5a'::uuid, '밀리언짐 암사점', '밀리언짐암사점', '서울특별시 강동구 상암로3길 8', '서울특별시', '강동구', NULL, NULL, NULL, 'community_famous', 'dc:밀리언짐암사점:서울특별시:강동구', TRUE),
('5e642c45-142d-581a-b78f-31a46a387ae5'::uuid, '밀리언짐 목동점', '밀리언짐목동점', NULL, '서울특별시', '양천구', NULL, NULL, NULL, 'community_famous', 'dc:밀리언짐목동점:서울특별시:양천구', TRUE),
('6a7e5841-a653-5970-b933-52b7cf6025f9'::uuid, '밀리언짐 잠실점', '밀리언짐잠실점', NULL, '서울특별시', '송파구', NULL, NULL, NULL, 'community_famous', 'dc:밀리언짐잠실점:서울특별시:송파구', TRUE),
('afa7a7af-5eb5-58c8-94b4-7ef4b3a27bb3'::uuid, '밀리언짐 위례점', '밀리언짐위례점', NULL, '경기도', '성남시 수정구', NULL, NULL, NULL, 'community_famous', 'dc:밀리언짐위례점:경기도:성남시 수정구', TRUE),
('52862336-5df1-568f-b68f-508ee33249f9'::uuid, '밀리언짐 상계점', '밀리언짐상계점', NULL, '서울특별시', '노원구', NULL, NULL, NULL, 'community_famous', 'dc:밀리언짐상계점:서울특별시:노원구', TRUE),
('a61e5944-47bb-533e-a853-aaa5aaa42ee3'::uuid, '로드투짐 불당점', '로드투짐불당점', '충청남도 천안시 서북구 불당23로 73-27', '충청남도', '천안시 서북구', NULL, NULL, NULL, 'community_famous', 'dc:로드투짐불당점:충청남도:천안시 서북구', TRUE),
('d8401ad5-ca45-52b9-9be7-65054844abfd'::uuid, '로드투짐', '로드투짐', '충청남도 천안시 서북구 불당23로 73-27', '충청남도', '천안시 서북구', NULL, NULL, NULL, 'community_famous', 'dc:로드투짐:충청남도:천안시 서북구', TRUE),
('62750627-8f25-5c53-a09a-faa149dcc9bb'::uuid, '애니핏 하남점', '애니핏하남점', NULL, '경기도', '하남시', NULL, NULL, NULL, 'community_famous', 'dc:애니핏하남점:경기도:하남시', TRUE),
('2de41adb-d5ab-5080-ae8c-893c3fd8ab05'::uuid, '애니핏', '애니핏', NULL, '경기도', '하남시', NULL, NULL, NULL, 'community_famous', 'dc:애니핏:경기도:하남시', TRUE),
('af846874-aa54-5bb6-9d21-b0241fed349c'::uuid, '동아짐 시흥점', '동아짐시흥점', NULL, '경기도', '시흥시', NULL, NULL, NULL, 'community_famous', 'dc:동아짐시흥점:경기도:시흥시', TRUE),
('c62b46df-350e-51df-b5a8-4b4a8a9531a9'::uuid, '동아짐', '동아짐', NULL, '경기도', '시흥시', NULL, NULL, NULL, 'community_famous', 'dc:동아짐:경기도:시흥시', TRUE),
('f8ef4e3f-2848-53cf-bdb9-c4a630a60533'::uuid, '시그널 헬스장 부천', '시그널헬스장부천', NULL, '경기도', '부천시', NULL, NULL, NULL, 'community_famous', 'dc:시그널헬스장부천:경기도:부천시', TRUE),
('a19e5502-806c-5e34-a2da-3dd9f2fb7f59'::uuid, '시그널', '시그널', NULL, '경기도', '부천시', NULL, NULL, NULL, 'community_famous', 'dc:시그널:경기도:부천시', TRUE),
('790d9147-9aa4-5429-bbef-9ba778388852'::uuid, '매볼 배곧점', '매볼배곧점', NULL, '경기도', '시흥시', NULL, NULL, NULL, 'community_famous', 'dc:매볼배곧점:경기도:시흥시', TRUE),
('f51f3e11-84f1-53bd-919c-a4647277670b'::uuid, '매볼', '매볼', NULL, '경기도', '시흥시', NULL, NULL, NULL, 'community_famous', 'dc:매볼:경기도:시흥시', TRUE),
('584b1a9f-3283-5b61-b8c0-222cf24bf461'::uuid, '쏘마 일산점', '쏘마일산점', NULL, '경기도', '고양시 일산동구', NULL, NULL, NULL, 'community_famous', 'dc:쏘마일산점:경기도:고양시 일산동구', TRUE),
('abc4ebac-d7ce-52cf-9edf-0df51bf6fe59'::uuid, '쏘마', '쏘마', NULL, '경기도', '고양시 일산동구', NULL, NULL, NULL, 'community_famous', 'dc:쏘마:경기도:고양시 일산동구', TRUE),
('9d1c99e9-baf5-5d38-b5e2-d85025695236'::uuid, '바이칼 헬스장', '바이칼헬스장', NULL, '서울특별시', '강남구', NULL, NULL, NULL, 'community_famous', 'dc:바이칼헬스장:서울특별시:강남구', TRUE),
('1c90468b-e53c-58ff-ab89-4315be238325'::uuid, '짐80서울', '짐80서울', NULL, '서울특별시', '강남구', NULL, NULL, NULL, 'community_famous', 'dc:짐80서울:서울특별시:강남구', TRUE),
('6d93c29a-d4ad-5ed2-9728-839226aa65ac'::uuid, '콤마짐 망우역점', '콤마짐망우역점', NULL, '서울특별시', '성동구', NULL, NULL, NULL, 'community_famous', 'dc:콤마짐망우역점:서울특별시:성동구', TRUE),
('7c7ab441-d49d-5fed-b18d-03171853a1be'::uuid, '라이트짐 고덕2호점', '라이트짐고덕2호점', NULL, '경기도', '평택시', NULL, NULL, NULL, 'community_famous', 'dc:라이트짐고덕2호점:경기도:평택시', TRUE),
('19f219dc-860b-50dc-8761-b0023f48893e'::uuid, '머슬피플 청라점', '머슬피플청라점', NULL, '인천광역시', '서구', NULL, NULL, NULL, 'community_famous', 'dc:머슬피플청라점:인천광역시:서구', TRUE),
('fd42538a-035e-5bbf-ae30-186e8c3a6c49'::uuid, '디에이트짐 부천상동2호점', '디에이트짐부천상동2호점', NULL, '경기도', '부천시', NULL, NULL, NULL, 'community_famous', 'dc:디에이트짐부천상동2호점:경기도:부천시', TRUE),
('aeb1aada-f075-5f27-af06-32859bd8e5a1'::uuid, '트리오짐 강일점', '트리오짐강일점', NULL, '서울특별시', '강동구', NULL, NULL, NULL, 'community_famous', 'dc:트리오짐강일점:서울특별시:강동구', TRUE),
('1fe00ef1-ad13-57a5-ae5b-06b4254709ed'::uuid, '워라밸 피트니스 천호', '워라밸피트니스천호', NULL, '서울특별시', '강동구', NULL, NULL, NULL, 'community_famous', 'dc:워라밸피트니스천호:서울특별시:강동구', TRUE),
('49608b92-5683-5226-a2bc-0b5c5076051e'::uuid, '워라밸피트니스 방학역점', '워라밸피트니스방학역점', NULL, '서울특별시', '도봉구', NULL, NULL, NULL, 'community_famous', 'dc:워라밸피트니스방학역점:서울특별시:도봉구', TRUE),
('a1c2794c-2c07-5599-9b73-4e2f9d5434b0'::uuid, '파이어짐 오목교역점', '파이어짐오목교역점', NULL, '서울특별시', '양천구', NULL, NULL, NULL, 'community_famous', 'dc:파이어짐오목교역점:서울특별시:양천구', TRUE),
('b2f6e4b7-1eca-524e-9533-762fd0b04626'::uuid, '라이언짐 암사역점', '라이언짐암사역점', NULL, '서울특별시', '강동구', NULL, NULL, NULL, 'community_famous', 'dc:라이언짐암사역점:서울특별시:강동구', TRUE),
('fddff688-ec17-50b5-afcb-e0ef040aaeea'::uuid, '핏좋아짐 거북섬점', '핏좋아짐거북섬점', NULL, '경기도', '시흥시', NULL, NULL, NULL, 'community_famous', 'dc:핏좋아짐거북섬점:경기도:시흥시', TRUE),
('ad8fe806-c714-5663-91d9-18bc9d525fa9'::uuid, '짐라이트 고척점', '짐라이트고척점', NULL, '서울특별시', '구로구', NULL, NULL, NULL, 'community_famous', 'dc:짐라이트고척점:서울특별시:구로구', TRUE),
('37c16822-0cda-565f-8418-57af26d0c92d'::uuid, '쿠키짐', '쿠키짐', NULL, '충청북도', '청주시', NULL, NULL, NULL, 'community_famous', 'dc:쿠키짐:충청북도:청주시', TRUE),
('b24da7ad-80f0-50aa-9a02-bb213c46eba3'::uuid, '호크아이짐', '호크아이짐', NULL, '강원특별자치도', '원주시', NULL, NULL, NULL, 'community_famous', 'dc:호크아이짐:강원특별자치도:원주시', TRUE),
('56d19d75-afa9-57c7-8a3e-c495641e955e'::uuid, '올인짐 의정부본점', '올인짐의정부본점', NULL, '경기도', '의정부시', NULL, NULL, NULL, 'community_famous', 'dc:올인짐의정부본점:경기도:의정부시', TRUE),
('8598ecb6-be66-51b1-a032-1e4bbc409668'::uuid, '빌리언짐 호암점', '빌리언짐호암점', NULL, '충청북도', '충주시', NULL, NULL, NULL, 'community_famous', 'dc:빌리언짐호암점:충청북도:충주시', TRUE),
('cf8e6e41-51cd-5aba-a778-665541950c73'::uuid, '제이피트니스 개금점', '제이피트니스개금점', NULL, '부산광역시', '부산진구', NULL, NULL, NULL, 'community_famous', 'dc:제이피트니스개금점:부산광역시:부산진구', TRUE),
('1dcc02b0-27fc-55b5-8b27-98cca8e4a0e3'::uuid, '비해피휘트니스 수영점', '비해피휘트니스수영점', NULL, '부산광역시', '수영구', NULL, NULL, NULL, 'community_famous', 'dc:비해피휘트니스수영점:부산광역시:수영구', TRUE),
('000371d7-c0ad-5adc-a01f-4763947fd167'::uuid, '피트니스인앤스타 서면점', '피트니스인앤스타서면점', NULL, '부산광역시', '부산진구', NULL, NULL, NULL, 'community_famous', 'dc:피트니스인앤스타서면점:부산광역시:부산진구', TRUE),
('14fc2b03-8a61-58b7-b5af-af30cd0cd99a'::uuid, '피트니스인앤스타 부산대점', '피트니스인앤스타부산대점', NULL, '부산광역시', '금정구', NULL, NULL, NULL, 'community_famous', 'dc:피트니스인앤스타부산대점:부산광역시:금정구', TRUE),
('2338ed7e-0704-50ac-a023-d09f262352f0'::uuid, '더플레이짐 농성점', '더플레이짐농성점', NULL, '광주광역시', '서구', NULL, NULL, NULL, 'community_famous', 'dc:더플레이짐농성점:광주광역시:서구', TRUE),
('7cb97fcc-750d-5166-b657-f03e274f1995'::uuid, '바이브피트니스 첨단2지구점', '바이브피트니스첨단2지구점', NULL, '광주광역시', '북구', NULL, NULL, NULL, 'community_famous', 'dc:바이브피트니스첨단2지구점:광주광역시:북구', TRUE),
('35ac0dfa-19bc-548f-a173-38325a136416'::uuid, '정관장GYM 죽림점', '정관장gym죽림점', NULL, '경상남도', '통영시', NULL, NULL, NULL, 'community_famous', 'dc:정관장gym죽림점:경상남도:통영시', TRUE),
('200444b7-f98b-579a-9579-3ac7bb0b6cf2'::uuid, '트리트라움 웰니스 피트니스', '트리트라움웰니스피트니스', NULL, '강원특별자치도', '동해시', NULL, NULL, NULL, 'community_famous', 'dc:트리트라움웰니스피트니스:강원특별자치도:동해시', TRUE)
ON CONFLICT (source, source_ref) DO UPDATE SET
  name = EXCLUDED.name,
  name_normalized = EXCLUDED.name_normalized,
  address = COALESCE(EXCLUDED.address, gym_directory.address),
  state_name = COALESCE(EXCLUDED.state_name, gym_directory.state_name),
  city_name = COALESCE(EXCLUDED.city_name, gym_directory.city_name),
  district_name = COALESCE(EXCLUDED.district_name, gym_directory.district_name),
  is_active = TRUE,
  updated_at = NOW();


UPDATE gym_directory d
SET state_id = s.id,
    state_name = COALESCE(d.state_name, s.name->>'ko')
FROM location_states s
WHERE d.source = 'community_famous'
  AND d.state_id IS NULL
  AND d.state_name IS NOT NULL
  AND s.country_code = 'KR'
  AND (
    d.state_name ILIKE '%' || (s.name->>'ko') || '%'
    OR (s.name->>'ko') ILIKE '%' || d.state_name || '%'
  );

UPDATE gym_directory d
SET city_id = c.id,
    city_name = COALESCE(d.city_name, c.name->>'ko'),
    state_id = COALESCE(d.state_id, c.state_id)
FROM location_cities c
JOIN location_states s ON s.id = c.state_id AND s.country_code = 'KR'
WHERE d.source = 'community_famous'
  AND d.city_id IS NULL
  AND d.city_name IS NOT NULL
  AND (
    d.city_name ILIKE '%' || (c.name->>'ko') || '%'
    OR (c.name->>'ko') ILIKE '%' || d.city_name || '%'
  )
  AND (d.state_id IS NULL OR c.state_id = d.state_id);

UPDATE gym_directory d
SET district_id = dist.id,
    district_name = COALESCE(d.district_name, dist.name->>'ko')
FROM location_districts dist
JOIN location_cities c ON c.id = dist.city_id
WHERE d.source = 'community_famous'
  AND d.district_id IS NULL
  AND d.district_name IS NOT NULL
  AND d.city_id IS NOT NULL
  AND dist.city_id = d.city_id
  AND (
    d.district_name ILIKE '%' || (dist.name->>'ko') || '%'
    OR (dist.name->>'ko') ILIKE '%' || d.district_name || '%'
  );

