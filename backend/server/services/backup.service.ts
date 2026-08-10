import type pg from 'pg';
import {
  BACKUP_STORAGE_PREFIX,
  BACKUP_VERSION,
  BACKUP_VERSION_MIN,
  buildBackupFileName,
  userBackupPayloadSchema,
  type BackupClientSettings,
  type BackupExportInput,
  type BackupFormat,
  type BackupImportResult,
  type BackupJobProgress,
  type BackupLogItem,
  type BackupRestoreMode,
  type UserBackupPayload,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';
import { backupRepository } from '../repositories/backup.repository.js';
import { packBackupArchive, unpackBackupArchive } from '../backup/backup-zip.js';
import { getBackupStorageProvider } from '../backup/providers/supabase-backup.provider.js';
import { logger } from '../utils/logger.js';

const APP_VERSION = process.env.npm_package_version || '0.1.0';

function isUuid(value: string | undefined | null): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

async function machineExists(client: pg.PoolClient, machineId: string): Promise<boolean> {
  const { rows } = await client.query(`SELECT 1 FROM machines WHERE id = $1 LIMIT 1`, [machineId]);
  return rows.length > 0;
}

async function scopeOwned(
  client: pg.PoolClient,
  userId: string,
  gymId: string,
  memberId: string
): Promise<boolean> {
  const { rows } = await client.query(
    `SELECT 1
     FROM user_gyms ug
     JOIN gym_members gm ON gm.id = $3 AND gm.user_gym_id = ug.id
     WHERE ug.id = $2 AND ug.user_id = $1
     LIMIT 1`,
    [userId, gymId, memberId]
  );
  return rows.length > 0;
}

function migrateUserPayload(raw: unknown): UserBackupPayload {
  const parsed = userBackupPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const hint = first
      ? `${first.path.join('.') || 'payload'}: ${first.message}`
      : 'schema validation failed';
    throw new AppError(
      400,
      'BACKUP_INVALID',
      `Backup file is invalid (${hint})`,
      parsed.error.flatten()
    );
  }
  const data = parsed.data;
  if (data.backup_version < BACKUP_VERSION_MIN) {
    throw new AppError(400, 'BACKUP_VERSION', 'This backup version is too old to import');
  }
  // Future adapters: if (data.backup_version < BACKUP_VERSION) transform...
  return data as UserBackupPayload;
}

