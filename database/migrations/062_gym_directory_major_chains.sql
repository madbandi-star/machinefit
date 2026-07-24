-- Major Korean gym chains (Gymbox official index + Healthboy curated).
-- Upserts into gym_directory without touching owner-managed gyms.

INSERT INTO gym_directory (
  id, name, name_normalized, address, state_name, city_name, district_name,
  latitude, longitude, source, source_ref, is_active
)
VALUES
('3223ba85-1912-5c96-ad65-e14631903249'::uuid, '짐박스 가양점', '짐박스가양점', NULL, '서울특별시', '강서구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/64', TRUE),
('5db2719e-b2b6-5f78-a7cd-20dca9a7c97d'::uuid, '짐박스 강남1호점', '짐박스강남1호점', NULL, '서울특별시', '강남구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/46', TRUE),
('eddb941c-06e0-51a7-880e-5d0cd2036339'::uuid, '짐박스 강남2호점', '짐박스강남2호점', NULL, '서울특별시', '강남구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/73', TRUE),
('a2a2921a-050f-5a01-a515-44065eb07252'::uuid, '짐박스 강남3호점', '짐박스강남3호점', NULL, '서울특별시', '강남구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/88', TRUE),
('abb8a785-eff1-50f3-a0d1-5db4df43a71f'::uuid, '짐박스 건대입구점', '짐박스건대입구점', NULL, '서울특별시', '광진구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/69', TRUE),
('d4c9951a-514c-51f6-9a5e-c0b3dbbfc7bd'::uuid, '짐박스 광명하안점', '짐박스광명하안점', NULL, '경기도', '광명시', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/45', TRUE),
('be6c3658-7263-53ba-a94e-847b19bf4c8d'::uuid, '짐박스 구로구청점', '짐박스구로구청점', NULL, '서울특별시', '구로구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/84', TRUE),
('8703e9e0-be18-542d-a708-d6abd249e411'::uuid, '짐박스 구로디지털단지점', '짐박스구로디지털단지점', NULL, '서울특별시', '구로구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/28', TRUE),
('90161e58-6316-5ac3-ab40-ab6d308155df'::uuid, '짐박스 길음역점', '짐박스길음역점', NULL, '서울특별시', '성북구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/78', TRUE),
('8d8af8dc-8dd2-57d3-9b43-9fe8c9e4f250'::uuid, '짐박스 까치산점', '짐박스까치산점', NULL, '서울특별시', '강서구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/57', TRUE),
('d0f113ea-43bd-5554-a99d-37e116613489'::uuid, '짐박스 낙성대점', '짐박스낙성대점', NULL, '서울특별시', '관악구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/41', TRUE),
('4473e67a-d692-5897-9a16-135251646632'::uuid, '짐박스 난곡점', '짐박스난곡점', NULL, '서울특별시', '관악구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/30', TRUE),
('bca5796d-ffd0-520c-acee-8efae3c9e523'::uuid, '짐박스 노원역점', '짐박스노원역점', NULL, '서울특별시', '노원구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/63', TRUE),
('aee1500b-fe8c-5405-b7d8-abe6944532f6'::uuid, '짐박스 마포래미안푸르지오점', '짐박스마포래미안푸르지오점', NULL, '서울특별시', '마포구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/83', TRUE),
('09212522-62e1-527b-9d29-3ae42cb42e89'::uuid, '짐박스 망원점', '짐박스망원점', NULL, '서울특별시', '마포구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/70', TRUE),
('7920fbc4-6974-5982-9f04-f4b87e5bd7aa'::uuid, '짐박스 미아사거리역점', '짐박스미아사거리역점', NULL, '서울특별시', '강북구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/79', TRUE),
('3fb1cb30-41c4-5a34-920a-4d8bf2bbf353'::uuid, '짐박스 방배점', '짐박스방배점', NULL, '서울특별시', '서초구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/74', TRUE),
('0188ea48-f7b6-54b8-8197-f5f514041bb4'::uuid, '짐박스 방화역점', '짐박스방화역점', NULL, '서울특별시', '강서구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/58', TRUE),
('87c85825-2e54-567d-b918-456d4b0e43cb'::uuid, '짐박스 보라매점', '짐박스보라매점', NULL, '서울특별시', '영등포구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/52', TRUE),
('a4f36c4f-cbaa-52b3-8be4-5144e766778e'::uuid, '짐박스 봉천점', '짐박스봉천점', NULL, '서울특별시', '관악구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/29', TRUE),
('4df4bdc6-ee33-5415-ba15-a24137591c7f'::uuid, '짐박스 봉천현대시장점', '짐박스봉천현대시장점', NULL, '서울특별시', '관악구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/50', TRUE),
('c925a5af-6cce-5726-875e-22cfc058d857'::uuid, '짐박스 부천점', '짐박스부천점', NULL, '경기도', '부천시', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/48', TRUE),
('b3a6e41b-534e-51f1-9fc8-6e80be689891'::uuid, '짐박스 부평시장역점', '짐박스부평시장역점', NULL, '인천광역시', '부평구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/72', TRUE),
('d85b20e8-1393-54d1-85a7-9b604c4880a4'::uuid, '짐박스 사당1호점', '짐박스사당1호점', NULL, '서울특별시', '동작구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/54', TRUE),
('8844a75d-94af-5275-83ba-cb7e207dd8ce'::uuid, '짐박스 사당2호점', '짐박스사당2호점', NULL, '서울특별시', '동작구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/55', TRUE),
('7b450564-9b4a-5cbf-acba-700ffff251e4'::uuid, '짐박스 상암DMC점', '짐박스상암dmc점', NULL, '서울특별시', '마포구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/44', TRUE),
('15697838-9e14-5724-a7c8-0a9cff196331'::uuid, '짐박스 서면점', '짐박스서면점', NULL, '부산광역시', '부산진구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/43', TRUE),
('8550c253-2e25-5843-84a2-9fd7b66aadd7'::uuid, '짐박스 서울대기숙사점', '짐박스서울대기숙사점', NULL, '서울특별시', '관악구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/62', TRUE),
('18f2e0dc-7fee-5d2e-aaaa-1e440dd92c9f'::uuid, '짐박스 서울대입구2호점', '짐박스서울대입구2호점', NULL, '서울특별시', '관악구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/85', TRUE),
('50fe7bd0-f0e3-5b68-ba0d-d326ab889be5'::uuid, '짐박스 서울대입구점', '짐박스서울대입구점', NULL, '서울특별시', '관악구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/47', TRUE),
('dc3ec1bd-ca84-5c95-ab80-cdacd7955fc8'::uuid, '짐박스 성신여대점', '짐박스성신여대점', NULL, '서울특별시', '성북구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/53', TRUE),
('eb749fe4-a4cf-5a51-9bd8-001c3e24b279'::uuid, '짐박스 송파점', '짐박스송파점', NULL, '서울특별시', '송파구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/92', TRUE),
('66feb6f5-633c-5681-a206-35cd2c4df78a'::uuid, '짐박스 신대방점', '짐박스신대방점', NULL, '서울특별시', '동작구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/40', TRUE),
('99f8e598-1885-55a6-a796-4242e01cebeb'::uuid, '짐박스 신림2호점', '짐박스신림2호점', NULL, '서울특별시', '관악구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/33', TRUE),
('74991ee0-f94e-5f94-8095-cc53652b950b'::uuid, '짐박스 신림3호점', '짐박스신림3호점', NULL, '서울특별시', '관악구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/32', TRUE),
('319f3f23-141e-56aa-9771-2f57eb559d14'::uuid, '짐박스 신림4호점', '짐박스신림4호점', NULL, '서울특별시', '관악구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/31', TRUE),
('087b4bb2-e645-5ce0-8582-c68be6b4bac7'::uuid, '짐박스 신림본점', '짐박스신림본점', NULL, '서울특별시', '관악구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/65', TRUE),
('44bdc0e5-ca35-544f-a18c-a7b41de9c994'::uuid, '짐박스 신림본점', '짐박스신림본점', NULL, '서울특별시', '관악구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/35', TRUE),
('12462374-ae70-56ee-951a-5bf2062a4963'::uuid, '짐박스 신림역점', '짐박스신림역점', NULL, '서울특별시', '관악구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/42', TRUE),
('11812097-8e87-5cf3-9e23-7a1cb000fb4a'::uuid, '짐박스 신월점', '짐박스신월점', NULL, '서울특별시', '양천구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/89', TRUE),
('60934a68-6580-5299-85c1-cf011d830d6a'::uuid, '짐박스 신촌점', '짐박스신촌점', NULL, '서울특별시', '서대문구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/87', TRUE),
('95e4e552-c5b5-5657-b126-7f84814524ac'::uuid, '짐박스 쌍문점', '짐박스쌍문점', NULL, '서울특별시', '도봉구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/66', TRUE),
('03569ea0-912e-50ba-af9d-a0a018cc2909'::uuid, '짐박스 암사역점', '짐박스암사역점', NULL, '서울특별시', '강동구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/81', TRUE),
('1540f168-b53b-5a11-bc5d-9ebe5883b692'::uuid, '짐박스 어린이대공원점', '짐박스어린이대공원점', NULL, '서울특별시', '광진구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/56', TRUE),
('3a3972e1-851f-50b6-b6ae-a3fdb1022e81'::uuid, '짐박스 여의도점', '짐박스여의도점', NULL, '서울특별시', '영등포구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/71', TRUE),
('9e53046c-27ec-5147-8072-47e11e6741ed'::uuid, '짐박스 연신내점', '짐박스연신내점', NULL, '서울특별시', '은평구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/67', TRUE),
('71a5b70a-ac22-5a27-a645-baae1ea00769'::uuid, '짐박스 오금역점', '짐박스오금역점', NULL, '서울특별시', '송파구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/86', TRUE),
('270e20d3-f2a8-5374-ae25-f869664aeeac'::uuid, '짐박스 오리역점', '짐박스오리역점', NULL, '경기도', '성남시', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/76', TRUE),
('e33c7f0a-086e-54f2-be64-30be190b025f'::uuid, '짐박스 용인역북점', '짐박스용인역북점', NULL, '경기도', '용인시', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/91', TRUE),
('feeabd87-ccb8-5efc-86d9-6a825e60e80a'::uuid, '짐박스 원종점', '짐박스원종점', NULL, '경기도', '부천시', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/59', TRUE),
('50a3d6af-15c8-5fa4-b30c-630908094c3f'::uuid, '짐박스 응암1호점', '짐박스응암1호점', NULL, '서울특별시', '은평구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/60', TRUE),
('87416787-2cf0-5c78-8933-76f02dcb471c'::uuid, '짐박스 응암2호점', '짐박스응암2호점', NULL, '서울특별시', '은평구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/61', TRUE),
('d316ffd2-b27d-5ab1-8bd8-8d199c4c3e08'::uuid, '짐박스 일원역점', '짐박스일원역점', NULL, '서울특별시', '강남구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/68', TRUE),
('1a179339-6a30-5cbd-886a-73eaccaf6cdb'::uuid, '짐박스 잠실새내점', '짐박스잠실새내점', NULL, '서울특별시', '송파구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/75', TRUE),
('cf695785-8ebe-545a-a381-1d15f813a3f8'::uuid, '짐박스 장승배기점', '짐박스장승배기점', NULL, '서울특별시', '동작구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/90', TRUE),
('a6ec2445-cbea-5e23-a842-0565121133b3'::uuid, '짐박스 종암점', '짐박스종암점', NULL, '서울특별시', '성북구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/77', TRUE),
('3911ef16-d32d-5c6b-86b7-d6036283c68e'::uuid, '짐박스 철산점', '짐박스철산점', NULL, '경기도', '광명시', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/49', TRUE),
('cf7759de-6a41-51c4-88e0-411c819a687d'::uuid, '짐박스 탄현제니스점', '짐박스탄현제니스점', NULL, '경기도', '고양시', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/80', TRUE),
('06e135e6-7569-50ef-a3e9-b47a1593af87'::uuid, '짐박스 평촌점', '짐박스평촌점', NULL, '경기도', '안양시', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/51', TRUE),
('602b3148-79de-544b-913d-0e49606b5a61'::uuid, '짐박스 홍대입구점', '짐박스홍대입구점', NULL, '서울특별시', '마포구', NULL, NULL, NULL, 'official_chain', 'gymboxx:/gym/82', TRUE),
('f4d09406-fcfe-567d-8553-48c0d794bb01'::uuid, '헬스보이짐', '헬스보이짐', NULL, NULL, NULL, NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐', TRUE),
('e991e3b7-87c1-52fd-93f6-8571d485dd78'::uuid, '헬스보이짐 가락점', '헬스보이짐가락점', NULL, '서울특별시', '송파구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐가락점', TRUE),
('4a9bfbef-6571-52d2-a995-f0f152672ef1'::uuid, '헬스보이짐 가산역점', '헬스보이짐가산역점', NULL, '서울특별시', '금천구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐가산역점', TRUE),
('0eb23a25-3b8c-56a6-8bb5-77395da0b83d'::uuid, '헬스보이짐 강남점', '헬스보이짐강남점', NULL, '서울특별시', '강남구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐강남점', TRUE),
('0dbbdf05-f73d-5f16-a9d2-e5ea3e718462'::uuid, '헬스보이짐 광주점', '헬스보이짐광주점', NULL, '광주광역시', '북구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐광주점', TRUE),
('119b7078-80f1-5c7d-b48a-c829d14600d6'::uuid, '헬스보이짐 교대점', '헬스보이짐교대점', NULL, '서울특별시', '서초구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐교대점', TRUE),
('a00fcee6-eda5-57cd-804e-82446859dc51'::uuid, '헬스보이짐 노원점', '헬스보이짐노원점', NULL, '서울특별시', '노원구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐노원점', TRUE),
('cac99646-029c-52a4-bc9a-7c46b02a5927'::uuid, '헬스보이짐 대구점', '헬스보이짐대구점', NULL, '대구광역시', '수성구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐대구점', TRUE),
('5f66a103-0b15-5bff-bdbd-5a07528bcacd'::uuid, '헬스보이짐 문정역점', '헬스보이짐문정역점', NULL, '서울특별시', '송파구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐문정역점', TRUE),
('ca56101e-5c74-5d50-abc4-19ecc5c051b4'::uuid, '헬스보이짐 배곧점', '헬스보이짐배곧점', NULL, '경기도', '시흥시', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐배곧점', TRUE),
('4df4a063-9927-5910-9f7c-f9acc58324c1'::uuid, '헬스보이짐 부산점', '헬스보이짐부산점', NULL, '부산광역시', '해운대구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐부산점', TRUE),
('8e4a87da-7c21-5adc-addf-e65d8217dd40'::uuid, '헬스보이짐 분당점', '헬스보이짐분당점', NULL, '경기도', '성남시', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐분당점', TRUE),
('cb931698-8a52-5d53-bd66-bf1b24996afb'::uuid, '헬스보이짐 사당점', '헬스보이짐사당점', NULL, '서울특별시', '동작구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐사당점', TRUE),
('c0e30980-0250-5598-870f-4f9b58e9d49c'::uuid, '헬스보이짐 상록수점', '헬스보이짐상록수점', NULL, '경기도', '안산시', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐상록수점', TRUE),
('3a029fbf-38b8-51ef-a708-25585c9c3dc8'::uuid, '헬스보이짐 상암점', '헬스보이짐상암점', NULL, '서울특별시', '마포구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐상암점', TRUE),
('ccf7aef7-2401-5b80-a713-5c74be6476a8'::uuid, '헬스보이짐 선릉점', '헬스보이짐선릉점', NULL, '서울특별시', '강남구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐선릉점', TRUE),
('e2c75303-b15b-5517-bbaa-65fb0c7b91cf'::uuid, '헬스보이짐 송촌점', '헬스보이짐송촌점', NULL, '대전광역시', '대덕구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐송촌점', TRUE),
('0495c87d-5cf3-5e04-9f00-4878940ff98c'::uuid, '헬스보이짐 수원점', '헬스보이짐수원점', NULL, '경기도', '수원시', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐수원점', TRUE),
('fd8c4196-e6ef-5dce-8b23-986071bd8d3e'::uuid, '헬스보이짐 여의도점', '헬스보이짐여의도점', NULL, '서울특별시', '영등포구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐여의도점', TRUE),
('4c14aa5d-725d-5538-8f42-3d54736fc65f'::uuid, '헬스보이짐 역삼점', '헬스보이짐역삼점', NULL, '서울특별시', '강남구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐역삼점', TRUE),
('a0590820-3e80-5f67-abd8-0558baee1c5f'::uuid, '헬스보이짐 울산점', '헬스보이짐울산점', NULL, '울산광역시', '남구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐울산점', TRUE),
('dacc0592-cbee-5c61-b1ba-9b99b707a5ae'::uuid, '헬스보이짐 인천점', '헬스보이짐인천점', NULL, '인천광역시', '남동구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐인천점', TRUE),
('bacc4d87-3241-51c2-ba6d-7e97329f9416'::uuid, '헬스보이짐 일산점', '헬스보이짐일산점', NULL, '경기도', '고양시', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐일산점', TRUE),
('514b2fcb-28e9-583d-bfb7-6a5cbf3c4c4f'::uuid, '헬스보이짐 잠실점', '헬스보이짐잠실점', NULL, '서울특별시', '송파구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐잠실점', TRUE),
('dc95cdd1-e89f-5bfb-acbe-6f7a9bde598f'::uuid, '헬스보이짐 전주점', '헬스보이짐전주점', NULL, '전북특별자치도', '전주시', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐전주점', TRUE),
('ba584084-ae66-5e87-b3e1-93abea37c1d6'::uuid, '헬스보이짐 죽전점', '헬스보이짐죽전점', NULL, '경기도', '용인시', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐죽전점', TRUE),
('c1f62f35-9af1-5a1a-a6e0-934ae6f8b3d4'::uuid, '헬스보이짐 창원점', '헬스보이짐창원점', NULL, '경상남도', '창원시', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐창원점', TRUE),
('cf3f90fd-2c2f-50d3-bdf5-4a21be38b037'::uuid, '헬스보이짐 천안점', '헬스보이짐천안점', NULL, '충청남도', '천안시', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐천안점', TRUE),
('03271cbc-5359-5ef1-9714-dd72c2affe63'::uuid, '헬스보이짐 청주점', '헬스보이짐청주점', NULL, '충청북도', '청주시', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐청주점', TRUE),
('649c3304-462d-56c7-a778-6537afdfe8b8'::uuid, '헬스보이짐 테크노밸리점', '헬스보이짐테크노밸리점', NULL, '대전광역시', '유성구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐테크노밸리점', TRUE),
('6a35d6bc-6b67-5d37-889a-ce0c211d9fcd'::uuid, '헬스보이짐 판교역점', '헬스보이짐판교역점', NULL, '경기도', '성남시', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐판교역점', TRUE),
('7724d23e-9b93-55b6-aed3-9f4863cc271c'::uuid, '헬스보이짐 판교점', '헬스보이짐판교점', NULL, '경기도', '성남시', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐판교점', TRUE),
('00532dfd-f580-58b3-bc31-5b3565780191'::uuid, '헬스보이짐 프리미엄 가락점', '헬스보이짐프리미엄가락점', NULL, '서울특별시', '송파구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐프리미엄가락점', TRUE),
('25470685-d7e3-501b-bfd9-3b2c424382e3'::uuid, '헬스보이짐 프리미엄 신촌점', '헬스보이짐프리미엄신촌점', NULL, '서울특별시', '서대문구', NULL, NULL, NULL, 'official_chain', 'healthboy:헬스보이짐프리미엄신촌점', TRUE)
ON CONFLICT (source, source_ref) DO UPDATE SET
  name = EXCLUDED.name,
  name_normalized = EXCLUDED.name_normalized,
  state_name = COALESCE(EXCLUDED.state_name, gym_directory.state_name),
  city_name = COALESCE(EXCLUDED.city_name, gym_directory.city_name),
  is_active = TRUE,
  updated_at = NOW();


UPDATE gym_directory d
SET state_id = s.id,
    state_name = COALESCE(d.state_name, s.name->>'ko')
FROM location_states s
WHERE d.source = 'official_chain'
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
WHERE d.source = 'official_chain'
  AND d.city_id IS NULL
  AND d.city_name IS NOT NULL
  AND (
    d.city_name ILIKE '%' || (c.name->>'ko') || '%'
    OR (c.name->>'ko') ILIKE '%' || d.city_name || '%'
  )
  AND (d.state_id IS NULL OR c.state_id = d.state_id);

