import type { Locale } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { pickLocalized } from '../utils/localize.util.js';

export interface FavoriteItem {
  id: string;
  machineId: string;
  machineCode: string;
  machineName: string;
  muscleGroup: string;
  recommendationId?: string;
  createdAt: string;
}

export const favoriteRepository = {
  async listByUser(userId: string, locale: Locale = 'en'): Promise<FavoriteItem[]> {
    const pool = getPool();
    if (!pool) return [];

    const result = await pool.query<{
      id: string;
      machine_id: string;
      machine_code: string;
      muscle_group: string;
      machine_name: Record<string, string>;
      recommendation_id: string | null;
      created_at: string;
    }>(
      `SELECT f.id, f.machine_id, f.recommendation_id, f.created_at,
              m.code AS machine_code, m.muscle_group, m.name AS machine_name
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
      machineName: pickLocalized(row.machine_name, locale) ?? row.machine_code,
      muscleGroup: row.muscle_group,
      recommendationId: row.recommendation_id ?? undefined,
      createdAt: row.created_at,
    }));
  },

  async add(
    userId: string,
    machineId: string,
    recommendationId?: string,
    locale: Locale = 'en'
  ): Promise<FavoriteItem> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');

    const result = await pool.query<{ id: string }>(
      `INSERT INTO favorites (user_id, machine_id, recommendation_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, machine_id) DO UPDATE SET recommendation_id = EXCLUDED.recommendation_id
       RETURNING id`,
      [userId, machineId, recommendationId ?? null]
    );

    const items = await this.listByUser(userId, locale);
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
    const id = await this.findIdByUserAndMachineCode(userId, machineCode);
    return id != null;
  },

  async findIdByUserAndMachineCode(
    userId: string,
    machineCode: string
  ): Promise<string | null> {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query<{ id: string }>(
      `SELECT f.id
       FROM favorites f
       JOIN machines m ON m.id = f.machine_id
       WHERE f.user_id = $1 AND m.code = $2`,
      [userId, machineCode]
    );
    return result.rows[0]?.id ?? null;
  },
};
