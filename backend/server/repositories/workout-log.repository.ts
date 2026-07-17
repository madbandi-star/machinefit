import { getPool } from '../config/database.js';
import type { WorkoutLog } from '@machinefit/shared';

interface WorkoutLogRow {
  id: string;
  machine_code: string;
  machine_name: Record<string, string>;
  recommendation_id: string | null;
  log_date: string;
  set_count: number;
  set_weights_kg: number[];
  diary: string | null;
  created_at: string;
  updated_at: string;
}

function formatLogDate(value: string | Date): string {
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function mapRow(row: WorkoutLogRow): WorkoutLog {
  const logDate = formatLogDate(row.log_date);

  return {
    id: row.id,
    machineCode: row.machine_code,
    machineName: row.machine_name.en ?? row.machine_code,
    recommendationId: row.recommendation_id ?? undefined,
    logDate,
    setCount: row.set_count,
    setWeightsKg: row.set_weights_kg,
    diary: row.diary ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_FIELDS = `wl.id, wl.recommendation_id, wl.log_date, wl.set_count, wl.set_weights_kg,
              wl.diary, wl.created_at, wl.updated_at,
              m.code AS machine_code, m.name AS machine_name`;

export const workoutLogRepository = {
  async findByUserMachineDate(
    userId: string,
    machineId: string,
    logDate: string
  ): Promise<WorkoutLog | null> {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query<WorkoutLogRow>(
      `SELECT ${SELECT_FIELDS}
       FROM workout_logs wl
       JOIN machines m ON m.id = wl.machine_id
       WHERE wl.user_id = $1 AND wl.machine_id = $2 AND wl.log_date = $3::date`,
      [userId, machineId, logDate]
    );

    const row = result.rows[0];
    return row ? mapRow(row) : null;
  },

  async listByUser(
    userId: string,
    options: {
      machineId?: string;
      logDate?: string;
      from?: string;
      to?: string;
    }
  ): Promise<WorkoutLog[]> {
    const pool = getPool();
    if (!pool) return [];

    const params: unknown[] = [userId];
    let filters = '';

    if (options.machineId) {
      params.push(options.machineId);
      filters += ` AND wl.machine_id = $${params.length}`;
    }

    if (options.logDate) {
      params.push(options.logDate);
      filters += ` AND wl.log_date = $${params.length}::date`;
    }

    if (options.from) {
      params.push(options.from);
      filters += ` AND wl.log_date >= $${params.length}::date`;
    }

    if (options.to) {
      params.push(options.to);
      filters += ` AND wl.log_date <= $${params.length}::date`;
    }

    const result = await pool.query<WorkoutLogRow>(
      `SELECT ${SELECT_FIELDS}
       FROM workout_logs wl
       JOIN machines m ON m.id = wl.machine_id
       WHERE wl.user_id = $1${filters}
       ORDER BY wl.log_date ASC, wl.created_at ASC`,
      params
    );

    return result.rows.map(mapRow);
  },

  async upsert(
    userId: string,
    machineId: string,
    data: {
      recommendationId?: string;
      logDate: string;
      setCount: number;
      setWeightsKg: number[];
      diary?: string;
    }
  ): Promise<WorkoutLog> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');

    const result = await pool.query<WorkoutLogRow>(
      `INSERT INTO workout_logs (
         user_id, machine_id, recommendation_id, log_date, set_count, set_weights_kg, diary
       )
       VALUES ($1, $2, $3, $4::date, $5, $6::jsonb, $7)
       ON CONFLICT (user_id, machine_id, log_date)
       DO UPDATE SET
         set_count = EXCLUDED.set_count,
         set_weights_kg = EXCLUDED.set_weights_kg,
         diary = EXCLUDED.diary,
         recommendation_id = COALESCE(EXCLUDED.recommendation_id, workout_logs.recommendation_id),
         updated_at = NOW()
       RETURNING id, recommendation_id, log_date, set_count, set_weights_kg, diary,
                 created_at, updated_at,
                 (SELECT code FROM machines WHERE id = $2) AS machine_code,
                 (SELECT name FROM machines WHERE id = $2) AS machine_name`,
      [
        userId,
        machineId,
        data.recommendationId ?? null,
        data.logDate,
        data.setCount,
        JSON.stringify(data.setWeightsKg),
        data.diary ?? null,
      ]
    );

    const row = result.rows[0];
    if (!row) throw new Error('Failed to upsert workout log');
    return mapRow(row);
  },
};
