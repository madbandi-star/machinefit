import type { Locale, TargetMuscleGroup, WorkoutLog } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { pickLocalized } from '../utils/localize.util.js';

const COHORT_STATS_TTL_MS = 5 * 60_000;
const cohortStatsCache = new Map<
  string,
  {
    expiresAt: number;
    value: {
      sampleSize: number;
      avgMaxWeightKg: number;
      avgSessionVolumeKg: number;
      avgVolumeGrowthPct: number;
      avgWorkoutCount: number;
    };
  }
>();

interface WorkoutLogRow {
  id: string;
  gym_id: string;
  member_id: string;
  machine_code: string;
  machine_name: Record<string, string>;
  brand_name: Record<string, string> | null;
  recommendation_id: string | null;
  log_date: string;
  target_muscle_group: string;
  set_count: number;
  set_weights_kg: number[];
  set_completed: boolean[] | null;
  diary: string | null;
  created_at: string;
  updated_at: string;
}

function formatLogDate(value: string | Date): string {
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    return value.slice(0, 10);
  }

  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, '0');
  const d = String(value.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function mapRow(row: WorkoutLogRow, locale: Locale = 'en'): WorkoutLog {
  const logDate = formatLogDate(row.log_date);

  return {
    id: row.id,
    gymId: row.gym_id,
    memberId: row.member_id,
    machineCode: row.machine_code,
    machineName: pickLocalized(row.machine_name, locale) ?? row.machine_code,
    brandName: row.brand_name
      ? pickLocalized(row.brand_name, locale) ?? undefined
      : undefined,
    recommendationId: row.recommendation_id ?? undefined,
    logDate,
    targetMuscleGroup: row.target_muscle_group
      ? (row.target_muscle_group as TargetMuscleGroup)
      : undefined,
    setCount: row.set_count,
    setWeightsKg: row.set_weights_kg,
    setCompleted:
      row.set_completed && row.set_completed.length > 0
        ? row.set_completed
        : row.set_weights_kg.map(() => false),
    diary: row.diary ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_FIELDS = `wl.id, wl.gym_id, wl.member_id, wl.recommendation_id, wl.log_date, wl.target_muscle_group, wl.set_count, wl.set_weights_kg,
              wl.set_completed, wl.diary, wl.created_at, wl.updated_at,
              m.code AS machine_code, m.name AS machine_name, b.name AS brand_name`;

const MACHINE_JOINS = `JOIN machines m ON m.id = wl.machine_id
       LEFT JOIN brands b ON b.id = m.brand_id`;

export const workoutLogRepository = {
  async findByUserMachineDate(
    userId: string,
    gymId: string,
    machineId: string,
    logDate: string,
    targetMuscleGroup = '',
    memberId?: string
  ): Promise<WorkoutLog | null> {
    const pool = getPool();
    if (!pool) return null;

    const params: unknown[] = [userId, gymId, machineId, logDate, targetMuscleGroup];
    let memberFilter = '';
    if (memberId) {
      params.push(memberId);
      memberFilter = ` AND wl.member_id = $${params.length}`;
    }

    const result = await pool.query<WorkoutLogRow>(
      `SELECT ${SELECT_FIELDS}
       FROM workout_logs wl
       ${MACHINE_JOINS}
       WHERE wl.user_id = $1 AND wl.gym_id = $2 AND wl.machine_id = $3 AND wl.log_date = $4::date
         AND wl.target_muscle_group = $5${memberFilter}`,
      params
    );

    const row = result.rows[0];
    return row ? mapRow(row) : null;
  },

  async listByUser(
    userId: string,
    options: {
      gymId: string;
      gymIds?: string[] | null;
      memberId?: string;
      machineId?: string;
      logDate?: string;
      from?: string;
      to?: string;
      limit?: number;
      targetMuscleGroup?: string;
    },
    locale: Locale = 'en'
  ): Promise<WorkoutLog[]> {
    const pool = getPool();
    if (!pool) return [];

    const params: unknown[] = [userId];
    let gymFilter: string;

    // Support 'all' via pre-resolved gymIds array
    if (options.gymIds !== undefined) {
      if (options.gymIds === null || options.gymIds.length === 0) {
        // No gyms owned — return empty
        return [];
      }
      params.push(options.gymIds);
      gymFilter = ` AND wl.gym_id = ANY($${params.length}::uuid[])`;
    } else {
      params.push(options.gymId);
      gymFilter = ` AND wl.gym_id = $${params.length}`;
    }

    let filters = gymFilter;

    if (options.memberId) {
      params.push(options.memberId);
      filters += ` AND wl.member_id = $${params.length}`;
    }

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

    if (options.targetMuscleGroup !== undefined) {
      params.push(options.targetMuscleGroup);
      filters += ` AND wl.target_muscle_group = $${params.length}`;
    }

    let query = `SELECT ${SELECT_FIELDS}
       FROM workout_logs wl
       ${MACHINE_JOINS}
       WHERE wl.user_id = $1${filters}`;

    if (options.limit !== undefined) {
      params.push(options.limit);
      query += ` ORDER BY wl.log_date DESC, wl.created_at DESC LIMIT $${params.length}`;
    } else {
      query += ' ORDER BY wl.log_date ASC, wl.created_at ASC';
    }

    const result = await pool.query<WorkoutLogRow>(query, params);
    const rows = options.limit !== undefined ? [...result.rows].reverse() : result.rows;
    return rows.map((row) => mapRow(row, locale));
  },

  async upsert(
    userId: string,
    gymId: string,
    memberId: string,
    machineId: string,
    data: {
      recommendationId?: string;
      logDate: string;
      targetMuscleGroup?: string;
      setCount: number;
      setWeightsKg: number[];
      setCompleted?: boolean[];
      diary?: string;
    }
  ): Promise<WorkoutLog> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');

    const setCompleted =
      data.setCompleted && data.setCompleted.length === data.setCount
        ? data.setCompleted
        : Array.from({ length: data.setCount }, () => false);

    const result = await pool.query<WorkoutLogRow>(
      `INSERT INTO workout_logs (
         user_id, gym_id, member_id, machine_id, recommendation_id, log_date, target_muscle_group,
         set_count, set_weights_kg, set_completed, diary
       )
       VALUES ($1, $2, $3, $4, $5, $6::date, $7, $8, $9::jsonb, $10::jsonb, $11)
       ON CONFLICT (user_id, gym_id, member_id, machine_id, log_date, target_muscle_group)
       DO UPDATE SET
         set_count = EXCLUDED.set_count,
         set_weights_kg = EXCLUDED.set_weights_kg,
         set_completed = EXCLUDED.set_completed,
         diary = EXCLUDED.diary,
         recommendation_id = COALESCE(EXCLUDED.recommendation_id, workout_logs.recommendation_id),
         updated_at = NOW()
       RETURNING id, gym_id, member_id, recommendation_id, log_date, target_muscle_group, set_count, set_weights_kg, set_completed, diary,
                 created_at, updated_at,
                 (SELECT code FROM machines WHERE id = $4) AS machine_code,
                 (SELECT name FROM machines WHERE id = $4) AS machine_name`,
      [
        userId,
        gymId,
        memberId,
        machineId,
        data.recommendationId ?? null,
        data.logDate,
        data.targetMuscleGroup ?? '',
        data.setCount,
        JSON.stringify(data.setWeightsKg),
        JSON.stringify(setCompleted),
        data.diary ?? null,
      ]
    );

    const row = result.rows[0];
    if (!row) throw new Error('Failed to upsert workout log');
    return mapRow(row);
  },

  async deleteByUserMachineDate(
    userId: string,
    gymId: string,
    memberId: string,
    machineId: string,
    logDate: string,
    targetMuscleGroup = ''
  ): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;

    const result = await pool.query(
      `DELETE FROM workout_logs
       WHERE user_id = $1 AND gym_id = $2 AND member_id = $3 AND machine_id = $4 AND log_date = $5::date
         AND target_muscle_group = $6`,
      [userId, gymId, memberId, machineId, logDate, targetMuscleGroup]
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
    /** Free-weight: scope cohort to the same target muscle. */
    targetMuscleGroup?: string;
  }): Promise<{
    sampleSize: number;
    avgMaxWeightKg: number;
    avgSessionVolumeKg: number;
    avgVolumeGrowthPct: number;
    avgWorkoutCount: number;
  }> {
    const cacheKey = JSON.stringify(options);
    const cached = cohortStatsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

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

    if (options.targetMuscleGroup !== undefined) {
      params.push(options.targetMuscleGroup);
      userFilters += ` AND wl.target_muscle_group = $${params.length}`;
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
    const value = {
      sampleSize: row ? parseInt(row.sample_size, 10) : 0,
      avgMaxWeightKg: row?.avg_pr ? parseFloat(row.avg_pr) : 0,
      avgSessionVolumeKg: row?.avg_session_volume ? parseFloat(row.avg_session_volume) : 0,
      avgVolumeGrowthPct: row?.avg_volume_growth_pct ? parseFloat(row.avg_volume_growth_pct) : 0,
      avgWorkoutCount: row?.avg_workout_count ? parseFloat(row.avg_workout_count) : 0,
    };
    cohortStatsCache.set(cacheKey, { expiresAt: Date.now() + COHORT_STATS_TTL_MS, value });
    if (cohortStatsCache.size > 200) {
      const oldest = cohortStatsCache.keys().next().value;
      if (oldest) cohortStatsCache.delete(oldest);
    }
    return value;
  },


  /**
   * Recommend-weight path only needs sampleSize + avgMaxWeightKg.
   * Skip growth/volume window aggregations used by insights.
   */
  async getCohortAvgMaxStats(options: {
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
    targetMuscleGroup?: string;
  }): Promise<{
    sampleSize: number;
    avgMaxWeightKg: number;
    avgSessionVolumeKg: number;
    avgVolumeGrowthPct: number;
    avgWorkoutCount: number;
  }> {
    const cacheKey = `avgMax:${JSON.stringify(options)}`;
    const cached = cohortStatsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

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

    const params: unknown[] = [options.machineId, options.from, options.to];
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
    if (options.targetMuscleGroup !== undefined) {
      params.push(options.targetMuscleGroup);
      userFilters += ` AND wl.target_muscle_group = $${params.length}`;
    }

    const result = await pool.query<{ sample_size: string; avg_pr: string | null }>(
      `WITH user_pr AS (
         SELECT
           wl.user_id,
           MAX((
             SELECT COALESCE(MAX((elem)::numeric), 0)
             FROM jsonb_array_elements_text(wl.set_weights_kg) AS elem
           )) AS pr
         FROM workout_logs wl
         INNER JOIN users u ON u.id = wl.user_id
         WHERE wl.machine_id = $1
           AND wl.log_date >= $2::date
           AND wl.log_date <= $3::date
           ${userFilters}
         GROUP BY wl.user_id
       )
       SELECT COUNT(*)::text AS sample_size, AVG(pr)::text AS avg_pr
       FROM user_pr`,
      params
    );

    const row = result.rows[0];
    const value = {
      sampleSize: row ? parseInt(row.sample_size, 10) : 0,
      avgMaxWeightKg: row?.avg_pr ? parseFloat(row.avg_pr) : 0,
      avgSessionVolumeKg: 0,
      avgVolumeGrowthPct: 0,
      avgWorkoutCount: 0,
    };
    cohortStatsCache.set(cacheKey, { expiresAt: Date.now() + COHORT_STATS_TTL_MS, value });
    if (cohortStatsCache.size > 200) {
      const oldest = cohortStatsCache.keys().next().value;
      if (oldest) cohortStatsCache.delete(oldest);
    }
    return value;
  },

  async getDailyCohortStats(options: {
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

    const params: unknown[] = [options.from, options.to];
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
      `WITH machine_sessions AS (
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
         WHERE wl.log_date >= $1::date
           AND wl.log_date <= $2::date
           ${userFilters}
       ),
       daily AS (
         SELECT
           user_id,
           log_date,
           SUM(session_volume) AS daily_volume,
           MAX(max_weight) AS daily_peak_weight
         FROM machine_sessions
         GROUP BY user_id, log_date
       ),
       ranked AS (
         SELECT
           user_id,
           daily_volume,
           daily_peak_weight,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY log_date ASC) AS rn_asc,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY log_date DESC) AS rn_desc
         FROM daily
       ),
       user_agg AS (
         SELECT
           user_id,
           COUNT(*) AS workout_count,
           MAX(daily_peak_weight) AS pr,
           AVG(daily_volume) AS avg_session_volume,
           MAX(CASE WHEN rn_asc = 1 THEN daily_volume END) AS first_volume,
           MAX(CASE WHEN rn_desc = 1 THEN daily_volume END) AS last_volume
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
