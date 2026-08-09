import type pg from 'pg';
import {
  BACKUP_STORAGE_PREFIX,
  BACKUP_VERSION,
  buildBackupFileName,
  systemBackupPayloadSchema,
  type BackupFormat,
  type BackupSettings,
  type BackupSettingsUpdateInput,
  type SystemBackupPayload,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';
import { backupRepository } from '../repositories/backup.repository.js';
import { packBackupArchive, unpackBackupArchive } from '../backup/backup-zip.js';
import { getBackupStorageProvider } from '../backup/providers/supabase-backup.provider.js';
import { logger } from '../utils/logger.js';

const APP_VERSION = process.env.npm_package_version || '0.1.0';

/** Logical dump tables (order matters for restore FK safety). */
const SYSTEM_TABLES = [
  'roles',
  'languages',
  'brands',
  'machines',
  'machine_images',
  'machine_settings',
  'machine_recommendations',
  'gyms',
  'location_countries',
  'location_states',
  'location_cities',
  'location_districts',
  'notices',
  'notice_translations',
  'notice_attachments',
  'motivation_media',
  'plan_master',
  'feature_flags',
  'users_safe',
  'user_gyms',
  'gym_members',
  'workout_logs',
  'favorites',
  'recent_history',
  'user_machine_preferences',
  'recommendation_feedback',
  'backup_settings',
] as const;

const EXCLUDED_TABLES = [
  'refresh_tokens',
  'auth_providers',
  'payment_history',
  'subscriptions',
  'online_pt_payment_audits',
  'password_reset_tokens',
  'backup_logs',
] as const;

const SENSITIVE_USER_COLUMNS = new Set([
  'password',
  'refresh_token',
  'access_token',
  'token',
  'secret',
]);

async function tableExists(client: pg.PoolClient, table: string): Promise<boolean> {
  const { rows } = await client.query<{ exists: boolean }>(
    `SELECT to_regclass($1) IS NOT NULL AS exists`,
    [`public.${table}`]
  );
  return Boolean(rows[0]?.exists);
}

async function exportUsersSafe(client: pg.PoolClient): Promise<Record<string, unknown>[]> {
  const { rows } = await client.query(`SELECT * FROM users`);
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (SENSITIVE_USER_COLUMNS.has(key)) continue;
      out[key] = value instanceof Date ? value.toISOString() : value;
    }
    return out;
  });
}

async function exportTable(
  client: pg.PoolClient,
  table: string
): Promise<Record<string, unknown>[]> {
  if (table === 'users_safe') return exportUsersSafe(client);
  if (!(await tableExists(client, table))) return [];
  const { rows } = await client.query(`SELECT * FROM ${table}`);
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      out[key] = value instanceof Date ? value.toISOString() : value;
    }
    return out;
  });
}

