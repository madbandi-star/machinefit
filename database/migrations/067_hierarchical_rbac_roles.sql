-- Hierarchical RBAC: add mid-tier account roles.
-- Existing guest/member/owner/admin rows are kept; codes are stable for JWT/DB.

INSERT INTO roles (code, name) VALUES
  (
    'premium_member',
    '{"ko":"프리미엄 회원","en":"Premium Member","ja":"プレミアム会員","zh":"高级会员"}'::jsonb
  ),
  (
    'vip_member',
    '{"ko":"VIP 회원","en":"VIP Member","ja":"VIP会員","zh":"VIP会员"}'::jsonb
  ),
  (
    'trainer',
    '{"ko":"트레이너","en":"Trainer","ja":"トレーナー","zh":"教练"}'::jsonb
  )
ON CONFLICT (code) DO NOTHING;

-- Refresh display names for existing ladder roles (ko/en/ja/zh).
UPDATE roles SET name = '{"ko":"게스트","en":"Guest","ja":"ゲスト","zh":"访客"}'::jsonb
WHERE code = 'guest';

UPDATE roles SET name = '{"ko":"회원","en":"Member","ja":"メンバー","zh":"会员"}'::jsonb
WHERE code = 'member';

UPDATE roles SET name = '{"ko":"헬스장 사장","en":"Gym Owner","ja":"ジムオーナー","zh":"健身房老板"}'::jsonb
WHERE code = 'owner';

UPDATE roles SET name = '{"ko":"관리자","en":"Admin","ja":"管理者","zh":"管理员"}'::jsonb
WHERE code = 'admin';
