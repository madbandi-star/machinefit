import type { LiveRankingPeriod } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { TtlCache } from '../utils/ttl-cache.js';

const ACTIVE_MINUTES = 30;

export interface LiveScopeFilter {
  countryCode?: string;
  metroCode?: string;
  districtCode?: string;
  gymId?: string;
  userId?: string;
}

function geoWhere(filter: LiveScopeFilter, alias = 'ug'): { sql: string; params: unknown[] } {
  const params: unknown[] = [];
  const parts: string[] = [];
  if (filter.countryCode) {
    params.push(filter.countryCode);
    parts.push(`${alias}.country_code = $${params.length}`);
  }
  if (filter.metroCode) {
    params.push(filter.metroCode);
    parts.push(`${alias}.metro_code = $${params.length}`);
  }
  if (filter.districtCode) {
    params.push(filter.districtCode);
    parts.push(`${alias}.district_code = $${params.length}`);
  }
  if (filter.gymId) {
    params.push(filter.gymId);
    parts.push(`${alias}.id = $${params.length}`);
  }
  return {
    sql: parts.length ? ` AND ${parts.join(' AND ')}` : '',
    params,
  };
}

/** Date filter on workout_logs.log_date (alias wl). Extends existing params. */
function periodWhere(
  period: LiveRankingPeriod | 'today',
  params: unknown[],
  alias = 'wl'
): string {
  if (period === 'all') return '';
  if (period === 'today') return ` AND ${alias}.log_date = CURRENT_DATE`;
  if (period === 'week') {
    return ` AND ${alias}.log_date >= (CURRENT_DATE - INTERVAL '6 days')`;
  }
  if (period === 'month') {
    return ` AND ${alias}.log_date >= date_trunc('month', CURRENT_DATE)::date`;
  }
  if (period === 'year') {
    return ` AND ${alias}.log_date >= date_trunc('year', CURRENT_DATE)::date`;
  }
  void params;
  return ` AND ${alias}.log_date = CURRENT_DATE`;
}