export const systemBackupService = {
  async getSettings(): Promise<BackupSettings> {
    return backupRepository.getSettings();
  },

  async updateSettings(adminId: string, patch: BackupSettingsUpdateInput): Promise<BackupSettings> {
    return backupRepository.updateSettings(adminId, patch);
  },

  async history(limit = 50) {
    return backupRepository.listHistory({ type: 'SYSTEM', limit });
  },

  async exportSystem(adminId: string | null, format: BackupFormat = 'zip'): Promise<{
    jobId: string;
    fileName: string;
    buffer: Buffer;
    contentType: string;
  }> {
    const job = await backupRepository.createLog({
      userId: adminId,
      type: 'SYSTEM',
      action: 'BACKUP',
      format,
      meta: { source: adminId ? 'admin' : 'auto' },
    });

    try {
      const pool = getPool();
      if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
      await backupRepository.updateProgress(job.id, 5);

      const client = await pool.connect();
      const tables: SystemBackupPayload['tables'] = [];
      try {
        let i = 0;
        for (const table of SYSTEM_TABLES) {
          i += 1;
          const rows = await exportTable(client, table);
          tables.push({ table, rows });
          await backupRepository.updateProgress(
            job.id,
            Math.min(85, 10 + Math.round((i / SYSTEM_TABLES.length) * 70))
          );
        }
      } finally {
        client.release();
      }

      const payload: SystemBackupPayload = {
        backup_version: BACKUP_VERSION,
        type: 'SYSTEM',
        exported_at: new Date().toISOString(),
        app_version: APP_VERSION,
        tables,
        excluded_tables: [...EXCLUDED_TABLES],
      };

      const packed = await packBackupArchive({
        type: 'SYSTEM',
        backupVersion: BACKUP_VERSION,
        appVersion: APP_VERSION,
        payload,
        format,
      });
      const fileName = buildBackupFileName(format);
      const storagePath = `${BACKUP_STORAGE_PREFIX.SYSTEM}/${job.id}/${fileName}`;
      await backupRepository.updateProgress(job.id, 92);
      await getBackupStorageProvider().upload({
        storagePath,
        buffer: packed.buffer,
        contentType: packed.contentType,
      });

      await backupRepository.completeSuccess(job.id, {
        storagePath,
        fileName,
        fileSizeBytes: packed.buffer.length,
        backupVersion: BACKUP_VERSION,
        meta: { tableCount: tables.length },
      });

      return {
        jobId: job.id,
        fileName,
        buffer: packed.buffer,
        contentType: packed.contentType,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'System backup failed';
      await backupRepository.completeFailed(job.id, message);
      logger.error('System backup failed', { jobId: job.id, message });
      throw err instanceof AppError
        ? err
        : new AppError(500, 'BACKUP_FAILED', 'System backup failed', message);
    }
  },

  async download(jobId: string): Promise<{
    buffer: Buffer;
    fileName: string;
    contentType: string;
  }> {
    const job = await backupRepository.findById(jobId);
    if (!job || job.type !== 'SYSTEM') throw new AppError(404, 'NOT_FOUND', 'Backup not found');
    if (job.status !== 'SUCCESS' || !job.storagePath) {
      throw new AppError(409, 'NOT_READY', 'Backup file is not ready');
    }
    const buffer = await getBackupStorageProvider().download(job.storagePath);
    if (!buffer) throw new AppError(404, 'NOT_FOUND', 'Backup file missing');
    return {
      buffer,
      fileName: job.fileName || buildBackupFileName(job.format),
      contentType: job.format === 'json' ? 'application/json; charset=utf-8' : 'application/zip',
    };
  },

  /**
   * Restores catalog + notice + member workout data from a SYSTEM backup.
   * Never restores passwords, OAuth tokens, payment history, or refresh tokens.
   * Runs in a single transaction — failure rolls back everything.
   */
  async restoreSystem(
    adminId: string,
    file: { buffer: Buffer; originalname?: string },
    confirmText: string
  ): Promise<{ jobId: string; restoredTables: string[] }> {
    if (confirmText.trim().toUpperCase() !== 'YES') {
      throw new AppError(400, 'CONFIRM_REQUIRED', 'Type YES to confirm system restore');
    }

    const job = await backupRepository.createLog({
      userId: adminId,
      type: 'SYSTEM',
      action: 'RESTORE',
      format: /\.zip$/i.test(file.originalname || '') ? 'zip' : 'json',
      restoreMode: 'replace',
      meta: { confirm: true },
    });

    try {
      await backupRepository.updateProgress(job.id, 5);
      const unpacked = await unpackBackupArchive(file.buffer, file.originalname);
      const parsed = systemBackupPayloadSchema.safeParse(unpacked.payload);
      if (!parsed.success) {
        throw new AppError(400, 'BACKUP_INVALID', 'Invalid system backup schema', parsed.error.flatten());
      }
      if (parsed.data.type !== 'SYSTEM') {
        throw new AppError(400, 'BACKUP_TYPE', 'This file is not a system backup');
      }

      const pool = getPool();
      if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');

      const restoredTables: string[] = [];
      const byTable = new Map(parsed.data.tables.map((t) => [t.table, t.rows]));

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await backupRepository.updateProgress(job.id, 20);

        // Restore notices (safe replace of notice content)
        if (byTable.has('notices') && (await tableExists(client, 'notices'))) {
          await client.query(`DELETE FROM notice_attachments`);
          await client.query(`DELETE FROM notice_translations`);
          await client.query(`DELETE FROM notice_views`);
          await client.query(`DELETE FROM notices`);
          for (const row of byTable.get('notices') ?? []) {
            await insertRow(client, 'notices', row);
          }
          restoredTables.push('notices');
          for (const row of byTable.get('notice_translations') ?? []) {
            await insertRow(client, 'notice_translations', row);
          }
          if ((byTable.get('notice_translations') ?? []).length) {
            restoredTables.push('notice_translations');
          }
          for (const row of byTable.get('notice_attachments') ?? []) {
            await insertRow(client, 'notice_attachments', row);
          }
          if ((byTable.get('notice_attachments') ?? []).length) {
            restoredTables.push('notice_attachments');
          }
        }

        await backupRepository.updateProgress(job.id, 45);

        // Brands / machines upsert by primary key (never wipe entire catalog blindly)
        for (const table of ['brands', 'machines', 'machine_images', 'machine_settings'] as const) {
          if (!byTable.has(table) || !(await tableExists(client, table))) continue;
          for (const row of byTable.get(table) ?? []) {
            await upsertById(client, table, row);
          }
          restoredTables.push(table);
        }

        await backupRepository.updateProgress(job.id, 70);

        // Member workout data: upsert only (no mass delete of all users)
        for (const table of [
          'workout_logs',
          'favorites',
          'user_machine_preferences',
        ] as const) {
          if (!byTable.has(table) || !(await tableExists(client, table))) continue;
          for (const row of byTable.get(table) ?? []) {
            await upsertById(client, table, row);
          }
          restoredTables.push(table);
        }

        if (byTable.has('backup_settings') && (await tableExists(client, 'backup_settings'))) {
          for (const row of byTable.get('backup_settings') ?? []) {
            await upsertById(client, 'backup_settings', row);
          }
          restoredTables.push('backup_settings');
        }

        await client.query('COMMIT');
        await backupRepository.updateProgress(job.id, 95);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

      await backupRepository.completeSuccess(job.id, {
        backupVersion: parsed.data.backup_version,
        meta: { restoredTables },
      });
      return { jobId: job.id, restoredTables };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'System restore failed';
      await backupRepository.completeFailed(job.id, message);
      logger.error('System restore failed', { jobId: job.id, message });
      throw err instanceof AppError
        ? err
        : new AppError(500, 'RESTORE_FAILED', 'System restore failed', message);
    }
  },

  async runAutoBackupIfDue(): Promise<void> {
    const settings = await backupRepository.getSettings();
    if (!settings.autoBackupEnabled) return;
    const now = new Date();
    if (now.getUTCHours() !== settings.autoBackupHourUtc) return;
    const today = now.toISOString().slice(0, 10);
    if (settings.lastAutoBackupDate === today) return;

    logger.warn('Starting scheduled system backup');
    try {
      await this.exportSystem(null, 'zip');
      await backupRepository.markAutoBackupRan(now);
    } catch (err) {
      logger.error('Scheduled system backup failed', {
        message: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    const storage = getBackupStorageProvider();
    const cutoff = new Date(now.getTime() - settings.retentionDays * 24 * 60 * 60 * 1000);
    const deleted = await storage.deleteOlderThan(`${BACKUP_STORAGE_PREFIX.SYSTEM}/`, cutoff);
    if (deleted > 0) {
      logger.warn(`Pruned ${deleted} expired system backups (retention ${settings.retentionDays}d)`);
    }
  },
};

async function insertRow(
  client: pg.PoolClient,
  table: string,
  row: Record<string, unknown>
): Promise<void> {
  const keys = Object.keys(row).filter((k) => row[k] !== undefined);
  if (!keys.length) return;
  const cols = keys.map((k) => `"${k}"`).join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  await client.query(
    `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
    keys.map((k) => row[k])
  );
}

async function upsertById(
  client: pg.PoolClient,
  table: string,
  row: Record<string, unknown>
): Promise<void> {
  const keys = Object.keys(row).filter((k) => row[k] !== undefined);
  if (!keys.length || row.id == null) {
    await insertRow(client, table, row);
    return;
  }
  const cols = keys.map((k) => `"${k}"`).join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const updates = keys
    .filter((k) => k !== 'id')
    .map((k) => `"${k}" = EXCLUDED."${k}"`)
    .join(', ');
  if (!updates) {
    await insertRow(client, table, row);
    return;
  }
  await client.query(
    `INSERT INTO ${table} (${cols}) VALUES (${placeholders})
     ON CONFLICT (id) DO UPDATE SET ${updates}`,
    keys.map((k) => row[k])
  );
}
