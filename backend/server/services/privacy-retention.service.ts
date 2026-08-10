import { DATA_RETENTION } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { complianceRepository } from '../repositories/compliance.repository.js';
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
  const result = await pool.query(
    `DELETE FROM ${table} WHERE ${column} = $1`,
    [userId]
  );
  return result.rowCount ?? 0;
}

/**
 * Hard-purge non-legal-hold data for accounts past the deactivate grace period.
 * Keeps: users row (already anonymized), payment_history, subscriptions, user_consents.
 */
async function purgeDeactivatedUserData(userId: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  // Workout / prefs
  await deleteForUser('workout_logs', userId);
  await deleteForUser('workout_cards', userId);
  await deleteForUser('favorites', userId);
  await deleteForUser('recent_history', userId);
  await deleteForUser('user_machine_preferences', userId);
  await deleteForUser('recommendation_feedback', userId);
  await deleteForUser('user_achievements', userId);
  await deleteForUser('user_motivation_tracks', userId);

  // Friends / social graph
  if (await tableExists('friendships')) {
    await pool.query(
      `DELETE FROM friendships WHERE user_low_id = $1 OR user_high_id = $1`,
      [userId]
    );
  }
  if (await tableExists('friend_requests')) {
    await pool.query(
      `DELETE FROM friend_requests WHERE from_user_id = $1 OR to_user_id = $1`,
      [userId]
    );
  }
  await deleteForUser('friend_privacy_settings', userId);
  await deleteForUser('friend_activity_logs', userId);
  await deleteForUser('friend_referral_codes', userId);
  await deleteForUser('friend_referral_events', userId);
  await deleteForUser('friend_reports', userId, 'reporter_id');
  if (await tableExists('blocked_users')) {
    await pool.query(
      `DELETE FROM blocked_users WHERE blocker_id = $1 OR blocked_id = $1`,
      [userId]
    );
  }

  // UGC — delete comments first where needed
  if (await tableExists('comments')) {
    await pool.query(`DELETE FROM comments WHERE user_id = $1`, [userId]);
  }
  if (await tableExists('likes')) {
    await pool.query(`DELETE FROM likes WHERE user_id = $1`, [userId]);
  }
  await deleteForUser('posts', userId);
  if (await tableExists('photo_post_comments')) {
    await pool.query(`DELETE FROM photo_post_comments WHERE user_id = $1`, [userId]);
  }
  await deleteForUser('photo_posts', userId);

  // Notifications / push
  await deleteForUser('notifications', userId);
  if (await tableExists('push_delivery_logs')) {
    await pool.query(
      `DELETE FROM push_delivery_logs WHERE recipient_id = $1`,
      [userId]
    ).catch(() => null);
  }

  // OAuth links — normally already removed at withdraw; delete leftovers for legacy rows.
  await deleteForUser('auth_providers', userId);

  // Mark purge done so we don't re-scan forever (column from migration 107)
  await pool.query(
    `UPDATE users
     SET data_purged_at = NOW()
     WHERE id = $1 AND is_active = FALSE`,
    [userId]
  );
}

export const privacyRetentionService = {
  async runRetentionPass(): Promise<{
    gpsCleared: number;
    consentIpScrubbed: number;
    loginEventsDeleted: number;
    accountsPurged: number;
  }> {
    const pool = getPool();
    if (!pool) {
      return {
        gpsCleared: 0,
        consentIpScrubbed: 0,
        loginEventsDeleted: 0,
        accountsPurged: 0,
      };
    }

    const gpsCleared = await locationRepository.clearStaleGpsCoordinates(
      DATA_RETENTION.gpsCoordinatesDays
    );
    const consentIpScrubbed = await complianceRepository.scrubConsentIpMetaOlderThan(
      DATA_RETENTION.consentIpMetaDays
    );
    const loginEventsDeleted = await complianceRepository.deleteLoginEventsOlderThan(
      DATA_RETENTION.loginEventsDays
    );

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
      [String(DATA_RETENTION.deactivatedAccountPurgeDays)]
    );

    for (const row of due.rows) {
      try {
        await purgeDeactivatedUserData(row.id);
        accountsPurged += 1;
      } catch (err) {
        logger.error('[privacy-retention] account purge failed', {
          userId: row.id,
          err: String(err),
        });
      }
    }

    return { gpsCleared, consentIpScrubbed, loginEventsDeleted, accountsPurged };
  },
};
