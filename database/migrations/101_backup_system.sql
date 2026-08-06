-- Backup & restore: audit logs, auto-backup settings, private storage notes

CREATE TABLE IF NOT EXISTS backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('USER', 'SYSTEM')),
  action VARCHAR(20) NOT NULL CHECK (action IN ('BACKUP', 'RESTORE')),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED')),
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  format VARCHAR(10) NOT NULL DEFAULT 'zip' CHECK (format IN ('zip', 'json')),
  storage_path TEXT,
  file_name TEXT,
  file_size_bytes BIGINT,
  backup_version INT,
  restore_mode VARCHAR(20) CHECK (restore_mode IS NULL OR restore_mode IN ('merge', 'replace')),
  error_message TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_backup_logs_user_created
  ON backup_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_backup_logs_type_created
  ON backup_logs (type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_backup_logs_status_created
  ON backup_logs (status, created_at DESC)
  WHERE status IN ('PENDING', 'RUNNING');

COMMENT ON TABLE backup_logs IS 'User/system backup and restore audit trail with progress';
COMMENT ON COLUMN backup_logs.type IS 'USER = member-scoped; SYSTEM = admin full logical dump';
COMMENT ON COLUMN backup_logs.storage_path IS 'Path inside Supabase Storage bucket "backup" (system/ or user/)';

CREATE TABLE IF NOT EXISTS backup_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  auto_backup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  /** UTC hour 0–23 when nightly system backup runs (default 18 ≈ 03:00 KST). */
  auto_backup_hour_utc INT NOT NULL DEFAULT 18 CHECK (auto_backup_hour_utc BETWEEN 0 AND 23),
  retention_days INT NOT NULL DEFAULT 30 CHECK (retention_days IN (7, 30, 90)),
  last_auto_backup_at TIMESTAMPTZ,
  last_auto_backup_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO backup_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE backup_settings IS 'Singleton auto system-backup schedule and retention';

ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE backup_logs FROM anon, authenticated;
REVOKE ALL ON TABLE backup_settings FROM anon, authenticated;
