INSERT INTO roles (code, name) VALUES
  ('guest', '{"ko":"게스트","en":"Guest","ja":"ゲスト","zh":"访客"}'),
  ('member', '{"ko":"회원","en":"Member","ja":"メンバー","zh":"会员"}'),
  ('owner', '{"ko":"체육관 운영자","en":"Gym Owner","ja":"ジムオーナー","zh":"健身房老板"}'),
  ('admin', '{"ko":"관리자","en":"Admin","ja":"管理者","zh":"管理员"}')
ON CONFLICT (code) DO NOTHING;
