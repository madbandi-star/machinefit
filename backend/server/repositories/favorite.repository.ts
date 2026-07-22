import type { Locale } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { pickLocalized } from '../utils/localize.util.js';

export interface FavoriteItem {
  id: string;
  gymId: string;
  memberId: string;
  machineId: string;
  machineCode: string;
  machineName: string;
  brandName?: string;
  muscleGroup: string;
  recommendationId?: string;
  createdAt: string;
}

export const favoriteRepository = {
  async listByUser(
    userId: string,
    gymId: string,
    locale: Locale = 'en',
    options: { gymIds?: string[] | null; memberId?: string } = {}
  ): Promise<FavoriteItem[]> {
    const pool = getPool();
    if (!pool) return [];

    const params: unknown[] = [userId];
    let gymFilter: string;

    if (options.gymIds !== undefined) {
      if (options.gymIds === null || options.gymIds.length === 0) return [];
      params.push(options.gymIds);
      gymFilter = ` AND f.gym_id = ANY($${params.length}::uuid[])`;
    } else {
      params.push(gymId);
      gymFilter = ` AND f.gym_id = $${params.length}`;
    }

    let memberFilter = '';
    if (options.memberId) {
      params.push(options.memberId);
      memberFilter = ` AND f.member_id = $${params.length}`;
    }

    const result = await pool.query<{
      id: string;
      gym_id: string;
      member_id: string;
      machine_id: string;
      machine_code: string;
      muscle_group: string;
      machine_name: Record<string, string>;
      brand_name: Record<string, string> | null;
      recommendation_id: string | null;
      created_at: string;
    }>(
      `SELECT f.id, f.gym_id, f.member_id, f.machine_id, f.recommendation_id, f.created_at,
              m.code AS machine_code, m.muscle_group, m.name AS machine_name,
              b.name AS brand_name
       FROM favorites f
       JOIN machines m ON m.id = f.machine_id
       LEFT JOIN brands b ON b.id = m.brand_id
       WHERE f.user_id = $1${gymFilter}${memberFilter}
       ORDER BY f.created_at DESC`,
      params
    );

    return result.rows.map((row) => ({
      id: row.id,
      gymId: row.gym_id,
      memberId: row.member_id,
      machineId: row.machine_id,
      machineCode: row.machine_code,
      machineName: pickLocalized(row.machine_name, locale) ?? row.machine_code,
      brandName: row.brand_name
        ? pickLocalized(row.brand_name, locale) ?? undefined
        : undefined,
      muscleGroup: row.muscle_group,
      recommendationId: row.recommendation_id ?? undefined,
      createdAt: row.created_at,
    }));
  },

  async add(
    userId: string,
    gymId: string,
    memberId: string,
    machineId: string,
    recommendationId?: string,
    locale: Locale = 'en'
  ): Promise<FavoriteItem> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');

    const result = await pool.query<{ id: string }>(
      `INSERT INTO favorites (user_id, gym_id, member_id, machine_id, recommendation_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, gym_id, member_id, machine_id) DO UPDATE SET recommendation_id = EXCLUDED.recommendation_id
       RETURNING id`,
      [userId, gymId, memberId, machineId, recommendationId ?? null]
    );

    const favoriteId = result.rows[0]?.id;
    if (!favoriteId) throw new Error('Failed to add favorite');

    const itemResult = await pool.query<{
      id: string;
      gym_id: string;
      member_id: string;
      machine_id: string;
      machine_code: string;
      muscle_group: string;
      machine_name: Record<string, string>;
      brand_name: Record<string, string> | null;
      recommendation_id: string | null;
      created_at: string;
    }>(
      `SELECT f.id, f.gym_id, f.member_id, f.machine_id, f.recommendation_id, f.created_at,
              m.code AS machine_code, m.muscle_group, m.name AS machine_name,
              b.name AS brand_name
       FROM favorites f
       JOIN machines m ON m.id = f.machine_id
       LEFT JOIN brands b ON b.id = m.brand_id
       WHERE f.id = $1 AND f.user_id = $2`,
      [favoriteId, userId]
    );

    const row = itemResult.rows[0];
    if (!row) throw new Error('Failed to add favorite');
    return {
      id: row.id,
      gymId: row.gym_id,
      memberId: row.member_id,
      machineId: row.machine_id,
      machineCode: row.machine_code,
      machineName: pickLocalized(row.machine_name, locale) ?? row.machine_code,
      brandName: row.brand_name
        ? pickLocalized(row.brand_name, locale) ?? undefined
        : undefined,
      muscleGroup: row.muscle_group,
      recommendationId: row.recommendation_id ?? undefined,
      createdAt: row.created_at,
    };
  },

  async remove(userId: string, favoriteId: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query('DELETE FROM favorites WHERE id = $1 AND user_id = $2', [
      favoriteId,
      userId,
    ]);
  },

  async isFavorited(userId: string, gymId: string, machineCode: string, memberId?: string): Promise<boolean> {
    const id = await this.findIdByUserAndMachineCode(userId, gymId, machineCode, memberId);
    return id != null;
  },

  async findIdByUserAndMachineCode(
    userId: string,
    gymId: string,
    machineCode: string,
    memberId?: string
  ): Promise<string | null> {
    const pool = getPool();
    if (!pool) return null;

    const params: unknown[] = [userId, gymId, machineCode];
    let memberFilter = '';
    if (memberId) {
      params.push(memberId);
      memberFilter = ` AND f.member_id = $${params.length}`;
    }

    const result = await pool.query<{ id: string }>(
      `SELECT f.id
       FROM favorites f
       JOIN machines m ON m.id = f.machine_id
       WHERE f.user_id = $1 AND f.gym_id = $2 AND m.code = $3${memberFilter}`,
      params
    );
    return result.rows[0]?.id ?? null;
  },
};
