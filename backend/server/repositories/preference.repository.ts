import type { RecommendationSettings } from '@machinefit/shared';
import { getPool } from '../config/database.js';

export const preferenceRepository = {
  async upsert(
    userId: string,
    machineId: string,
    customSettings: Partial<RecommendationSettings>
  ): Promise<Partial<RecommendationSettings>> {
    const pool = getPool();
    if (!pool) return customSettings;

    const result = await pool.query<{ custom_settings: Partial<RecommendationSettings> }>(
      `INSERT INTO user_machine_preferences (user_id, machine_id, custom_settings)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (user_id, machine_id)
       DO UPDATE SET custom_settings = EXCLUDED.custom_settings, updated_at = NOW()
       RETURNING custom_settings`,
      [userId, machineId, JSON.stringify(customSettings)]
    );

    return result.rows[0]?.custom_settings ?? customSettings;
  },

  async findByUserMachine(
    userId: string,
    machineId: string
  ): Promise<Partial<RecommendationSettings> | null> {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query<{ custom_settings: Partial<RecommendationSettings> }>(
      `SELECT custom_settings FROM user_machine_preferences
       WHERE user_id = $1 AND machine_id = $2`,
      [userId, machineId]
    );

    return result.rows[0]?.custom_settings ?? null;
  },
};
