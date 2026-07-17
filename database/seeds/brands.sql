-- Brands seed
INSERT INTO brands (code, name, is_active) VALUES
  ('FREE_WEIGHT', '{"ko":"프리웨이트","en":"Free Weight","ja":"フリーウェイト","zh":"自由重量"}', true),
  ('HAMMER_STRENGTH', '{"ko":"해머 스트렝스","en":"Hammer Strength","ja":"ハンマーストレングス","zh":"悍马力量"}', true),
  ('LIFE_FITNESS', '{"ko":"라이프 피트니스","en":"Life Fitness","ja":"ライフフィットネス","zh":"力健"}', true),
  ('CYBEX', '{"ko":"사이벡스","en":"Cybex","ja":"サイベックス","zh":"赛百斯"}', true),
  ('TECHNOGYM', '{"ko":"테크노짐","en":"Technogym","ja":"テクノジム","zh":"泰诺健"}', true)
ON CONFLICT (code) DO NOTHING;
