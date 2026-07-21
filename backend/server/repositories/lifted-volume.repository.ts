import { getPool } from '../config/database.js';

export type LiftedScope =
  | 'global'
  | 'gym'
  | 'user'
  | 'user_gym'
  | 'user_month'
  | 'user_year';

export const liftedVolumeRepository = {
  async getTotal(scope: LiftedScope, scopeId = ''): Promise<number> {
    const pool = getPool();
    if (!pool) return 0;
    const result = await pool.query<{ total_kg: string }>(
      `SELECT total_kg::text FROM lifted_volume_totals WHERE scope = $1 AND scope_id = $2`,
      [scope, scopeId]
    );
    return parseFloat(result.rows[0]?.total_kg ?? '0') || 0;
  },

  async applyDelta(deltas: { scope: LiftedScope; scopeId: string; deltaKg: number }[]): Promise<void> {
    const pool = getPool();
    if (!pool || deltas.length === 0) return;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const row of deltas) {
        if (!Number.isFinite(row.deltaKg) || row.deltaKg === 0) continue;
        await client.query(
          `INSERT INTO lifted_volume_totals (scope, scope_id, total_kg, updated_at)
           VALUES ($1, $2, GREATEST(0, $3), NOW())
           ON CONFLICT (scope, scope_id) DO UPDATE
             SET total_kg = GREATEST(0, lifted_volume_totals.total_kg + EXCLUDED.total_kg),
                 updated_at = NOW()`,
          [row.scope, row.scopeId, row.deltaKg]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async listTopUsers(options: {
    scope: 'user' | 'user_gym' | 'user_month' | 'user_year';
    scopeIdPrefix?: string;
    limit?: number;
  }): Promise<{ userId: string; totalKg: number }[]> {
    const pool = getPool();
    if (!pool) return [];
    const limit = options.limit ?? 100;

    if (options.scope === 'user') {
      const result = await pool.query<{ scope_id: string; total_kg: string }>(
        `SELECT scope_id, total_kg::text
         FROM lifted_volume_totals
         WHERE scope = 'user' AND total_kg > 0
         ORDER BY total_kg DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows.map((r) => ({
        userId: r.scope_id,
        totalKg: parseFloat(r.total_kg) || 0,
      }));
    }

    const prefix = options.scopeIdPrefix ?? '';
    const result = await pool.query<{ scope_id: string; total_kg: string }>(
      `SELECT scope_id, total_kg::text
       FROM lifted_volume_totals
       WHERE scope = $1
         AND scope_id LIKE $2
         AND total_kg > 0
       ORDER BY total_kg DESC
       LIMIT $3`,
      [options.scope, `${prefix}%`, limit]
    );

    return result.rows.map((r) => {
      const userId = r.scope_id.split('|')[0] ?? r.scope_id;
      return { userId, totalKg: parseFloat(r.total_kg) || 0 };
    });
  },

  async listEarnedBadges(userId: string): Promise<string[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query<{ badge_id: string }>(
      `SELECT badge_id FROM user_lifted_badges WHERE user_id = $1`,
      [userId]
    );
    return result.rows.map((r) => r.badge_id);
  },

  async awardBadges(userId: string, badgeIds: string[]): Promise<void> {
    const pool = getPool();
    if (!pool || badgeIds.length === 0) return;
    for (const badgeId of badgeIds) {
      await pool.query(
        `INSERT INTO user_lifted_badges (user_id, badge_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [userId, badgeId]
      );
    }
  },
};
