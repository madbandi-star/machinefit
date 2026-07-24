-- Role-based push campaigns + per-recipient delivery audit log.
-- In-app delivery reuses `notifications`; this module stores send history & audience metadata.

CREATE TABLE IF NOT EXISTS push_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role VARCHAR(40) NOT NULL,
  kind VARCHAR(40) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  deep_link TEXT,
  audience_type VARCHAR(60) NOT NULL,
  audience_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  recipient_count INT NOT NULL DEFAULT 0,
  success_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_campaigns_sender_created
  ON push_campaigns (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_campaigns_created
  ON push_campaigns (created_at DESC);

CREATE TABLE IF NOT EXISTS push_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES push_campaigns(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role VARCHAR(40) NOT NULL,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_role VARCHAR(40),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_delivery_logs_campaign
  ON push_delivery_logs (campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_delivery_logs_sender
  ON push_delivery_logs (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_delivery_logs_recipient
  ON push_delivery_logs (recipient_id, created_at DESC);
