-- Supabase Row Level Security policies (enable when connecting to Supabase)
-- Run AFTER all migrations. Requires: ALTER TABLE ... ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- USERS — users can read/update own profile
-- =============================================================================
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid()::text = id::text);
-- CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- =============================================================================
-- GYMS — public read for approved gyms; owners manage own gyms
-- =============================================================================
-- ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY gyms_public_read ON gyms FOR SELECT
--   USING (is_active = TRUE AND registration_status = 'approved');
-- CREATE POLICY gyms_owner_all ON gyms FOR ALL
--   USING (owner_id::text = auth.uid()::text);

-- =============================================================================
-- GYM_MACHINES — public read; owners manage via gym ownership
-- =============================================================================
-- ALTER TABLE gym_machines ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY gym_machines_public_read ON gym_machines FOR SELECT
--   USING (EXISTS (
--     SELECT 1 FROM gyms g WHERE g.id = gym_machines.gym_id
--     AND g.is_active = TRUE AND g.registration_status = 'approved'
--   ));

-- =============================================================================
-- FAVORITES / HISTORY — user owns their data
-- =============================================================================
-- ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY favorites_own ON favorites FOR ALL
--   USING (user_id::text = auth.uid()::text);

-- ALTER TABLE recent_history ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY history_own ON recent_history FOR ALL
--   USING (user_id::text = auth.uid()::text);

-- =============================================================================
-- COMMUNITY — public read non-hidden posts; authors manage own
-- =============================================================================
-- ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY posts_public_read ON posts FOR SELECT USING (is_hidden = FALSE);
-- CREATE POLICY posts_author_write ON posts FOR ALL
--   USING (user_id::text = auth.uid()::text);

-- =============================================================================
-- MACHINE REQUESTS — public read; authors manage own pending
-- =============================================================================
-- ALTER TABLE machine_requests ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY machine_requests_public_read ON machine_requests FOR SELECT USING (TRUE);
-- CREATE POLICY machine_requests_author_write ON machine_requests FOR INSERT
--   WITH CHECK (user_id::text = auth.uid()::text);

-- =============================================================================
-- AI / QR logs — users see own scan/vision history
-- =============================================================================
-- ALTER TABLE qr_scan_events ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY qr_scans_own ON qr_scan_events FOR SELECT
--   USING (user_id::text = auth.uid()::text OR user_id IS NULL);

-- ALTER TABLE vision_recognition_logs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY vision_logs_own ON vision_recognition_logs FOR SELECT
--   USING (user_id::text = auth.uid()::text);

-- Note: MachineFit uses custom JWT via Express API, not Supabase Auth.
-- When using Supabase Auth, replace auth.uid() with your JWT claims.
-- When using Express-only, enforce access in repository/service layer (current approach).
