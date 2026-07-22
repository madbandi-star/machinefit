import type { Locale } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { pickLocalized } from '../utils/localize.util.js';

export interface HistoryItem {
  id: string;
  gymId: string;
  memberId: string;
  machineId: string;
  machineCode: string;
  machineName: string;
  brandName?: string;
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
    recommendedRepsMin?: number;
    recommendedRepsMax?: number;
  };
  viewedAt: string;
}

export const historyRepository = {
  async listByUser(
    userId: string,
    options: {
      gymId: string;
      gymIds?: string[] | null;
      memberId?: string;
      limit?: number;
      machineCode?: string;
      from?: string;
      to?: string;
    } = { gymId: '' },
    locale: Locale = 'en'
  ): Promise<HistoryItem[]> {
    const pool = getPool();
    if (!pool) return [];

    const limit = options.limit ?? 20;
    const params: unknown[] = [userId];
    let gymFilter: string;

    if (options.gymIds !== undefined) {
      if (options.gymIds === null || options.gymIds.length === 0) return [];
      params.push(options.gymIds);
      gymFilter = ` AND h.gym_id = ANY($${params.length}::uuid[])`;
    } else {
      params.push(options.gymId);
      gymFilter = ` AND h.gym_id = $${params.length}`;
    }

    let filters = gymFilter;

    if (options.memberId) {
      params.push(options.memberId);
      filters += ` AND h.member_id = $${params.length}`;
    }

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
      gym_id: string;
      member_id: string;
      machine_id: string;
      machine_code: string;
      muscle_group: string;
      machine_name: Record<string, string>;
      brand_name: Record<string, string> | null;
      recommendation_id: string;
      seat_position: number | null;
      back_pad_position: number | null;
      foot_position: number | null;
      handle_position: number | null;
      rom_setting: string | null;
      recommended_weight_kg: string | null;
      recommended_reps_min: number | null;
      recommended_reps_max: number | null;
      target_muscle_group: string | null;
      viewed_at: string;
    }>(
      `SELECT h.id, h.gym_id, h.member_id, h.machine_id, h.recommendation_id, h.viewed_at,
              m.code AS machine_code, m.muscle_group, m.name AS machine_name,
              b.name AS brand_name,
              r.seat_position, r.back_pad_position, r.foot_position,
              r.handle_position, r.rom_setting, r.recommended_weight_kg,
              r.recommended_reps_min, r.recommended_reps_max,
              r.target_muscle_group
       FROM recent_history h
       JOIN machines m ON m.id = h.machine_id
       LEFT JOIN brands b ON b.id = m.brand_id
       JOIN machine_recommendations r ON r.id = h.recommendation_id
       WHERE h.user_id = $1${filters}
       ORDER BY h.viewed_at DESC
       LIMIT $${params.length}`,
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
        recommendedRepsMin: row.recommended_reps_min ?? undefined,
        recommendedRepsMax: row.recommended_reps_max ?? undefined,
      },
      viewedAt: row.viewed_at,
    }));
  },

  async record(
    userId: string,
    gymId: string,
    memberId: string,
    machineId: string,
    recommendationId: string
  ): Promise<void> {
    const pool = getPool();
    if (!pool) return;

    await pool.query(
      `INSERT INTO recent_history (user_id, gym_id, member_id, machine_id, recommendation_id, viewed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, gym_id, member_id, recommendation_id)
       DO UPDATE SET viewed_at = NOW()`,
      [userId, gymId, memberId, machineId, recommendationId]
    );
  },

  async clear(userId: string, gymId: string, memberId: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      'DELETE FROM recent_history WHERE user_id = $1 AND gym_id = $2 AND member_id = $3',
      [userId, gymId, memberId]
    );
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
