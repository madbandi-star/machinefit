INSERT INTO countries (code, name, default_timezone) VALUES
  ('KR', '{"ko":"대한민국","en":"South Korea","ja":"韓国","zh":"韩国"}', 'Asia/Seoul'),
  ('US', '{"ko":"미국","en":"United States","ja":"アメリカ","zh":"美国"}', 'America/New_York'),
  ('JP', '{"ko":"일본","en":"Japan","ja":"日本","zh":"日本"}', 'Asia/Tokyo'),
  ('CN', '{"ko":"중국","en":"China","ja":"中国","zh":"中国"}', 'Asia/Shanghai')
ON CONFLICT (code) DO NOTHING;
