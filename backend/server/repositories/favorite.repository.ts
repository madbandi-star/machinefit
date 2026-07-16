import { getPool } from '../config/database.js';

export interface FavoriteItem {
  id: string;
  machineId: string;
  machineCode: string;
  machineName: string;
  recommendationId?: string;
  createdAt: string;
}

export const favoriteRepository = {
  async listByUser(userId: string): Promise<FavoriteItem[]> {
    const pool = getPool();
    if (!pool) return [];

    const result = await pool.query<{
      id: string;
      machine_id: string;
      machine_code: string;
      machine_name: Record<string, string>;
      recommendation_id: string | null;
      created_at: string;
    }>(
      `SELECT f.id, f.machine_id, f.recommendation_id, f.created_at,
              m.code AS machine_code, m.name AS machine_name
       FROM favorites f
       JOIN machines m ON m.id = f.machine_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      machineId: row.machine_id,
      machineCode: row.machine_code,
      machineName: row.machine_name.en ?? row.machine_code,
      recommendationId: row.recommendation_id ?? undefined,
      createdAt: row.created_at,
    }));
  },

  async add(userId: string, machineId: string, recommendationId?: string): Promise<FavoriteItem> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');

    const result = await pool.query<{ id: string }>(
      `INSERT INTO favorites (user_id, machine_id, recommendation_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, machine_id) DO UPDATE SET recommendation_id = EXCLUDED.recommendation_id
       RETURNING id`,
      [userId, machineId, recommendationId ?? null]
    );

    const items = await this.listByUser(userId);
    const item = items.find((f) => f.id === result.rows[0].id);
    if (!item) throw new Error('Failed to add favorite');
    return item;
  },

  async remove(userId: string, favoriteId: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query('DELETE FROM favorites WHERE id = $1 AND user_id = $2', [
      favoriteId,
      userId,
    ]);
  },

  async isFavorited(userId: string, machineCode: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;

    const result = await pool.query(
      `SELECT 1 FROM favorites f
       JOIN machines m ON m.id = f.machine_id
       WHERE f.user_id = $1 AND m.code = $2`,
      [userId, machineCode]
    );
    return result.rows.length > 0;
  },
};
