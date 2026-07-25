-- Demo accounts for premium_member / vip_member role testing.
-- Password: demo1234 (same bcrypt hash as 043_force_demo_password.sql).

INSERT INTO users (
  id,
  role_id,
  email,
  password_hash,
  display_name,
  gender,
  height_cm,
  weight_kg,
  experience_level,
  subscription_plan,
  is_active
)
SELECT
  v.id::uuid,
  r.id,
  v.email,
  '$2b$12$Jl0R/iUN2nU1uKp8YJ/NPedihs3J5LRf9rHhXgrUwvz5XhVevxIyC',
  v.display_name,
  'male',
  175,
  70,
  'intermediate',
  'premium',
  TRUE
FROM roles r
CROSS JOIN (
  VALUES
    (
      'a1111111-1111-4111-8111-111111111101',
      'demo_premium@gmail.com',
      'Demo Premium',
      'premium_member'
    ),
    (
      'a1111111-1111-4111-8111-111111111102',
      'demo_vip@gmail.com',
      'Demo VIP',
      'vip_member'
    )
) AS v(id, email, display_name, role_code)
WHERE r.code = v.role_code
ON CONFLICT (email) DO UPDATE
SET
  role_id = EXCLUDED.role_id,
  password_hash = EXCLUDED.password_hash,
  display_name = EXCLUDED.display_name,
  subscription_plan = EXCLUDED.subscription_plan,
  is_active = TRUE,
  updated_at = NOW();

-- Default gym for each demo account (idempotent by fixed ids).
INSERT INTO user_gyms (id, user_id, name, is_default)
VALUES
  (
    'a1111111-1111-4111-8222-111111111101'::uuid,
    'a1111111-1111-4111-8111-111111111101'::uuid,
    '기본 헬스장',
    TRUE
  ),
  (
    'a1111111-1111-4111-8222-111111111102'::uuid,
    'a1111111-1111-4111-8111-111111111102'::uuid,
    '기본 헬스장',
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- Self gym members so scoped APIs work out of the box.
INSERT INTO gym_members (
  id,
  gym_id,
  owner_user_id,
  name,
  gender,
  height_cm,
  weight_kg,
  email,
  linked_user_id,
  profile_access,
  is_self
)
VALUES
  (
    'a1111111-1111-4111-8333-111111111101'::uuid,
    'a1111111-1111-4111-8222-111111111101'::uuid,
    'a1111111-1111-4111-8111-111111111101'::uuid,
    'Demo Premium',
    'male',
    175,
    70,
    'demo_premium@gmail.com',
    'a1111111-1111-4111-8111-111111111101'::uuid,
    'approved',
    TRUE
  ),
  (
    'a1111111-1111-4111-8333-111111111102'::uuid,
    'a1111111-1111-4111-8222-111111111102'::uuid,
    'a1111111-1111-4111-8111-111111111102'::uuid,
    'Demo VIP',
    'male',
    175,
    70,
    'demo_vip@gmail.com',
    'a1111111-1111-4111-8111-111111111102'::uuid,
    'approved',
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- active_gym_id → user_gyms; home_gym_id → directory gyms (leave null for demos).
UPDATE users u
SET
  active_gym_id = ug.id,
  updated_at = NOW()
FROM user_gyms ug
WHERE ug.user_id = u.id
  AND u.id IN (
    'a1111111-1111-4111-8111-111111111101'::uuid,
    'a1111111-1111-4111-8111-111111111102'::uuid
  )
  AND u.active_gym_id IS DISTINCT FROM ug.id;
