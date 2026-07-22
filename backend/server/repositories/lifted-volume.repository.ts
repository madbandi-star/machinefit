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

    const rows = deltas.filter((row) => Number.isFinite(row.deltaKg) && row.deltaKg !== 0);
    if (rows.length === 0) return;

    const scopes = rows.map((r) => r.scope);
    const scopeIds = rows.map((r) => r.scopeId);
    const deltaKgs = rows.map((r) => r.deltaKg);

    await pool.query(
      `INSERT INTO lifted_volume_totals (scope, scope_id, total_kg, updated_at)
       SELECT x.scope, x.scope_id, GREATEST(0, x.delta_kg), NOW()
       FROM UNNEST($1::text[], $2::text[], $3::numeric[]) AS x(scope, scope_id, delta_kg)
       ON CONFLICT (scope, scope_id) DO UPDATE
         SET total_kg = GREATEST(0, lifted_volume_totals.total_kg + EXCLUDED.total_kg),
             updated_at = NOW()`,
      [scopes, scopeIds, deltaKgs]
    );
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
    await pool.query(
      `INSERT INTO user_lifted_badges (user_id, badge_id)
       SELECT $1, x.badge_id
       FROM UNNEST($2::text[]) AS x(badge_id)
       ON CONFLICT DO NOTHING`,
      [userId, badgeIds]
    );
  },
};