export const backupService = {
  async getJob(userId: string, jobId: string): Promise<BackupJobProgress> {
    const job = await backupRepository.findById(jobId);
    if (!job) throw new AppError(404, 'NOT_FOUND', 'Backup job not found');
    if (job.userId && job.userId !== userId && job.type === 'USER') {
      throw new AppError(403, 'FORBIDDEN', 'Not allowed to view this backup job');
    }
    return {
      id: job.id,
      status: job.status,
      progress: job.progress,
      fileName: job.fileName,
      downloadReady: job.status === 'SUCCESS' && Boolean(job.storagePath),
      errorMessage: job.errorMessage,
    };
  },

  async history(userId: string, limit = 30): Promise<BackupLogItem[]> {
    return backupRepository.listHistory({ userId, type: 'USER', limit });
  },

  async exportUser(
    userId: string,
    input: BackupExportInput
  ): Promise<{ jobId: string; fileName: string; buffer: Buffer; contentType: string }> {
    const format: BackupFormat = input.format ?? 'zip';
    const job = await backupRepository.createLog({
      userId,
      type: 'USER',
      action: 'BACKUP',
      format,
      meta: { source: 'api' },
    });

    try {
      await backupRepository.updateProgress(job.id, 5);
      const pool = getPool();
      if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');

      const client = await pool.connect();
      let payload: UserBackupPayload;
      try {
        await backupRepository.updateProgress(job.id, 15);
        const userRes = await client.query(
          `SELECT u.id::text AS id,
                  u.display_name AS "displayName",
                  u.email,
                  u.gender,
                  u.birth_date::text AS "birthDate",
                  u.height_cm::float8 AS "heightCm",
                  u.weight_kg::float8 AS "weightKg",
                  u.experience_level AS "experienceLevel",
                  u.workout_goal AS "workoutGoal",
                  u.unit_height AS "unitHeight",
                  u.unit_weight AS "unitWeight",
                  u.subscription_plan AS "subscriptionPlan",
                  r.code AS "roleCode"
           FROM users u
           JOIN roles r ON r.id = u.role_id
           WHERE u.id = $1`,
          [userId]
        );
        const u = userRes.rows[0];
        if (!u) throw new AppError(404, 'NOT_FOUND', 'User not found');

        await backupRepository.updateProgress(job.id, 30);
        const logs = await client.query(
          `SELECT wl.id::text AS id,
                  wl.machine_id::text AS "machineId",
                  m.code AS "machineCode",
                  wl.gym_id::text AS "gymId",
                  wl.member_id::text AS "memberId",
                  wl.recommendation_id::text AS "recommendationId",
                  wl.log_date::text AS "logDate",
                  wl.target_muscle_group AS "targetMuscleGroup",
                  wl.set_count AS "setCount",
                  wl.set_weights_kg AS "setWeightsKg",
                  wl.set_completed AS "setCompleted",
                  wl.diary,
                  wl.created_at AS "createdAt",
                  wl.updated_at AS "updatedAt"
           FROM workout_logs wl
           JOIN machines m ON m.id = wl.machine_id
           WHERE wl.user_id = $1
           ORDER BY wl.log_date DESC, wl.updated_at DESC`,
          [userId]
        );

        await backupRepository.updateProgress(job.id, 50);
        const favorites = await client.query(
          `SELECT f.id::text AS id,
                  f.machine_id::text AS "machineId",
                  m.code AS "machineCode",
                  f.gym_id::text AS "gymId",
                  f.member_id::text AS "memberId",
                  f.created_at AS "createdAt"
           FROM favorites f
           JOIN machines m ON m.id = f.machine_id
           WHERE f.user_id = $1`,
          [userId]
        );

        const history = await client.query(
          `SELECT h.id::text AS id,
                  h.machine_id::text AS "machineId",
                  m.code AS "machineCode",
                  h.gym_id::text AS "gymId",
                  h.member_id::text AS "memberId",
                  h.viewed_at AS "viewedAt"
           FROM recent_history h
           JOIN machines m ON m.id = h.machine_id
           WHERE h.user_id = $1
           ORDER BY h.viewed_at DESC
           LIMIT 500`,
          [userId]
        );

        await backupRepository.updateProgress(job.id, 65);
        const prefs = await client.query(
          `SELECT p.id::text AS id,
                  p.machine_id::text AS "machineId",
                  m.code AS "machineCode",
                  p.gym_id::text AS "gymId",
                  p.member_id::text AS "memberId",
                  p.custom_settings AS "customSettings",
                  p.personal_tip_memo AS "personalTipMemo",
                  p.active_source AS "activeSource",
                  p.updated_at AS "updatedAt"
           FROM user_machine_preferences p
           JOIN machines m ON m.id = p.machine_id
           WHERE p.user_id = $1`,
          [userId]
        );

        let feedbackRows: Record<string, unknown>[] = [];
        try {
          const feedback = await client.query(
            `SELECT fb.id::text AS id,
                    fb.machine_id::text AS "machineId",
                    fb.fit_rating AS rating,
                    fb.created_at AS "createdAt"
             FROM recommendation_feedback fb
             WHERE fb.user_id = $1`,
            [userId]
          );
          feedbackRows = feedback.rows;
        } catch {
          feedbackRows = [];
        }

        const roleCode = String(u.roleCode ?? 'MEMBER');
        const planCode = u.subscriptionPlan ? String(u.subscriptionPlan) : 'free';
        payload = {
          backup_version: BACKUP_VERSION,
          type: 'USER',
          exported_at: new Date().toISOString(),
          app_version: APP_VERSION,
          user: {
            id: String(u.id),
            loginId: u.email ? String(u.email) : null,
            displayName: u.displayName ? String(u.displayName) : null,
            email: u.email ? String(u.email) : null,
            gender: u.gender ? String(u.gender) : null,
            birthDate: u.birthDate ? String(u.birthDate) : null,
            heightCm: u.heightCm != null ? Number(u.heightCm) : null,
            weightKg: u.weightKg != null ? Number(u.weightKg) : null,
            experienceLevel: u.experienceLevel ? String(u.experienceLevel) : null,
            workoutGoal: u.workoutGoal ? String(u.workoutGoal) : null,
            unitHeight: u.unitHeight ? String(u.unitHeight) : null,
            unitWeight: u.unitWeight ? String(u.unitWeight) : null,
            premium: {
              roleCode,
              planCode,
              planStatus: null,
              isPremium:
                planCode === 'premium' ||
                ['PREMIUM_MEMBER', 'VIP_MEMBER', 'ADMIN', 'OWNER', 'TRAINER'].includes(roleCode),
            },
          },
          client_settings: (input.clientSettings ?? {}) as BackupClientSettings,
          workout_logs: logs.rows.map((row) => ({
            id: String(row.id),
            machineId: String(row.machineId),
            machineCode: row.machineCode ? String(row.machineCode) : null,
            gymId: String(row.gymId),
            memberId: String(row.memberId),
            recommendationId: row.recommendationId ? String(row.recommendationId) : null,
            logDate: String(row.logDate).slice(0, 10),
            targetMuscleGroup: String(row.targetMuscleGroup ?? ''),
            setCount: Number(row.setCount),
            setWeightsKg: Array.isArray(row.setWeightsKg)
              ? row.setWeightsKg.map(Number)
              : [],
            setCompleted: Array.isArray(row.setCompleted)
              ? row.setCompleted.map(Boolean)
              : [],
            diary: row.diary != null ? String(row.diary) : null,
            createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : undefined,
            updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined,
          })),
          favorites: favorites.rows.map((row) => ({
            id: String(row.id),
            machineId: String(row.machineId),
            machineCode: row.machineCode ? String(row.machineCode) : null,
            gymId: row.gymId ? String(row.gymId) : null,
            memberId: row.memberId ? String(row.memberId) : null,
            createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : undefined,
          })),
          recent_history: history.rows.map((row) => ({
            id: String(row.id),
            machineId: String(row.machineId),
            machineCode: row.machineCode ? String(row.machineCode) : null,
            gymId: row.gymId ? String(row.gymId) : null,
            memberId: row.memberId ? String(row.memberId) : null,
            viewedAt: row.viewedAt ? new Date(row.viewedAt).toISOString() : undefined,
          })),
          user_machine_preferences: prefs.rows.map((row) => ({
            id: String(row.id),
            machineId: String(row.machineId),
            machineCode: row.machineCode ? String(row.machineCode) : null,
            gymId: String(row.gymId),
            memberId: String(row.memberId),
            customSettings:
              row.customSettings && typeof row.customSettings === 'object'
                ? (row.customSettings as Record<string, unknown>)
                : {},
            personalTipMemo: row.personalTipMemo ? String(row.personalTipMemo) : '',
            activeSource: row.activeSource ? String(row.activeSource) : 'recommended',
            updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined,
          })),
          recommendation_feedback: feedbackRows.map((row) => ({
            id: String(row.id),
            machineId: String(row.machineId),
            rating: row.rating != null ? Number(row.rating) || null : null,
            comment: null,
            createdAt: row.createdAt ? new Date(String(row.createdAt)).toISOString() : undefined,
          })),
        };
      } finally {
        client.release();
      }

      await backupRepository.updateProgress(job.id, 80);
      const packed = await packBackupArchive({
        type: 'USER',
        backupVersion: BACKUP_VERSION,
        appVersion: APP_VERSION,
        payload,
        format,
      });
      const fileName = buildBackupFileName(format);
      const storagePath = `${BACKUP_STORAGE_PREFIX.USER}/${userId}/${job.id}/${fileName}`;

      await backupRepository.updateProgress(job.id, 90);
      const storage = getBackupStorageProvider();
      await storage.upload({
        storagePath,
        buffer: packed.buffer,
        contentType: packed.contentType,
      });

      await backupRepository.completeSuccess(job.id, {
        storagePath,
        fileName,
        fileSizeBytes: packed.buffer.length,
        backupVersion: BACKUP_VERSION,
        meta: {
          counts: {
            workoutLogs: payload.workout_logs.length,
            favorites: payload.favorites.length,
            preferences: payload.user_machine_preferences.length,
          },
        },
      });

      return {
        jobId: job.id,
        fileName,
        buffer: packed.buffer,
        contentType: packed.contentType,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Backup failed';
      await backupRepository.completeFailed(job.id, message);
      logger.error('User backup failed', { userId, jobId: job.id, message });
      throw err instanceof AppError
        ? err
        : new AppError(500, 'BACKUP_FAILED', 'Backup failed', message);
    }
  },

  async downloadUserBackup(userId: string, jobId: string): Promise<{
    buffer: Buffer;
    fileName: string;
    contentType: string;
  }> {
    const job = await backupRepository.findById(jobId);
    if (!job || job.type !== 'USER') throw new AppError(404, 'NOT_FOUND', 'Backup not found');
    if (job.userId !== userId) throw new AppError(403, 'FORBIDDEN', 'Not your backup');
    if (job.status !== 'SUCCESS' || !job.storagePath) {
      throw new AppError(409, 'NOT_READY', 'Backup file is not ready');
    }
    const buffer = await getBackupStorageProvider().download(job.storagePath);
    if (!buffer) throw new AppError(404, 'NOT_FOUND', 'Backup file missing from storage');
    const fileName = job.fileName || buildBackupFileName(job.format);
    const contentType =
      job.format === 'json' ? 'application/json; charset=utf-8' : 'application/zip';
    return { buffer, fileName, contentType };
  },

  async importUser(
    userId: string,
    file: { buffer: Buffer; originalname?: string },
    mode: BackupRestoreMode
  ): Promise<{ jobId: string; result: BackupImportResult }> {
    const job = await backupRepository.createLog({
      userId,
      type: 'USER',
      action: 'RESTORE',
      format: /\.zip$/i.test(file.originalname || '') ? 'zip' : 'json',
      restoreMode: mode,
    });

    try {
      await backupRepository.updateProgress(job.id, 5);
      let payloadRaw: unknown;
      try {
        const unpacked = await unpackBackupArchive(file.buffer, file.originalname);
        payloadRaw = unpacked.payload;
      } catch (err) {
        throw new AppError(
          400,
          'BACKUP_CORRUPT',
          err instanceof Error ? err.message : 'Could not read backup file'
        );
      }

      await backupRepository.updateProgress(job.id, 15);
      const payload = migrateUserPayload(payloadRaw);
      if (payload.type !== 'USER') {
        throw new AppError(400, 'BACKUP_TYPE', 'This file is not a user backup');
      }

      const pool = getPool();
      if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');

      const result: BackupImportResult = {
        mode,
        restored: {
          workoutLogs: 0,
          favorites: 0,
          recentHistory: 0,
          preferences: 0,
          feedback: 0,
        },
        skippedDuplicates: 0,
        clientSettings: payload.client_settings ?? null,
      };

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        // Pool default statement_timeout is 30s — restore may need longer.
        await client.query(`SET LOCAL statement_timeout = '120000'`);
        await backupRepository.updateProgress(job.id, 25);

        if (mode === 'replace') {
          await client.query(`DELETE FROM workout_logs WHERE user_id = $1`, [userId]);
          await client.query(`DELETE FROM favorites WHERE user_id = $1`, [userId]);
          await client.query(`DELETE FROM recent_history WHERE user_id = $1`, [userId]);
          await client.query(`DELETE FROM user_machine_preferences WHERE user_id = $1`, [userId]);
          try {
            await client.query(`DELETE FROM recommendation_feedback WHERE user_id = $1`, [userId]);
          } catch {
            // optional table shape
          }
        }

        await backupRepository.updateProgress(job.id, 40);

        // Safe profile fields only (never password / oauth / payment).
        // Skip display_name when it would violate active-username uniqueness (migration 109).
        await client.query(
          `UPDATE users SET
             display_name = CASE
               WHEN $2::text IS NULL OR btrim($2::text) = '' THEN display_name
               WHEN EXISTS (
                 SELECT 1 FROM users u2
                 WHERE u2.is_active = TRUE
                   AND lower(u2.display_name) = lower(btrim($2::text))
                   AND u2.id <> users.id
               ) THEN display_name
               ELSE left(btrim($2::text), 100)
             END,
             gender = COALESCE($3, gender),
             birth_date = COALESCE($4::date, birth_date),
             height_cm = COALESCE($5, height_cm),
             weight_kg = COALESCE($6, weight_kg),
             experience_level = COALESCE($7, experience_level),
             workout_goal = COALESCE($8, workout_goal),
             unit_height = COALESCE($9, unit_height),
             unit_weight = COALESCE($10, unit_weight),
             updated_at = NOW()
           WHERE id = $1`,
          [
            userId,
            payload.user.displayName,
            payload.user.gender ?? null,
            payload.user.birthDate ?? null,
            payload.user.heightCm,
            payload.user.weightKg,
            payload.user.experienceLevel ?? null,
            payload.user.workoutGoal ?? null,
            payload.user.unitHeight ?? null,
            payload.user.unitWeight ?? null,
          ]
        );

        await backupRepository.updateProgress(job.id, 55);

        for (const log of payload.workout_logs) {
          if (!(await machineExists(client, log.machineId))) continue;
          if (!(await scopeOwned(client, userId, log.gymId, log.memberId))) continue;

          if (mode === 'merge' && isUuid(log.id)) {
            const existing = await client.query(
              `SELECT 1 FROM workout_logs WHERE id = $1 AND user_id = $2`,
              [log.id, userId]
            );
            if (existing.rows.length > 0) {
              result.skippedDuplicates += 1;
              continue;
            }
          }

          const setCompleted =
            log.setCompleted?.length === log.setCount
              ? log.setCompleted
              : Array.from({ length: log.setCount }, () => false);

          await client.query(
            `INSERT INTO workout_logs (
               user_id, gym_id, member_id, machine_id, recommendation_id, log_date,
               target_muscle_group, set_count, set_weights_kg, set_completed, diary
             ) VALUES (
               $1, $2, $3, $4, $5, $6::date, $7, $8, $9::jsonb, $10::jsonb, $11
             )
             ON CONFLICT (user_id, gym_id, member_id, machine_id, log_date, target_muscle_group)
             DO UPDATE SET
               set_count = EXCLUDED.set_count,
               set_weights_kg = EXCLUDED.set_weights_kg,
               set_completed = EXCLUDED.set_completed,
               diary = EXCLUDED.diary,
               updated_at = NOW()`,
            [
              userId,
              log.gymId,
              log.memberId,
              log.machineId,
              isUuid(log.recommendationId ?? undefined) ? log.recommendationId : null,
              log.logDate,
              log.targetMuscleGroup ?? '',
              log.setCount,
              JSON.stringify(log.setWeightsKg),
              JSON.stringify(setCompleted),
              log.diary ?? null,
            ]
          );
          result.restored.workoutLogs += 1;
        }

        await backupRepository.updateProgress(job.id, 70);

        for (const fav of payload.favorites) {
          if (!(await machineExists(client, fav.machineId))) continue;
          if (!fav.gymId || !fav.memberId) continue;
          if (!(await scopeOwned(client, userId, fav.gymId, fav.memberId))) continue;
          if (mode === 'merge' && isUuid(fav.id)) {
            const existing = await client.query(
              `SELECT 1 FROM favorites WHERE id = $1 AND user_id = $2`,
              [fav.id, userId]
            );
            if (existing.rows.length > 0) {
              result.skippedDuplicates += 1;
              continue;
            }
          }
          const inserted = await client.query(
            `INSERT INTO favorites (user_id, gym_id, member_id, machine_id, source)
             VALUES ($1, $2, $3, $4, 'backup')
             ON CONFLICT (user_id, gym_id, member_id, machine_id) DO NOTHING
             RETURNING id`,
            [userId, fav.gymId, fav.memberId, fav.machineId]
          );
          if (inserted.rowCount) result.restored.favorites += 1;
          else result.skippedDuplicates += 1;
        }

        for (const item of payload.recent_history) {
          if (!(await machineExists(client, item.machineId))) continue;
          if (!item.gymId || !item.memberId) continue;
          if (!(await scopeOwned(client, userId, item.gymId, item.memberId))) continue;
          const rec = await client.query<{ id: string }>(
            `SELECT id::text AS id FROM machine_recommendations
             WHERE machine_id = $1 AND user_id = $2
               AND gym_id = $3 AND member_id = $4
             ORDER BY created_at DESC LIMIT 1`,
            [item.machineId, userId, item.gymId, item.memberId]
          );
          let recommendationId = rec.rows[0]?.id;
          if (!recommendationId) {
            // Fallback for older rows without gym/member on recommendations.
            const fallback = await client.query<{ id: string }>(
              `SELECT id::text AS id FROM machine_recommendations
               WHERE machine_id = $1 AND user_id = $2
               ORDER BY created_at DESC LIMIT 1`,
              [item.machineId, userId]
            );
            recommendationId = fallback.rows[0]?.id;
          }
          if (!recommendationId) continue;
          await client.query(
            `INSERT INTO recent_history (
               user_id, gym_id, member_id, machine_id, recommendation_id, source, viewed_at
             ) VALUES ($1, $2, $3, $4, $5, 'backup', COALESCE($6::timestamptz, NOW()))
             ON CONFLICT (user_id, gym_id, member_id, recommendation_id)
             DO UPDATE SET
               viewed_at = GREATEST(
                 recent_history.viewed_at,
                 EXCLUDED.viewed_at
               ),
               machine_id = EXCLUDED.machine_id,
               source = EXCLUDED.source,
               updated_at = NOW()`,
            [
              userId,
              item.gymId,
              item.memberId,
              item.machineId,
              recommendationId,
              item.viewedAt ?? null,
            ]
          );
          result.restored.recentHistory += 1;
        }

        await backupRepository.updateProgress(job.id, 85);

        for (const pref of payload.user_machine_preferences) {
          if (!(await machineExists(client, pref.machineId))) continue;
          if (!(await scopeOwned(client, userId, pref.gymId, pref.memberId))) continue;
          await client.query(
            `INSERT INTO user_machine_preferences (
               user_id, gym_id, member_id, machine_id, custom_settings, personal_tip_memo, active_source
             ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
             ON CONFLICT (user_id, gym_id, member_id, machine_id)
             DO UPDATE SET
               custom_settings = EXCLUDED.custom_settings,
               personal_tip_memo = EXCLUDED.personal_tip_memo,
               active_source = EXCLUDED.active_source,
               updated_at = NOW()`,
            [
              userId,
              pref.gymId,
              pref.memberId,
              pref.machineId,
              JSON.stringify(pref.customSettings ?? {}),
              pref.personalTipMemo ?? '',
              pref.activeSource === 'adjusted' ? 'adjusted' : 'recommended',
            ]
          );
          result.restored.preferences += 1;
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
        backupVersion: payload.backup_version,
        meta: { result },
      });

      return { jobId: job.id, result };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Restore failed';
      await backupRepository.completeFailed(job.id, message);
      logger.error('User restore failed', { userId, jobId: job.id, message });
      if (err instanceof AppError) throw err;
      // Surface DB/unique errors so the client toast is actionable.
      throw new AppError(500, 'RESTORE_FAILED', message);
    }
  },
};
