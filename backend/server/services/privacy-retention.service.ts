import { DATA_RETENTION } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { complianceRepository } from '../repositories/compliance.repository.js';
import { dataRetentionRepository } from '../repositories/data-retention.repository.js';
import { locationRepository } from '../repositories/location.repository.js';
import { logger } from '../utils/logger.js';

async function tableExists(table: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const { rows } = await pool.query<{ exists: boolean }>(
    `SELECT to_regclass($1) IS NOT NULL AS exists`,
    [`public.${table}`]
  );
  return Boolean(rows[0]?.exists);
}

async function deleteForUser(table: string, userId: string, column = 'user_id'): Promise<number> {
  const pool = getPool();
  if (!pool || !(await tableExists(table))) return 0;
  const result = await pool.query(`DELETE FROM ${table} WHERE ${column} = $1`, [userId]);
  return result.rowCount ?? 0;
}

/**
 * Hard-purge non-legal-hold data for accounts past the deactivate grace period.
 * Keeps: users row (already anonymized), payment_history, subscriptions, user_consents.
 */
async function purgeDeactivatedUserData(userId: string): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;
  let rowsAffected = 0;

  // Workout / prefs
  rowsAffected += await deleteForUser('workout_logs', userId);
  rowsAffected += await deleteForUser('workout_cards', userId);
  rowsAffected += await deleteForUser('favorites', userId);
  rowsAffected += await deleteForUser('recent_history', userId);
  rowsAffected += await deleteForUser('user_machine_preferences', userId);
  rowsAffected += await deleteForUser('recommendation_feedback', userId);
  rowsAffected += await deleteForUser('user_achievements', userId);
  rowsAffected += await deleteForUser('user_motivation_tracks', userId);

  // Friends / social graph
  if (await tableExists('friendships')) {
    const r = await pool.query(
      `DELETE FROM friendships WHERE user_low_id = $1 OR user_high_id = $1`,
      [userId]
    );
    rowsAffected += r.rowCount ?? 0;
  }
  if (await tableExists('friend_requests')) {
    const r = await pool.query(
      `DELETE FROM friend_requests WHERE from_user_id = $1 OR to_user_id = $1`,
      [userId]
    );
    rowsAffected += r.rowCount ?? 0;
  }
  rowsAffected += await deleteForUser('friend_privacy_settings', userId);
  rowsAffected += await deleteForUser('friend_activity_logs', userId);
  rowsAffected += await deleteForUser('friend_referral_codes', userId);
  rowsAffected += await deleteForUser('friend_referral_events', userId);
  rowsAffected += await deleteForUser('friend_reports', userId, 'reporter_id');
  if (await tableExists('blocked_users')) {
    const r = await pool.query(
      `DELETE FROM blocked_users WHERE blocker_id = $1 OR blocked_id = $1`,
      [userId]
    );
    rowsAffected += r.rowCount ?? 0;
  }

  // UGC — delete comments first where needed
  if (await tableExists('comments')) {
    const r = await pool.query(`DELETE FROM comments WHERE user_id = $1`, [userId]);
    rowsAffected += r.rowCount ?? 0;
  }
  if (await tableExists('likes')) {
    const r = await pool.query(`DELETE FROM likes WHERE user_id = $1`, [userId]);
    rowsAffected += r.rowCount ?? 0;
  }
  rowsAffected += await deleteForUser('posts', userId);
  if (await tableExists('photo_post_comments')) {
    const r = await pool.query(`DELETE FROM photo_post_comments WHERE user_id = $1`, [userId]);
    rowsAffected += r.rowCount ?? 0;
  }
  rowsAffected += await deleteForUser('photo_posts', userId);

  // Notifications / push
  rowsAffected += await deleteForUser('notifications', userId);
  if (await tableExists('push_delivery_logs')) {
    const r = await pool
      .query(`DELETE FROM push_delivery_logs WHERE recipient_id = $1`, [userId])
      .catch(() => null);
    rowsAffected += r?.rowCount ?? 0;
  }

  // OAuth links — normally already removed at withdraw; delete leftovers for legacy rows.
  rowsAffected += await deleteForUser('auth_providers', userId);

  // Mark purge done so we don't re-scan forever (column from migration 107)
  await pool.query(
    `UPDATE users
     SET data_purged_at = NOW()
     WHERE id = $1 AND is_active = FALSE`,
    [userId]
  );

  return rowsAffected;
}

async function resolveDays(policyCode: string, fallback: number): Promise<number> {
  try {
    const days = await dataRetentionRepository.getActivePeriodDays(policyCode);
    return days ?? fallback;
  } catch {
    return fallback;
  }
}

