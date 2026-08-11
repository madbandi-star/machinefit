-- Banner / promotion CMS: content, slots, assignments, lightweight events.

CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  advertiser_name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  banner_type TEXT NOT NULL DEFAULT 'image'
    CHECK (banner_type IN ('image', 'gif')),
  image_url TEXT,
  image_storage_path TEXT,
  mobile_image_url TEXT,
  mobile_image_storage_path TEXT,
  target_url TEXT NOT NULL DEFAULT '',
  open_new_window BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('active', 'inactive')),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  priority INT NOT NULL DEFAULT 100,
  impression_count BIGINT NOT NULL DEFAULT 0 CHECK (impression_count >= 0),
  click_count BIGINT NOT NULL DEFAULT 0 CHECK (click_count >= 0),
  last_impressed_at TIMESTAMPTZ,
  last_clicked_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_banners_admin_list
  ON banners (deleted_at, status, priority ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_banners_schedule
  ON banners (status, start_at, end_at)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_banners_updated_at ON banners;
CREATE TRIGGER trg_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE banners IS 'Promo/ad banner creatives (admin-managed; separate from notice board)';
COMMENT ON COLUMN banners.priority IS 'Default sort weight; lower = higher priority (slot assignment may override)';

CREATE TABLE IF NOT EXISTS banner_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_key TEXT NOT NULL UNIQUE,
  slot_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_banner_slots_updated_at ON banner_slots;
CREATE TRIGGER trg_banner_slots_updated_at
  BEFORE UPDATE ON banner_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE banner_slots IS 'Named placement slots for banners (page bottoms, future mid-page, etc.)';

CREATE TABLE IF NOT EXISTS banner_slot_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id UUID NOT NULL REFERENCES banners(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES banner_slots(id) ON DELETE CASCADE,
  priority INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (banner_id, slot_id)
);

CREATE INDEX IF NOT EXISTS idx_banner_slot_assignments_slot
  ON banner_slot_assignments (slot_id, priority ASC);

CREATE INDEX IF NOT EXISTS idx_banner_slot_assignments_banner
  ON banner_slot_assignments (banner_id);

COMMENT ON TABLE banner_slot_assignments IS 'Many-to-many: one banner can move between slots without duplicating creatives';

CREATE TABLE IF NOT EXISTS banner_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id UUID NOT NULL REFERENCES banners(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES banner_slots(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click')),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banner_events_banner_created
  ON banner_events (banner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_banner_events_type_created
  ON banner_events (event_type, created_at DESC);

COMMENT ON TABLE banner_events IS 'Impression/click log; counters on banners stay denormalized for admin list speed';

-- Seed slots for pages that exist today (no workout wrap-up / unfinished features).
INSERT INTO banner_slots (slot_key, slot_name, description, status)
VALUES
  ('MAIN_BOTTOM', '메인페이지 하단', '홈 화면 콘텐츠 하단', 'active'),
  ('MY_BOTTOM', '마이페이지 하단', '마이페이지 콘텐츠 하단', 'active'),
  ('WORKOUT_BOTTOM', '운동기록 페이지 하단', '운동 기록(Records) 페이지 하단 — 입력 UI와 분리', 'active'),
  ('MACHINE_BOTTOM', '머신 상세페이지 하단', '머신 상세 페이지 하단', 'active'),
  ('COMMUNITY_BOTTOM', '커뮤니티 하단', '커뮤니티 허브 페이지 하단', 'active')
ON CONFLICT (slot_key) DO NOTHING;

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_slot_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    EXECUTE 'REVOKE ALL ON TABLE banners FROM anon, authenticated, PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE banner_slots FROM anon, authenticated, PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE banner_slot_assignments FROM anon, authenticated, PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE banner_events FROM anon, authenticated, PUBLIC';
  EXCEPTION
    WHEN undefined_object THEN NULL;
  END;
END $$;
