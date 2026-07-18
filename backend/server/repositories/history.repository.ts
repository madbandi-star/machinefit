import { getPool } from '../config/database.js';

export interface HistoryItem {
  id: string;
  machineId: string;
  machineCode: string;
  machineName: string;
  muscleGroup: string;
  targetMuscleGroup?: string;
  recommendationId: string;
  settings: {
    seatPosition?: number;
    backPadPosition?: number;
    footPosition?: number;
    handlePosition?: number;
    romSetting?: string;
    recommendedWeightKg?: number;
  };
  viewedAt: string;
}

export const historyRepository = {
  async listByUser(
    userId: string,
    options: { limit?: number; machineCode?: string; from?: string; to?: string } = {}
  ): Promise<HistoryItem[]> {
    const pool = getPool();
    if (!pool) return [];

    const limit = options.limit ?? 20;
    const params: unknown[] = [userId];
    let filters = '';

    if (options.machineCode) {
      params.push(options.machineCode);
      filters += ` AND m.code = $${params.length}`;
    }

    if (options.from) {
      params.push(options.from);
      filters += ` AND h.viewed_at >= $${params.length}::timestamptz`;
    }

    if (options.to) {
      params.push(options.to);
      filters += ` AND h.viewed_at < $${params.length}::timestamptz`;
    }

    params.push(limit);

    const result = await pool.query<{
      id: string;
      machine_id: string;
      machine_code: string;
      muscle_group: string;
      machine_name: Record<string, string>;
      recommendation_id: string;
      seat_position: number | null;
      back_pad_position: number | null;
      foot_position: number | null;
      handle_position: number | null;
      rom_setting: string | null;
      recommended_weight_kg: string | null;
      target_muscle_group: string | null;
      viewed_at: string;
    }>(
      `SELECT h.id, h.machine_id, h.recommendation_id, h.viewed_at,
              m.code AS machine_code, m.muscle_group, m.name AS machine_name,
              r.seat_position, r.back_pad_position, r.foot_position,
              r.handle_position, r.rom_setting, r.recommended_weight_kg,
              r.target_muscle_group
       FROM recent_history h
       JOIN machines m ON m.id = h.machine_id
       JOIN machine_recommendations r ON r.id = h.recommendation_id
       WHERE h.user_id = $1${filters}
       ORDER BY h.viewed_at DESC
       LIMIT $${params.length}`,
      params
    );

    return result.rows.map((row) => ({
      id: row.id,
      machineId: row.machine_id,
      machineCode: row.machine_code,
      machineName: row.machine_name.en ?? row.machine_code,
      muscleGroup: row.muscle_group,
      targetMuscleGroup: row.target_muscle_group ?? undefined,
      recommendationId: row.recommendation_id,
      settings: {
        seatPosition: row.seat_position ?? undefined,
        backPadPosition: row.back_pad_position ?? undefined,
        footPosition: row.foot_position ?? undefined,
        handlePosition: row.handle_position ?? undefined,
        romSetting: row.rom_setting ?? undefined,
        recommendedWeightKg: row.recommended_weight_kg
          ? parseFloat(row.recommended_weight_kg)
          : undefined,
      },
      viewedAt: row.viewed_at,
    }));
  },

  async record(
    userId: string,
    machineId: string,
    recommendationId: string
  ): Promise<void> {
    const pool = getPool();
    if (!pool) return;

    await pool.query(
      `INSERT INTO recent_history (user_id, machine_id, recommendation_id, viewed_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, recommendation_id)
       DO UPDATE SET viewed_at = NOW()`,
      [userId, machineId, recommendationId]
    );
  },

  async clear(userId: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query('DELETE FROM recent_history WHERE user_id = $1', [userId]);
  },

  async remove(userId: string, historyId: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query('DELETE FROM recent_history WHERE id = $1 AND user_id = $2', [
      historyId,
      userId,
    ]);
  },
};