export const liveDashboardRepository = {
  async getTodayTotals(filter: LiveScopeFilter = {}): Promise<{
    activeNow: number;
    completedUsers: number;
    totalSets: number;
    totalVolumeKg: number;
    machineCount: number;
    gymCount: number;
    countryCount: number;
  }> {
    const pool = getPool();
    if (!pool) {
      return {
        activeNow: 0,
        completedUsers: 0,
        totalSets: 0,
        totalVolumeKg: 0,
        machineCount: 0,
        gymCount: 0,
        countryCount: 0,
      };
    }

    const clauses: string[] = [];
    const params: unknown[] = [];
    const add = (sql: string, value: unknown) => {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    };
    if (filter.countryCode) add('ug.country_code = ?', filter.countryCode);
    if (filter.metroCode) add('ug.metro_code = ?', filter.metroCode);
    if (filter.districtCode) add('ug.district_code = ?', filter.districtCode);
    if (filter.gymId) add('ug.id = ?', filter.gymId);
    if (filter.userId) add('wl.user_id = ?', filter.userId);
    const whereExtra = clauses.length ? ` AND ${clauses.join(' AND ')}` : '';

    params.push(ACTIVE_MINUTES);
    const activeParam = `$${params.length}`;

    const result = await pool.query<{
      active_now: string;
      completed_users: string;
      total_sets: string;
      total_volume: string;
      machine_count: string;
      gym_count: string;
      country_count: string;
    }>(
      `SELECT
         (SELECT COUNT(DISTINCT wl2.user_id)::text
          FROM workout_logs wl2
          JOIN user_gyms ug2 ON ug2.id = wl2.gym_id
          WHERE wl2.updated_at >= NOW() - (${activeParam} || ' minutes')::interval
            ${whereExtra.replace(/\bug\./g, 'ug2.').replace(/\bwl\./g, 'wl2.')}
         ) AS active_now,
         COUNT(DISTINCT wl.user_id)::text AS completed_users,
         COALESCE(SUM(wl.set_count), 0)::text AS total_sets,
         COALESCE(SUM((
           SELECT SUM(value::numeric) FROM jsonb_array_elements_text(wl.set_weights_kg) t(value)
         )), 0)::text AS total_volume,
         COUNT(DISTINCT wl.machine_id)::text AS machine_count,
         COUNT(DISTINCT wl.gym_id)::text AS gym_count,
         COUNT(DISTINCT ug.country_code)::text AS country_count
       FROM workout_logs wl
       JOIN user_gyms ug ON ug.id = wl.gym_id
       WHERE wl.log_date = CURRENT_DATE
         ${whereExtra}`,
      params
    );

    const row = result.rows[0];
    return {
      activeNow: parseInt(row?.active_now ?? '0', 10) || 0,
      completedUsers: parseInt(row?.completed_users ?? '0', 10) || 0,
      totalSets: parseInt(row?.total_sets ?? '0', 10) || 0,
      totalVolumeKg: parseFloat(row?.total_volume ?? '0') || 0,
      machineCount: parseInt(row?.machine_count ?? '0', 10) || 0,
      gymCount: parseInt(row?.gym_count ?? '0', 10) || 0,
      countryCount: parseInt(row?.country_count ?? '0', 10) || 0,
    };
  },

  async listChildren(
    groupBy: 'country' | 'metro' | 'district' | 'gym' | 'user',
    filter: LiveScopeFilter = {},
    locale = 'ko',
    period: LiveRankingPeriod | 'today' = 'today'
  ): Promise<
    {
      code: string;
      label: string;
      activeNow: number;
      volumeTodayKg: number;
      setsToday: number;
    }[]
  > {
    const pool = getPool();
    if (!pool) return [];
    const { sql, params } = geoWhere(filter);
    const dateSql = periodWhere(period, params);

    let groupExpr = 'ug.country_code';
    let labelExpr = `ug.country_code`;
    if (groupBy === 'metro') {
      groupExpr = 'ug.metro_code';
      labelExpr = 'ug.metro_code';
    } else if (groupBy === 'district') {
      groupExpr = 'ug.district_code';
      labelExpr = 'ug.district_code';
    } else if (groupBy === 'gym') {
      groupExpr = 'ug.id::text';
      labelExpr = 'ug.name';
    } else if (groupBy === 'user') {
      groupExpr = 'wl.user_id::text';
      labelExpr = `COALESCE(u.display_name, '회원')`;
    }

    const joinUser = groupBy === 'user' ? 'JOIN users u ON u.id = wl.user_id' : '';

    const result = await pool.query<{
      code: string;
      label: string;
      active_now: string;
      volume_kg: string;
      sets: string;
    }>(
      `SELECT
         ${groupExpr} AS code,
         ${labelExpr} AS label,
         COUNT(DISTINCT CASE WHEN wl.updated_at >= NOW() - interval '${ACTIVE_MINUTES} minutes' THEN wl.user_id END)::text AS active_now,
         COALESCE(SUM((
           SELECT SUM(value::numeric) FROM jsonb_array_elements_text(wl.set_weights_kg) t(value)
         )), 0)::text AS volume_kg,
         COALESCE(SUM(wl.set_count), 0)::text AS sets
       FROM workout_logs wl
       JOIN user_gyms ug ON ug.id = wl.gym_id
       ${joinUser}
       WHERE 1=1
         ${dateSql}
         ${sql}
       GROUP BY ${groupExpr}${groupBy === 'gym' || groupBy === 'user' ? `, ${labelExpr}` : ''}
       ORDER BY SUM((
         SELECT SUM(value::numeric) FROM jsonb_array_elements_text(wl.set_weights_kg) t(value)
       )) DESC NULLS LAST
       LIMIT 50`,
      params
    );

    void locale;
    return result.rows.map((r) => ({
      code: r.code,
      label: r.label,
      activeNow: parseInt(r.active_now, 10) || 0,
      volumeTodayKg: parseFloat(r.volume_kg) || 0,
      setsToday: parseInt(r.sets, 10) || 0,
    }));
  },

  async topMachines(
    filter: LiveScopeFilter = {},
    limit = 5,
    period: LiveRankingPeriod | 'today' = 'today'
  ) {
    const pool = getPool();
    if (!pool) return [];
    const { sql, params } = geoWhere(filter);
    const dateSql = periodWhere(period, params);
    const result = await pool.query<{
      code: string;
      name: Record<string, string> | string;
      sets: string;
    }>(
      `SELECT m.code, m.name, COALESCE(SUM(wl.set_count),0)::text AS sets
       FROM workout_logs wl
       JOIN user_gyms ug ON ug.id = wl.gym_id
       JOIN machines m ON m.id = wl.machine_id
       WHERE 1=1 ${dateSql} ${sql}
       GROUP BY m.code, m.name
       ORDER BY SUM(wl.set_count) DESC
       LIMIT $${params.length + 1}`,
      [...params, limit]
    );
    return result.rows.map((r) => ({
      code: r.code,
      name:
        typeof r.name === 'object'
          ? (r.name.ko || r.name.en || r.code)
          : String(r.name),
      sets: parseInt(r.sets, 10) || 0,
    }));
  },

  async topBrands(
    filter: LiveScopeFilter = {},
    limit = 5,
    period: LiveRankingPeriod | 'today' = 'today'
  ) {
    const pool = getPool();
    if (!pool) return [];
    const { sql, params } = geoWhere(filter);
    const dateSql = periodWhere(period, params);
    const result = await pool.query<{ code: string; name: Record<string, string>; sets: string }>(
      `SELECT b.code, b.name, COALESCE(SUM(wl.set_count),0)::text AS sets
       FROM workout_logs wl
       JOIN user_gyms ug ON ug.id = wl.gym_id
       JOIN machines m ON m.id = wl.machine_id
       JOIN brands b ON b.id = m.brand_id
       WHERE 1=1 ${dateSql} ${sql}
       GROUP BY b.code, b.name
       ORDER BY SUM(wl.set_count) DESC
       LIMIT $${params.length + 1}`,
      [...params, limit]
    );
    return result.rows.map((r) => ({
      code: r.code,
      name: r.name?.ko || r.name?.en || r.code,
      sets: parseInt(r.sets, 10) || 0,
    }));
  },

  async topMuscles(
    filter: LiveScopeFilter = {},
    limit = 20,
    period: LiveRankingPeriod | 'today' = 'today'
  ) {
    const pool = getPool();
    if (!pool) return [];
    const { sql, params } = geoWhere(filter);
    const dateSql = periodWhere(period, params);
    const result = await pool.query<{ muscle_group: string; sets: string }>(
      `SELECT m.muscle_group, COALESCE(SUM(wl.set_count),0)::text AS sets
       FROM workout_logs wl
       JOIN user_gyms ug ON ug.id = wl.gym_id
       JOIN machines m ON m.id = wl.machine_id
       WHERE 1=1 ${dateSql} ${sql}
         AND m.muscle_group IS NOT NULL
       GROUP BY m.muscle_group
       ORDER BY SUM(wl.set_count) DESC
       LIMIT $${params.length + 1}`,
      [...params, limit]
    );
    return result.rows.map((r) => ({
      code: r.muscle_group,
      sets: parseInt(r.sets, 10) || 0,
    }));
  },

  async topMuscle(filter: LiveScopeFilter = {}): Promise<string | null> {
    const rows = await this.topMuscles(filter, 1, 'today');
    return rows[0]?.code ?? null;
  },

  async findGymName(gymId: string): Promise<string | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<{ name: string }>(
      `SELECT name FROM user_gyms WHERE id = $1 LIMIT 1`,
      [gymId]
    );
    return result.rows[0]?.name ?? null;
  },

  async hourly(filter: LiveScopeFilter = {}) {
    const pool = getPool();
    if (!pool) return [];
    const { sql, params } = geoWhere(filter);
    const result = await pool.query<{
      hour: string;
      active_users: string;
      sets: string;
      volume_kg: string;
    }>(
      `SELECT EXTRACT(HOUR FROM wl.updated_at AT TIME ZONE 'Asia/Seoul')::int AS hour,
              COUNT(DISTINCT wl.user_id)::text AS active_users,
              COALESCE(SUM(wl.set_count),0)::text AS sets,
              COALESCE(SUM((
                SELECT SUM(value::numeric) FROM jsonb_array_elements_text(wl.set_weights_kg) t(value)
              )),0)::text AS volume_kg
       FROM workout_logs wl
       JOIN user_gyms ug ON ug.id = wl.gym_id
       WHERE wl.updated_at::date = (NOW() AT TIME ZONE 'Asia/Seoul')::date
         ${sql}
       GROUP BY 1
       ORDER BY 1`,
      params
    );
    return result.rows.map((r) => ({
      hour: parseInt(r.hour, 10) || 0,
      activeUsers: parseInt(r.active_users, 10) || 0,
      sets: parseInt(r.sets, 10) || 0,
      volumeKg: parseFloat(r.volume_kg) || 0,
    }));
  },

  async recentFeed(filter: LiveScopeFilter = {}, limit = 20) {
    const pool = getPool();
    if (!pool) return [];
    const { sql, params } = geoWhere(filter);
    const result = await pool.query<{
      id: string;
      display_name: string;
      gym_name: string;
      machine_name: Record<string, string>;
      volume: string;
      updated_at: string;
    }>(
      `SELECT wl.id::text,
              COALESCE(u.display_name, '회원') AS display_name,
              ug.name AS gym_name,
              m.name AS machine_name,
              COALESCE((
                SELECT SUM(value::numeric) FROM jsonb_array_elements_text(wl.set_weights_kg) t(value)
              ),0)::text AS volume,
              wl.updated_at::text
       FROM workout_logs wl
       JOIN user_gyms ug ON ug.id = wl.gym_id
       JOIN users u ON u.id = wl.user_id
       JOIN machines m ON m.id = wl.machine_id
       WHERE wl.updated_at >= NOW() - interval '24 hours'
         ${sql}
       ORDER BY wl.updated_at DESC
       LIMIT $${params.length + 1}`,
      [...params, limit]
    );
    return result.rows;
  },

  async search(q: string, locale = 'ko'): Promise<{
    gyms: { id: string; name: string; country_code: string; metro_code: string; district_code: string }[];
    users: { id: string; display_name: string }[];
    machines: { code: string; name: Record<string, string> }[];
  }> {
    const pool = getPool();
    if (!pool || !q.trim()) return { gyms: [], users: [], machines: [] };
    const like = `%${q.trim()}%`;
    const gyms = await pool.query<{
      id: string;
      name: string;
      country_code: string;
      metro_code: string;
      district_code: string;
    }>(
      `SELECT id::text, name, country_code, metro_code, district_code
       FROM user_gyms
       WHERE name ILIKE $1
       ORDER BY name ASC
       LIMIT 10`,
      [like]
    );
    const users = await pool.query<{ id: string; display_name: string }>(
      `SELECT id::text, display_name FROM users WHERE display_name ILIKE $1 LIMIT 10`,
      [like]
    );
    const machines = await pool.query<{ code: string; name: Record<string, string> }>(
      `SELECT code, name FROM machines WHERE name::text ILIKE $1 AND is_active LIMIT 10`,
      [like]
    );
    void locale;
    return { gyms: gyms.rows, users: users.rows, machines: machines.rows };
  },
};

export const liveSnapshotCache = new TtlCache<unknown>(12_000);
