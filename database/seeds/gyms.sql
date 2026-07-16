-- Gym seed data (requires machines, countries, and a seed owner user)
-- Uses a placeholder owner UUID; in production, link to real owner users.

-- Seed owner user (dev only — password: GymOwner123!)
INSERT INTO users (id, role_id, email, password_hash, display_name, language_id)
SELECT
  '00000000-0000-4000-a000-000000000001',
  r.id,
  'owner@machinefit.dev',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G2oXj8KzqG5qGi',
  'Demo Gym Owner',
  l.id
FROM roles r, languages l
WHERE r.code = 'owner' AND l.code = 'en'
ON CONFLICT (email) DO NOTHING;

-- Fallback: use member role if owner role seed hasn't run
INSERT INTO users (id, role_id, email, password_hash, display_name)
SELECT
  '00000000-0000-4000-a000-000000000001',
  r.id,
  'owner@machinefit.dev',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G2oXj8KzqG5qGi',
  'Demo Gym Owner'
FROM roles r
WHERE r.code = 'member'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'owner@machinefit.dev')
ON CONFLICT (email) DO NOTHING;

INSERT INTO gyms (
  id, owner_id, slug, name, description, address, city, country_id,
  latitude, longitude, phone, website_url, business_hours, amenities,
  is_verified, is_active, registration_status
)
SELECT
  v.id::uuid,
  '00000000-0000-4000-a000-000000000001'::uuid,
  v.slug,
  v.name,
  v.description::jsonb,
  v.address,
  v.city,
  c.id,
  v.lat,
  v.lng,
  v.phone,
  v.website,
  v.hours::jsonb,
  v.amenities::jsonb,
  true,
  true,
  'approved'
FROM countries c
CROSS JOIN (VALUES
  ('00000000-0000-4000-b000-000000000001', 'fitzone-gangnam', 'FitZone Gangnam',
   '{"en":"Premium strength training gym in Gangnam","ko":"강남 프리미엄 근력 트레이닝 체육관"}',
   '123 Teheran-ro, Gangnam-gu', 'Seoul', 'KR', 37.4979, 127.0276,
   '+82-2-1234-5678', 'https://fitzone.example.com',
   '{"mon":{"open":"06:00","close":"22:00"},"tue":{"open":"06:00","close":"22:00"},"wed":{"open":"06:00","close":"22:00"},"thu":{"open":"06:00","close":"22:00"},"fri":{"open":"06:00","close":"22:00"},"sat":{"open":"08:00","close":"20:00"},"sun":{"open":"08:00","close":"18:00"}}',
   '{"parking":true,"shower":true,"24h":false}'),
  ('00000000-0000-4000-b000-000000000002', 'iron-temple-seoul', 'Iron Temple Seoul',
   '{"en":"Hardcore strength gym","ko":"하드코어 근력 체육관"}',
   '45 Olympic-ro, Songpa-gu', 'Seoul', 'KR', 37.5145, 127.1059,
   '+82-2-9876-5432', NULL,
   '{"mon":{"open":"06:00","close":"22:00"},"tue":{"open":"06:00","close":"22:00"},"wed":{"open":"06:00","close":"22:00"},"thu":{"open":"06:00","close":"22:00"},"fri":{"open":"06:00","close":"22:00"},"sat":{"open":"08:00","close":"20:00"},"sun":{"open":"08:00","close":"18:00"}}',
   '{"parking":true,"shower":true,"24h":true}'),
  ('00000000-0000-4000-b000-000000000003', 'powerhouse-nyc', 'PowerHouse NYC',
   '{"en":"Midtown Manhattan fitness center","ko":"맨해튼 미드타운 피트니스 센터"}',
   '350 5th Ave', 'New York', 'US', 40.7484, -73.9857,
   '+1-212-555-0100', NULL,
   '{"mon":{"open":"06:00","close":"22:00"},"tue":{"open":"06:00","close":"22:00"},"wed":{"open":"06:00","close":"22:00"},"thu":{"open":"06:00","close":"22:00"},"fri":{"open":"06:00","close":"22:00"},"sat":{"open":"08:00","close":"20:00"},"sun":{"open":"08:00","close":"18:00"}}',
   '{"parking":false,"shower":true,"24h":false}')
) AS v(id, slug, name, description, address, city, country_code, lat, lng, phone, website, hours, amenities)
WHERE c.code = v.country_code
ON CONFLICT DO NOTHING;

-- Gym machines inventory
INSERT INTO gym_machines (gym_id, machine_id, quantity, is_available, floor_zone)
SELECT g.id, m.id, v.qty, v.avail, v.zone
FROM gyms g
CROSS JOIN (VALUES
  ('fitzone-gangnam', 'HS_ISO_LATERAL_HIGH_ROW', 2, true, 'Upper Body'),
  ('fitzone-gangnam', 'HS_SELECTORIZED_CHEST_PRESS', 1, true, 'Upper Body'),
  ('fitzone-gangnam', 'HS_LEG_EXTENSION', 2, true, 'Lower Body'),
  ('fitzone-gangnam', 'HS_SHOULDER_PRESS', 1, true, 'Upper Body'),
  ('iron-temple-seoul', 'HS_ISO_LATERAL_HIGH_ROW', 1, true, NULL),
  ('iron-temple-seoul', 'HS_LEG_CURL', 2, true, NULL),
  ('iron-temple-seoul', 'HS_SELECTORIZED_CHEST_PRESS', 1, false, NULL),
  ('powerhouse-nyc', 'HS_LEG_EXTENSION', 3, true, NULL),
  ('powerhouse-nyc', 'HS_SHOULDER_PRESS', 1, true, NULL)
) AS v(gym_slug, machine_code, qty, avail, zone)
JOIN machines m ON m.code = v.machine_code
WHERE g.slug = v.gym_slug
ON CONFLICT (gym_id, machine_id) DO NOTHING;

-- Gym photos
INSERT INTO gym_photos (gym_id, photo_url, sort_order)
SELECT g.id, 'https://placehold.co/600x400/111/ffd400?text=' || replace(g.name, ' ', '+'), 0
FROM gyms g
WHERE g.slug IN ('fitzone-gangnam', 'iron-temple-seoul', 'powerhouse-nyc')
ON CONFLICT DO NOTHING;
