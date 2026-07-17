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

  async deleteByUserMachineDate(
    userId: string,
    machineId: string,
    logDate: string
  ): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;

    const result = await pool.query(
      `DELETE FROM workout_logs
       WHERE user_id = $1 AND machine_id = $2 AND log_date = $3::date`,
      [userId, machineId, logDate]
    );

    return (result.rowCount ?? 0) > 0;
  },

  async getReferenceWeightKg(
    machineId: string,
    gender: string,
    experienceLevel: string,
    heightCm: number
  ): Promise<number | null> {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query<{ weight_kg: string | null }>(
      `SELECT weight_kg
       FROM machine_settings
       WHERE machine_id = $1
         AND gender = $2
         AND experience_level = $3
         AND height_min_cm <= $4
         AND height_max_cm >= $4
       ORDER BY height_min_cm DESC
       LIMIT 1`,
      [machineId, gender, experienceLevel, heightCm]
    );

    const value = result.rows[0]?.weight_kg;
    return value ? parseFloat(value) : null;
  },

  async getCohortStats(options: {
    machineId: string;
    from: string;
    to: string;
    gender?: string;
    heightMinCm?: number;
    heightMaxCm?: number;
    weightMinKg?: number;
    weightMaxKg?: number;
    experienceLevel?: string;
    excludeUserId?: string;
  }): Promise<{
    sampleSize: number;
    avgMaxWeightKg: number;
    avgSessionVolumeKg: number;
    avgVolumeGrowthPct: number;
    avgWorkoutCount: number;
  }> {
    const pool = getPool();
    if (!pool) {
      return {
        sampleSize: 0,
        avgMaxWeightKg: 0,
        avgSessionVolumeKg: 0,
        avgVolumeGrowthPct: 0,
        avgWorkoutCount: 0,
      };
    }

    const params: unknown[] = [
      options.machineId,
      options.from,
      options.to,
    ];
    let userFilters = 'AND u.is_active = true';

    if (options.gender) {
      params.push(options.gender);
      userFilters += ` AND u.gender = $${params.length}`;
    }

    if (options.heightMinCm != null && options.heightMaxCm != null) {
      params.push(options.heightMinCm, options.heightMaxCm);
      userFilters += ` AND u.height_cm BETWEEN $${params.length - 1} AND $${params.length}`;
    }

    if (options.weightMaxKg != null) {
      if (options.weightMinKg === 0) {
        params.push(options.weightMaxKg);
        userFilters += ` AND u.weight_kg <= $${params.length}`;
      } else if (options.weightMinKg != null) {
        params.push(options.weightMinKg, options.weightMaxKg);
        userFilters += ` AND u.weight_kg > $${params.length - 1} AND u.weight_kg <= $${params.length}`;
      }
    }

    if (options.experienceLevel) {
      params.push(options.experienceLevel);
      userFilters += ` AND u.experience_level = $${params.length}`;
    }

    if (options.excludeUserId) {
      params.push(options.excludeUserId);
      userFilters += ` AND wl.user_id <> $${params.length}`;
    }

    const result = await pool.query<{
      sample_size: string;
      avg_pr: string | null;
      avg_session_volume: string | null;
      avg_volume_growth_pct: string | null;
      avg_workout_count: string | null;
    }>(
      `WITH sessions AS (
         SELECT
           wl.user_id,
           wl.log_date,
           (
             SELECT COALESCE(SUM((elem)::numeric), 0)
             FROM jsonb_array_elements_text(wl.set_weights_kg) AS elem
           ) AS session_volume,
           (
             SELECT COALESCE(MAX((elem)::numeric), 0)
             FROM jsonb_array_elements_text(wl.set_weights_kg) AS elem
           ) AS max_weight
         FROM workout_logs wl
         INNER JOIN users u ON u.id = wl.user_id
         WHERE wl.machine_id = $1
           AND wl.log_date >= $2::date
           AND wl.log_date <= $3::date
           ${userFilters}
       ),
       ranked AS (
         SELECT
           user_id,
           session_volume,
           max_weight,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY log_date ASC) AS rn_asc,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY log_date DESC) AS rn_desc
         FROM sessions
       ),
       user_agg AS (
         SELECT
           user_id,
           COUNT(*) AS workout_count,
           MAX(max_weight) AS pr,
           AVG(session_volume) AS avg_session_volume,
           MAX(CASE WHEN rn_asc = 1 THEN session_volume END) AS first_volume,
           MAX(CASE WHEN rn_desc = 1 THEN session_volume END) AS last_volume
         FROM ranked
         GROUP BY user_id
       )
       SELECT
         COUNT(*)::text AS sample_size,
         AVG(pr)::text AS avg_pr,
         AVG(avg_session_volume)::text AS avg_session_volume,
         AVG(
           CASE
             WHEN workout_count >= 2 AND first_volume > 0
               THEN ((last_volume - first_volume) / first_volume) * 100
             ELSE NULL
           END
         )::text AS avg_volume_growth_pct,
         AVG(workout_count)::text AS avg_workout_count
       FROM user_agg`,
      params
    );

    const row = result.rows[0];
    return {
      sampleSize: row ? parseInt(row.sample_size, 10) : 0,
      avgMaxWeightKg: row?.avg_pr ? parseFloat(row.avg_pr) : 0,
      avgSessionVolumeKg: row?.avg_session_volume ? parseFloat(row.avg_session_volume) : 0,
      avgVolumeGrowthPct: row?.avg_volume_growth_pct ? parseFloat(row.avg_volume_growth_pct) : 0,
      avgWorkoutCount: row?.avg_workout_count ? parseFloat(row.avg_workout_count) : 0,
    };
  },
};
