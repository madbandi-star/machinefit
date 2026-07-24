INSERT INTO roles (code, name) VALUES
  ('guest', '{"ko":"게스트","en":"Guest","ja":"ゲスト","zh":"访客"}'),
  ('member', '{"ko":"회원","en":"Member","ja":"メンバー","zh":"会员"}'),
  ('premium_member', '{"ko":"프리미엄 회원","en":"Premium Member","ja":"プレミアム会員","zh":"高级会员"}'),
  ('vip_member', '{"ko":"VIP 회원","en":"VIP Member","ja":"VIP会員","zh":"VIP会员"}'),
  ('trainer', '{"ko":"트레이너","en":"Trainer","ja":"トレーナー","zh":"教练"}'),
  ('owner', '{"ko":"헬스장 사장","en":"Gym Owner","ja":"ジムオーナー","zh":"健身房老板"}'),
  ('admin', '{"ko":"관리자","en":"Admin","ja":"管理者","zh":"管理员"}')
ON CONFLICT (code) DO NOTHING;
