import type {
  BackupAction,
  BackupFormat,
  BackupLogItem,
  BackupRestoreMode,
  BackupRetentionDays,
  BackupSettings,
  BackupStatus,
  BackupType,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';

type BackupLogRow = {
  id: string;
  user_id: string | null;
  type: BackupType;
  action: BackupAction;
  status: BackupStatus;
  progress: number;
  format: BackupFormat;
  storage_path: string | null;
  file_name: string | null;
  file_size_bytes: string | number | null;
  backup_version: number | null;
  restore_mode: BackupRestoreMode | null;
  error_message: string | null;
  meta: Record<string, unknown> | null;
  created_at: Date | string;
  completed_at: Date | string | null;
};

function mapLog(row: BackupLogRow): BackupLogItem {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    action: row.action,
    status: row.status,
    progress: row.progress,
    format: row.format,
    storagePath: row.storage_path,
    fileName: row.file_name,
    fileSizeBytes:
      row.file_size_bytes == null
        ? null
        : typeof row.file_size_bytes === 'string'
          ? Number(row.file_size_bytes)
          : row.file_size_bytes,
    backupVersion: row.backup_version,
    restoreMode: row.restore_mode,
    errorMessage: row.error_message,
    meta: row.meta ?? {},
    createdAt: new Date(row.created_at).toISOString(),
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
  };
}

export const backupRepository = {
  async createLog(params: {
    userId: string | null;
    type: BackupType;
    action: BackupAction;
    format: BackupFormat;
    restoreMode?: BackupRestoreMode | null;
    meta?: Record<string, unknown>;
  }): Promise<BackupLogItem> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');
    const { rows } = await pool.query<BackupLogRow>(
      `INSERT INTO backup_logs (user_id, type, action, status, progress, format, restore_mode, meta)
       VALUES ($1, $2, $3, 'PENDING', 0, $4, $5, $6::jsonb)
       RETURNING *`,
      [
        params.userId,
        params.type,
        params.action,
        params.format,
        params.restoreMode ?? null,
        JSON.stringify(params.meta ?? {}),
      ]
    );
    return mapLog(rows[0]!);
  },

  async updateProgress(
    id: string,
    progress: number,
    status: BackupStatus = 'RUNNING'
  ): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `UPDATE backup_logs
       SET progress = $2, status = $3
       WHERE id = $1`,
      [id, Math.max(0, Math.min(100, Math.round(progress))), status]
    );
  },

  async completeSuccess(
    id: string,
    params: {
      storagePath?: string | null;
      fileName?: string | null;
      fileSizeBytes?: number | null;
      backupVersion?: number | null;
      meta?: Record<string, unknown>;
    }
  ): Promise<BackupLogItem> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');
    const { rows } = await pool.query<BackupLogRow>(
      `UPDATE backup_logs
       SET status = 'SUCCESS',
           progress = 100,
           storage_path = COALESCE($2, storage_path),
           file_name = COALESCE($3, file_name),
           file_size_bytes = COALESCE($4, file_size_bytes),
           backup_version = COALESCE($5, backup_version),
           meta = CASE WHEN $6::jsonb IS NULL THEN meta ELSE meta || $6::jsonb END,
           completed_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        params.storagePath ?? null,
        params.fileName ?? null,
        params.fileSizeBytes ?? null,
        params.backupVersion ?? null,
        params.meta ? JSON.stringify(params.meta) : null,
      ]
    );
    return mapLog(rows[0]!);
  },

  async completeFailed(id: string, errorMessage: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `UPDATE backup_logs
       SET status = 'FAILED',
           error_message = $2,
           completed_at = NOW()
       WHERE id = $1`,
      [id, errorMessage.slice(0, 2000)]
    );
  },

  async findById(id: string): Promise<BackupLogItem | null> {
    const pool = getPool();
    if (!pool) return null;
    const { rows } = await pool.query<BackupLogRow>(`SELECT * FROM backup_logs WHERE id = $1`, [
      id,
    ]);
    return rows[0] ? mapLog(rows[0]) : null;
  },

  async listHistory(params: {
    userId?: string | null;
    type?: BackupType;
    limit?: number;
  }): Promise<BackupLogItem[]> {
    const pool = getPool();
    if (!pool) return [];
    const values: unknown[] = [];
    const where: string[] = [];
    if (params.userId) {
      values.push(params.userId);
      where.push(`user_id = $${values.length}`);
    }
    if (params.type) {
      values.push(params.type);
      where.push(`type = $${values.length}`);
    }
    values.push(params.limit ?? 50);
    const sql = `
      SELECT * FROM backup_logs
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY created_at DESC
      LIMIT $${values.length}`;
    const { rows } = await pool.query<BackupLogRow>(sql, values);
    return rows.map(mapLog);
  },

  async getSettings(): Promise<BackupSettings> {
    const pool = getPool();
    if (!pool) {
      return {
        autoBackupEnabled: true,
        autoBackupHourUtc: 18,
        retentionDays: 30,
        lastAutoBackupAt: null,
        lastAutoBackupDate: null,
      };
    }
    const { rows } = await pool.query<{
      auto_backup_enabled: boolean;
      auto_backup_hour_utc: number;
      retention_days: number;
      last_auto_backup_at: Date | string | null;
      last_auto_backup_date: string | null;
    }>(`SELECT * FROM backup_settings WHERE id = 1`);
    const row = rows[0];
    return {
      autoBackupEnabled: row?.auto_backup_enabled ?? true,
      autoBackupHourUtc: row?.auto_backup_hour_utc ?? 18,
      retentionDays: (row?.retention_days ?? 30) as BackupRetentionDays,
      lastAutoBackupAt: row?.last_auto_backup_at
        ? new Date(row.last_auto_backup_at).toISOString()
        : null,
      lastAutoBackupDate: row?.last_auto_backup_date ?? null,
    };
  },

  async updateSettings(
    userId: string,
    patch: {
      autoBackupEnabled?: boolean;
      autoBackupHourUtc?: number;
      retentionDays?: BackupRetentionDays;
    }
  ): Promise<BackupSettings> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');
    await pool.query(
      `UPDATE backup_settings
       SET auto_backup_enabled = COALESCE($2, auto_backup_enabled),
           auto_backup_hour_utc = COALESCE($3, auto_backup_hour_utc),
           retention_days = COALESCE($4, retention_days),
           updated_at = NOW(),
           updated_by = $1
       WHERE id = 1`,
      [
        userId,
        patch.autoBackupEnabled ?? null,
        patch.autoBackupHourUtc ?? null,
        patch.retentionDays ?? null,
      ]
    );
    return this.getSettings();
  },

  async markAutoBackupRan(at: Date = new Date()): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    const date = at.toISOString().slice(0, 10);
    await pool.query(
      `UPDATE backup_settings
       SET last_auto_backup_at = $1,
           last_auto_backup_date = $2::date,
           updated_at = NOW()
       WHERE id = 1`,
      [at.toISOString(), date]
    );
  },
};
