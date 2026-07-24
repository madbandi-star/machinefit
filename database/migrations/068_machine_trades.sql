-- Machine trade marketplace (팝니다 / 삽니다). Isolated module; machines/brands via FK only.

CREATE TABLE IF NOT EXISTS machine_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_type VARCHAR(10) NOT NULL CHECK (trade_type IN ('sell', 'buy')),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE RESTRICT,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price INT NOT NULL CHECK (price >= 0),
  condition VARCHAR(20) CHECK (
    condition IS NULL OR condition IN ('new', 'grade_a', 'grade_b', 'heavy_use')
  ),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 999),
  region_label VARCHAR(200) NOT NULL,
  country_code VARCHAR(8),
  state_id UUID,
  city_id UUID,
  district_id UUID,
  description TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'selling' CHECK (
    status IN ('selling', 'reserved', 'sold', 'purchased', 'cancelled', 'expired')
  ),
  view_count INT NOT NULL DEFAULT 0,
  like_count INT NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expired_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT machine_trades_sell_condition_chk CHECK (
    trade_type = 'buy' OR condition IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_machine_trades_type_status_created
  ON machine_trades (trade_type, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_machine_trades_machine_id
  ON machine_trades (machine_id, trade_type, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_machine_trades_seller_id
  ON machine_trades (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_machine_trades_expired_at
  ON machine_trades (expired_at)
  WHERE status NOT IN ('expired', 'sold', 'purchased', 'cancelled');
CREATE INDEX IF NOT EXISTS idx_machine_trades_like_count
  ON machine_trades (like_count DESC);

CREATE TRIGGER trg_machine_trades_updated_at
  BEFORE UPDATE ON machine_trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS machine_trade_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES machine_trades(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'image/webp',
  width INT,
  height INT,
  file_size_bytes INT,
  image_data BYTEA NOT NULL,
  thumbnail_data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_machine_trade_images_trade_id
  ON machine_trade_images (trade_id, sort_order);

CREATE TABLE IF NOT EXISTS machine_trade_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES machine_trades(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, trade_id)
);

CREATE INDEX IF NOT EXISTS idx_machine_trade_likes_trade_id ON machine_trade_likes (trade_id);

CREATE TABLE IF NOT EXISTS machine_trade_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES machine_trades(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(30) NOT NULL CHECK (
    reason IN ('fake', 'scam', 'abuse', 'spam', 'other')
  ),
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'resolved', 'dismissed')
  ),
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trade_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_machine_trade_reports_status
  ON machine_trade_reports (status, created_at DESC);

CREATE TRIGGER trg_machine_trade_reports_updated_at
  BEFORE UPDATE ON machine_trade_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