export const privacyRetentionService = {
  async runRetentionPass(): Promise<{
    gpsCleared: number;
    consentIpScrubbed: number;
    loginEventsDeleted: number;
    accountsPurged: number;
    schedulesUpserted: number;
  }> {
    const pool = getPool();
    if (!pool) {
      return {
        gpsCleared: 0,
        consentIpScrubbed: 0,
        loginEventsDeleted: 0,
        accountsPurged: 0,
        schedulesUpserted: 0,
      };
    }

    const [gpsDays, consentIpDays, loginDays, purgeDays] = await Promise.all([
      resolveDays('user_locations_gps', DATA_RETENTION.gpsCoordinatesDays),
      resolveDays('consent_ip_meta', DATA_RETENTION.consentIpMetaDays),
      resolveDays('auth_login_events', DATA_RETENTION.loginEventsDays),
      resolveDays('deactivated_account_purge', DATA_RETENTION.deactivatedAccountPurgeDays),
    ]);

    let schedulesUpserted = 0;
    try {
      schedulesUpserted = await dataRetentionRepository.upsertWithdrawnUserRecords();
    } catch (err) {
      logger.warn('[privacy-retention] schedule upsert skipped', { err: String(err) });
    }

    const gpsCleared = await locationRepository.clearStaleGpsCoordinates(gpsDays);
    const consentIpScrubbed =
      await complianceRepository.scrubConsentIpMetaOlderThan(consentIpDays);
    const loginEventsDeleted =
      await complianceRepository.deleteLoginEventsOlderThan(loginDays);

    if (gpsCleared > 0) {
      await dataRetentionRepository.insertDeletionLog({
        action: 'auto_scrub_gps',
        success: true,
        rowsAffected: gpsCleared,
        meta: { policyCode: 'user_locations_gps', days: gpsDays },
      });
    }
    if (consentIpScrubbed > 0) {
      await dataRetentionRepository.insertDeletionLog({
        action: 'auto_scrub_consent_ip',
        success: true,
        rowsAffected: consentIpScrubbed,
        meta: { policyCode: 'consent_ip_meta', days: consentIpDays },
      });
    }
    if (loginEventsDeleted > 0) {
      await dataRetentionRepository.insertDeletionLog({
        action: 'auto_delete_login_events',
        success: true,
        rowsAffected: loginEventsDeleted,
        meta: { policyCode: 'auth_login_events', days: loginDays },
      });
    }

    let accountsPurged = 0;
    const due = await pool.query<{ id: string }>(
      `SELECT id::text AS id
       FROM users
       WHERE is_active = FALSE
         AND deactivated_at IS NOT NULL
         AND deactivated_at < NOW() - ($1::text || ' days')::interval
         AND data_purged_at IS NULL
       ORDER BY deactivated_at ASC
       LIMIT 50`,
      [String(purgeDays)]
    );

    const purgePolicy = await dataRetentionRepository.getPolicyByCode(
      'deactivated_account_purge'
    );

    for (const row of due.rows) {
      const linked = await dataRetentionRepository.findRecordByPolicyAndSubject(
        'deactivated_account_purge',
        row.id
      );
      // Skip held / exempted records
      if (linked) {
        const holdCheck = await pool.query<{ hold: boolean; status: string }>(
          `SELECT hold, status FROM data_retention_records WHERE id = $1`,
          [linked.id]
        );
        const rec = holdCheck.rows[0];
        if (rec?.hold || rec?.status === 'HOLD' || rec?.status === 'EXEMPTED') {
          continue;
        }
        if (purgePolicy?.isLegalHold) {
          continue;
        }
        await dataRetentionRepository.markRecordStatus(linked.id, 'DELETE_PROCESSING');
      }

      try {
        const rowsAffected = await purgeDeactivatedUserData(row.id);
        accountsPurged += 1;
        if (linked) {
          await dataRetentionRepository.markRecordStatus(linked.id, 'DELETE_COMPLETED', {
            deletedAt: new Date(),
            lastError: null,
          });
        }
        await dataRetentionRepository.insertDeletionLog({
          recordId: linked?.id ?? null,
          policyId: linked?.policyId ?? purgePolicy?.id ?? null,
          action: 'auto_purge_deactivated',
          success: true,
          rowsAffected,
          meta: { userId: row.id, days: purgeDays },
        });
      } catch (err) {
        logger.error('[privacy-retention] account purge failed', {
          userId: row.id,
          err: String(err),
        });
        if (linked) {
          const cur = await pool.query<{ retry_count: number }>(
            `SELECT retry_count FROM data_retention_records WHERE id = $1`,
            [linked.id]
          );
          const retry = Number(cur.rows[0]?.retry_count ?? 0) + 1;
          await dataRetentionRepository.markRecordStatus(linked.id, 'DELETE_FAILED', {
            lastError: String(err).slice(0, 500),
            retryCount: retry,
          });
        }
        await dataRetentionRepository.insertDeletionLog({
          recordId: linked?.id ?? null,
          policyId: linked?.policyId ?? purgePolicy?.id ?? null,
          action: 'auto_purge_deactivated',
          success: false,
          errorMessage: String(err).slice(0, 500),
          meta: { userId: row.id },
        });
      }
    }

    return {
      gpsCleared,
      consentIpScrubbed,
      loginEventsDeleted,
      accountsPurged,
      schedulesUpserted,
    };
  },
};
