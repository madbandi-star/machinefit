-- Ops monitoring: errors, API metrics, page/feature analytics, server samples, logs, alerts.
-- Aggregation-friendly daily tables + append-only audit extension.

CREATE TABLE IF NOT EXISTS ops_error_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint VARCHAR(64) NOT NULL UNIQUE,
  title VARCHAR(400) NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'medium',
  source VARCHAR(40) NOT NULL DEFAULT 'frontend',
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  sample_stack TEXT,
  sample_url TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ops_error_groups_last_seen
  ON ops_error_groups (resolved, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_error_groups_severity
  ON ops_error_groups (severity, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS ops_error_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES ops_error_groups(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  url TEXT,
  browser VARCHAR(120),
  os VARCHAR(80),
  device VARCHAR(80),
  app_version VARCHAR(40),
  message TEXT,
  stack TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ops_error_events_group_time
  ON ops_error_events (group_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_error_events_time
  ON ops_error_events (occurred_at DESC);

CREATE TABLE IF NOT EXISTS ops_api_metrics_hourly (
  bucket_hour TIMESTAMPTZ NOT NULL,
  method VARCHAR(12) NOT NULL,
  route_key VARCHAR(200) NOT NULL,
  call_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  fail_count INTEGER NOT NULL DEFAULT 0,
  total_ms BIGINT NOT NULL DEFAULT 0,
  min_ms INTEGER,
  max_ms INTEGER,
  p50_ms INTEGER,
  p95_ms INTEGER,
  p99_ms INTEGER,
  status_2xx INTEGER NOT NULL DEFAULT 0,
  status_3xx INTEGER NOT NULL DEFAULT 0,
  status_4xx INTEGER NOT NULL DEFAULT 0,
  status_5xx INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_hour, method, route_key)
);

CREATE INDEX IF NOT EXISTS idx_ops_api_metrics_hourly_route
  ON ops_api_metrics_hourly (route_key, bucket_hour DESC);

CREATE TABLE IF NOT EXISTS ops_api_latency_samples (
  id BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method VARCHAR(12) NOT NULL,
  route_key VARCHAR(200) NOT NULL,
  status_code SMALLINT NOT NULL,
  duration_ms INTEGER NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ops_api_latency_samples_time
  ON ops_api_latency_samples (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_api_latency_samples_route
  ON ops_api_latency_samples (route_key, occurred_at DESC);

CREATE TABLE IF NOT EXISTS ops_page_stats_daily (
  day DATE NOT NULL,
  path_key VARCHAR(200) NOT NULL,
  page_views INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  total_dwell_ms BIGINT NOT NULL DEFAULT 0,
  bounce_count INTEGER NOT NULL DEFAULT 0,
  entrances INTEGER NOT NULL DEFAULT 0,
  exits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path_key)
);

CREATE TABLE IF NOT EXISTS ops_feature_stats_daily (
  day DATE NOT NULL,
  feature_key VARCHAR(80) NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, feature_key)
);

CREATE TABLE IF NOT EXISTS ops_user_activity_daily (
  day DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (day, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ops_user_activity_daily_day
  ON ops_user_activity_daily (day DESC);

CREATE TABLE IF NOT EXISTS ops_active_sessions (
  session_id VARCHAR(64) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  path_key VARCHAR(200),
  ip_address VARCHAR(64),
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_ops_active_sessions_last
  ON ops_active_sessions (last_seen_at DESC);

CREATE TABLE IF NOT EXISTS ops_server_samples (
  id BIGSERIAL PRIMARY KEY,
  sampled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cpu_pct REAL,
  memory_pct REAL,
  memory_used_mb REAL,
  memory_total_mb REAL,
  disk_pct REAL,
  load_1 REAL,
  uptime_sec BIGINT,
  restart_count INTEGER NOT NULL DEFAULT 0,
  build_version VARCHAR(40),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ops_server_samples_time
  ON ops_server_samples (sampled_at DESC);

CREATE TABLE IF NOT EXISTS ops_db_query_samples (
  id BIGSERIAL PRIMARY KEY,
  sampled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  query_fingerprint VARCHAR(64) NOT NULL,
  query_preview TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  is_slow BOOLEAN NOT NULL DEFAULT FALSE,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ops_db_query_samples_time
  ON ops_db_query_samples (sampled_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_db_query_samples_slow
  ON ops_db_query_samples (is_slow, sampled_at DESC);

CREATE TABLE IF NOT EXISTS ops_app_logs (
  id BIGSERIAL PRIMARY KEY,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level VARCHAR(16) NOT NULL DEFAULT 'info',
  kind VARCHAR(32) NOT NULL DEFAULT 'application',
  message TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(64),
  api_route VARCHAR(200),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ops_app_logs_time
  ON ops_app_logs (logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_app_logs_kind_time
  ON ops_app_logs (kind, logged_at DESC);

CREATE TABLE IF NOT EXISTS ops_security_events (
  id BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type VARCHAR(60) NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'medium',
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(64),
  path TEXT,
  message TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ops_security_events_time
  ON ops_security_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_security_events_type
  ON ops_security_events (event_type, occurred_at DESC);

CREATE TABLE IF NOT EXISTS ops_alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  alert_key VARCHAR(80) NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'high',
  title VARCHAR(240) NOT NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ops_alert_events_open
  ON ops_alert_events (acknowledged, created_at DESC);

CREATE TABLE IF NOT EXISTS ops_alert_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type VARCHAR(20) NOT NULL,
  name VARCHAR(80) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Append-only: revoke DELETE for app role if present (best-effort; ignore if role missing).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE DELETE ON admin_audit_logs FROM authenticated';
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

COMMENT ON TABLE ops_error_groups IS 'Grouped client/server errors for ops dashboard';
COMMENT ON TABLE admin_audit_logs IS 'Immutable admin audit trail — do not DELETE';
