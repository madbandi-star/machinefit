import { DATA_RETENTION } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { complianceRepository } from '../repositories/compliance.repository.js';
import { dataRetentionRepository } from '../repositories/data-retention.repository.js';
import { locationRepository } from '../repositories/location.repository.js';
import { bannerRepository } from '../repositories/banner.repository.js';
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
  try {
    const result = await pool.query(`DELETE FROM ${table} WHERE ${column} = $1`, [userId]);
    return result.rowCount ?? 0;
  } catch {
    return 0;
  }
}

/** Legal-hold / rejoin-prevention tables — never hard-deleted here. */
const PURGE_KEEP_TABLES = new Set([
  'payment_history',
  'subscriptions',
  'user_consents',
  'trial_identity_ledger',
  'auth_provider_withdrawals',
  'admin_audit_logs',
]);

/**
 * Hard-purge non-legal-hold data for accounts past the deactivate grace period.
 * Keeps: anonymized users row, payment_history, subscriptions, user_consents,
 * trial_identity_ledger, auth_provider_withdrawals.
 */
async function purgeDeactivatedUserData(userId: string): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;
  let rowsAffected = 0;

  // Workout / prefs
  rowsAffected += await deleteForUser('workout_logs', userId);
  rowsAffected += await deleteForUser('workout_cards', userId);
  rowsAffected += await deleteForUser('workout_card_templates', userId);
  rowsAffected += await deleteForUser('favorites', userId);
  rowsAffected += await deleteForUser('recent_history', userId);
  rowsAffected += await deleteForUser('user_machine_preferences', userId);
  rowsAffected += await deleteForUser('recommendation_feedback', userId);
  rowsAffected += await deleteForUser('user_achievements', userId);
  rowsAffected += await deleteForUser('user_motivation_tracks', userId);
  rowsAffected += await deleteForUser('user_lifted_badges', userId);
  rowsAffected += await deleteForUser('machine_recommendations', userId);

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

  rowsAffected += await deleteForUser('template_share_comments', userId);
  rowsAffected += await deleteForUser('template_share_likes', userId);
  rowsAffected += await deleteForUser('template_share_favorites', userId);
  rowsAffected += await deleteForUser('template_share_downloads', userId);
  rowsAffected += await deleteForUser('template_share_reports', userId);
  rowsAffected += await deleteForUser('template_share_posts', userId, 'author_user_id');

  if (await tableExists('machine_trades')) {
    const r = await pool.query(`DELETE FROM machine_trades WHERE seller_id = $1`, [userId]);
    rowsAffected += r.rowCount ?? 0;
  }
  rowsAffected += await deleteForUser('machine_trade_likes', userId);
  rowsAffected += await deleteForUser('machine_trade_reports', userId, 'reporter_id');
  rowsAffected += await deleteForUser('machine_requests', userId);

  if (await tableExists('support_ticket_messages')) {
    const r = await pool.query(`DELETE FROM support_ticket_messages WHERE author_id = $1`, [
      userId,
    ]);
    rowsAffected += r.rowCount ?? 0;
  }
  if (await tableExists('support_tickets')) {
    await pool.query(`UPDATE support_tickets SET assigned_admin_id = NULL WHERE assigned_admin_id = $1`, [
      userId,
    ]);
    rowsAffected += await deleteForUser('support_tickets', userId);
  }

  rowsAffected += await deleteForUser('online_pt_followups', userId, 'member_id');
  rowsAffected += await deleteForUser('online_pt_reviews', userId, 'member_id');
  rowsAffected += await deleteForUser('online_pt_reports', userId, 'reporter_id');
  rowsAffected += await deleteForUser('online_pt_questions', userId, 'member_id');
  rowsAffected += await deleteForUser('online_pt_ticket_balances', userId);
  rowsAffected += await deleteForUser('online_pt_orders', userId, 'buyer_id');
  rowsAffected += await deleteForUser('online_pt_trainer_profiles', userId);
  rowsAffected += await deleteForUser('online_pt_wallet_ledger', userId, 'trainer_id');
  rowsAffected += await deleteForUser('online_pt_payout_requests', userId, 'trainer_id');

  // Owner-scoped gym roster (third-party PII) + personal gyms
  rowsAffected += await deleteForUser('gym_member_profile_requests', userId, 'owner_user_id');
  rowsAffected += await deleteForUser('gym_members', userId, 'owner_user_id');
  if (await tableExists('gym_members')) {
    const r = await pool.query(
      `UPDATE gym_members SET linked_user_id = NULL WHERE linked_user_id = $1`,
      [userId]
    );
    rowsAffected += r.rowCount ?? 0;
  }
  rowsAffected += await deleteForUser('user_gyms', userId);

  // Notifications / push
  rowsAffected += await deleteForUser('notifications', userId);
  if (await tableExists('push_delivery_logs')) {
    const r = await pool
      .query(`DELETE FROM push_delivery_logs WHERE recipient_id = $1 OR sender_id = $1`, [userId])
      .catch(() => null);
    rowsAffected += r?.rowCount ?? 0;
  }

  // OAuth links — normally already removed at withdraw; delete leftovers for legacy rows.
  rowsAffected += await deleteForUser('auth_providers', userId);

  try {
    const { storageService } = await import('./storage.service.js');
    rowsAffected += await storageService.removeUserOwnedObjects(userId);
  } catch (err) {
    logger.warn('[privacy-retention] storage purge skipped', { userId, err: String(err) });
  }
  try {
    const { getBackupStorageProvider } = await import(
      '../backup/providers/supabase-backup.provider.js'
    );
    const backup = getBackupStorageProvider();
    if (await tableExists('backup_logs')) {
      const paths = await pool.query<{ storage_path: string | null }>(
        `SELECT storage_path FROM backup_logs WHERE user_id = $1 AND storage_path IS NOT NULL`,
        [userId]
      );
      for (const row of paths.rows) {
        if (row.storage_path) {
          await backup.delete(row.storage_path).catch(() => undefined);
        }
      }
      rowsAffected += await deleteForUser('backup_logs', userId);
    }
  } catch (err) {
    logger.warn('[privacy-retention] backup file purge skipped', { userId, err: String(err) });
  }

  // Remaining FKs to users except legal-hold tables
  try {
    const { rows: fks } = await pool.query<{
      table_name: string;
      column_name: string;
      delete_rule: string;
    }>(
      `SELECT tc.table_name, kcu.column_name, rc.delete_rule
       FROM information_schema.table_constraints AS tc
       JOIN information_schema.key_column_usage AS kcu
         ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
       JOIN information_schema.constraint_column_usage AS ccu
         ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
       JOIN information_schema.referential_constraints AS rc
         ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.table_schema
       WHERE tc.constraint_type = 'FOREIGN KEY'
         AND ccu.table_name = 'users'
         AND tc.table_schema = 'public'
         AND tc.table_name <> 'users'`
    );
    for (const fk of fks) {
      if (PURGE_KEEP_TABLES.has(fk.table_name)) continue;
      if (!(await tableExists(fk.table_name))) continue;
      try {
        if (fk.delete_rule === 'SET NULL') {
          const r = await pool.query(
            `UPDATE ${fk.table_name} SET ${fk.column_name} = NULL WHERE ${fk.column_name} = $1`,
            [userId]
          );
          rowsAffected += r.rowCount ?? 0;
        } else {
          const r = await pool.query(
            `DELETE FROM ${fk.table_name} WHERE ${fk.column_name} = $1`,
            [userId]
          );
          rowsAffected += r.rowCount ?? 0;
        }
      } catch {
        /* child rows / missing columns */
      }
    }
  } catch (err) {
    logger.warn('[privacy-retention] FK sweep skipped', { userId, err: String(err) });
  }

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
    bannerEventsDeleted: number;
    accountsPurged: number;
    schedulesUpserted: number;
  }> {
    const pool = getPool();
    if (!pool) {
      return {
        gpsCleared: 0,
        consentIpScrubbed: 0,
        loginEventsDeleted: 0,
        bannerEventsDeleted: 0,
        accountsPurged: 0,
        schedulesUpserted: 0,
      };
    }

    const [gpsDays, consentIpDays, loginDays, bannerDays, purgeDays] = await Promise.all([
      resolveDays('user_locations_gps', DATA_RETENTION.gpsCoordinatesDays),
      resolveDays('consent_ip_meta', DATA_RETENTION.consentIpMetaDays),
      resolveDays('auth_login_events', DATA_RETENTION.loginEventsDays),
      resolveDays('banner_events', DATA_RETENTION.bannerEventsDays),
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

    let bannerEventsDeleted = 0;
    try {
      if (await tableExists('banner_events')) {
        bannerEventsDeleted = await bannerRepository.deleteEventsOlderThan(bannerDays);
      }
    } catch (err) {
      logger.warn('[privacy-retention] banner event cleanup skipped', { err: String(err) });
    }

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
    if (bannerEventsDeleted > 0) {
      await dataRetentionRepository.insertDeletionLog({
        action: 'auto_delete_banner_events',
        success: true,
        rowsAffected: bannerEventsDeleted,
        meta: { policyCode: 'banner_events', days: bannerDays },
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
      bannerEventsDeleted,
      accountsPurged,
      schedulesUpserted,
    };
  },
};
