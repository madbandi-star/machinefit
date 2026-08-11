import {
  USAGE_COLUMN_BY_FEATURE,
  type UsageFeatureCode,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { seoulDateKey, seoulMonthKey } from '../utils/mypage-workout-metrics.js';

export type UsageCounterRow = {
  exercise_card_create_count: number;
  exercise_card_update_count: number;
  exercise_record_save_count: number;
  exercise_record_delete_count: number;
  template_create_count: number;
  template_use_count: number;
  template_download_count: number;
  template_save_count: number;
  timer_start_count: number;
  timer_end_count: number;
  rest_timer_count: number;
  lap_record_count: number;
  voice_count_count: number;
  voice_count_complete_count: number;
  login_count: number;
  api_request_count: number;
  extras: Record<string, number> | null;
};

const EMPTY_COUNTERS: UsageCounterRow = {
  exercise_card_create_count: 0,
  exercise_card_update_count: 0,
  exercise_record_save_count: 0,
  exercise_record_delete_count: 0,
  template_create_count: 0,
  template_use_count: 0,
  template_download_count: 0,
  template_save_count: 0,
  timer_start_count: 0,
  timer_end_count: 0,
  rest_timer_count: 0,
  lap_record_count: 0,
  voice_count_count: 0,
  voice_count_complete_count: 0,
  login_count: 0,
  api_request_count: 0,
  extras: {},
};

const FIXED_COLUMNS = new Set(Object.values(USAGE_COLUMN_BY_FEATURE));

function pool() {
  const p = getPool();
  if (!p) throw new Error('DATABASE_URL not configured');
  return p;
}

function parseExtras(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(v);
    if (Number.isFinite(n) && n !== 0) out[k] = n;
  }
  return out;
}

export function mapCounters(row?: Partial<UsageCounterRow> | null) {
  const extras = parseExtras(row?.extras);
  return {
    exerciseCardCreateCount: Number(row?.exercise_card_create_count ?? 0),
    exerciseCardUpdateCount: Number(row?.exercise_card_update_count ?? 0),
    exerciseRecordSaveCount: Number(row?.exercise_record_save_count ?? 0),
    exerciseRecordDeleteCount: Number(row?.exercise_record_delete_count ?? 0),
    templateCreateCount: Number(row?.template_create_count ?? 0),
    templateUseCount: Number(row?.template_use_count ?? 0),
    templateDownloadCount: Number(row?.template_download_count ?? 0),
    templateSaveCount: Number(row?.template_save_count ?? 0),
    timerStartCount: Number(row?.timer_start_count ?? 0),
    timerEndCount: Number(row?.timer_end_count ?? 0),
    restTimerCount: Number(row?.rest_timer_count ?? 0),
    lapRecordCount: Number(row?.lap_record_count ?? 0),
    voiceCountCount: Number(row?.voice_count_count ?? 0),
    voiceCountCompleteCount: Number(row?.voice_count_complete_count ?? 0),
    loginCount: Number(row?.login_count ?? 0),
    apiRequestCount: Number(row?.api_request_count ?? 0),
    extras,
  };
}

function sumCounterRows(rows: UsageCounterRow[]) {
  const acc = { ...EMPTY_COUNTERS, extras: {} as Record<string, number> };
  for (const row of rows) {
    for (const key of Object.keys(EMPTY_COUNTERS) as (keyof UsageCounterRow)[]) {
      if (key === 'extras') continue;
      const accMap = acc as unknown as Record<string, number>;
      accMap[key] = Number(accMap[key] ?? 0) + Number(row[key] ?? 0);
    }
    const extras = parseExtras(row.extras);
    for (const [k, v] of Object.entries(extras)) {
      acc.extras[k] = (acc.extras[k] ?? 0) + v;
    }
  }
  return mapCounters(acc);
}

export const usageRepository = {
  async incrementUsage(
    userId: string,
    featureCode: string,
    amount = 1,
    at: Date = new Date()
  ): Promise<void> {
    const dateKey = seoulDateKey(at);
    const monthKey = seoulMonthKey(at);
    const column = USAGE_COLUMN_BY_FEATURE[featureCode as UsageFeatureCode];
    const p = pool();
    const client = await p.connect();
    try {
      await client.query('BEGIN');

      if (column && FIXED_COLUMNS.has(column)) {
        await client.query(
          `INSERT INTO user_usage_daily (user_id, usage_date, ${column}, active_flag)
           VALUES ($1, $2::date, $3, TRUE)
           ON CONFLICT (user_id, usage_date) DO UPDATE SET
             ${column} = user_usage_daily.${column} + EXCLUDED.${column},
             active_flag = TRUE,
             updated_at = NOW()`,
          [userId, dateKey, amount]
        );
        await client.query(
          `INSERT INTO user_usage_monthly (user_id, usage_month, ${column}, active_days)
           VALUES ($1, $2, $3, 1)
           ON CONFLICT (user_id, usage_month) DO UPDATE SET
             ${column} = user_usage_monthly.${column} + EXCLUDED.${column},
             updated_at = NOW()`,
          [userId, monthKey, amount]
        );
      } else {
        await client.query(
          `INSERT INTO user_usage_daily (user_id, usage_date, extras, active_flag)
           VALUES ($1, $2::date, jsonb_build_object($3::text, $4::int), TRUE)
           ON CONFLICT (user_id, usage_date) DO UPDATE SET
             extras = jsonb_set(
               COALESCE(user_usage_daily.extras, '{}'::jsonb),
               ARRAY[$3::text],
               to_jsonb(
                 COALESCE((user_usage_daily.extras->>$3)::int, 0) + $4
               ),
               true
             ),
             active_flag = TRUE,
             updated_at = NOW()`,
          [userId, dateKey, featureCode, amount]
        );
        await client.query(
          `INSERT INTO user_usage_monthly (user_id, usage_month, extras, active_days)
           VALUES ($1, $2, jsonb_build_object($3::text, $4::int), 1)
           ON CONFLICT (user_id, usage_month) DO UPDATE SET
             extras = jsonb_set(
               COALESCE(user_usage_monthly.extras, '{}'::jsonb),
               ARRAY[$3::text],
               to_jsonb(
                 COALESCE((user_usage_monthly.extras->>$3)::int, 0) + $4
               ),
               true
             ),
             updated_at = NOW()`,
          [userId, monthKey, featureCode, amount]
        );
      }

      // active_days: count distinct active daily rows in the month (recompute cheaply)
      await client.query(
        `UPDATE user_usage_monthly m
         SET active_days = sub.cnt,
             updated_at = NOW()
         FROM (
           SELECT COUNT(*)::int AS cnt
           FROM user_usage_daily d
           WHERE d.user_id = $1
             AND d.active_flag = TRUE
             AND to_char(d.usage_date, 'YYYY-MM') = $2
         ) sub
         WHERE m.user_id = $1 AND m.usage_month = $2`,
        [userId, monthKey]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async getDaily(userId: string, usageDate: string) {
    const { rows } = await pool().query<UsageCounterRow>(
      `SELECT * FROM user_usage_daily WHERE user_id = $1 AND usage_date = $2::date`,
      [userId, usageDate]
    );
    return mapCounters(rows[0] ?? null);
  },

  async getMonthly(userId: string, usageMonth: string) {
    const { rows } = await pool().query<UsageCounterRow & { active_days: number }>(
      `SELECT * FROM user_usage_monthly WHERE user_id = $1 AND usage_month = $2`,
      [userId, usageMonth]
    );
    return {
      counters: mapCounters(rows[0] ?? null),
      activeDays: Number(rows[0]?.active_days ?? 0),
    };
  },

  async getFeatureCount(
    userId: string,
    featureCode: string,
    scope: 'daily' | 'monthly',
    at: Date = new Date()
  ): Promise<number> {
    const column = USAGE_COLUMN_BY_FEATURE[featureCode as UsageFeatureCode];
    if (scope === 'daily') {
      const dateKey = seoulDateKey(at);
      if (column) {
        const { rows } = await pool().query<{ c: number }>(
          `SELECT COALESCE(${column}, 0)::int AS c FROM user_usage_daily
           WHERE user_id = $1 AND usage_date = $2::date`,
          [userId, dateKey]
        );
        return Number(rows[0]?.c ?? 0);
      }
      const { rows } = await pool().query<{ c: number }>(
        `SELECT COALESCE((extras->>$3)::int, 0) AS c FROM user_usage_daily
         WHERE user_id = $1 AND usage_date = $2::date`,
        [userId, dateKey, featureCode]
      );
      return Number(rows[0]?.c ?? 0);
    }

    const monthKey = seoulMonthKey(at);
    if (column) {
      const { rows } = await pool().query<{ c: number }>(
        `SELECT COALESCE(${column}, 0)::int AS c FROM user_usage_monthly
         WHERE user_id = $1 AND usage_month = $2`,
        [userId, monthKey]
      );
      return Number(rows[0]?.c ?? 0);
    }
    const { rows } = await pool().query<{ c: number }>(
      `SELECT COALESCE((extras->>$3)::int, 0) AS c FROM user_usage_monthly
       WHERE user_id = $1 AND usage_month = $2`,
      [userId, monthKey, featureCode]
    );
    return Number(rows[0]?.c ?? 0);
  },

  async getSummaryTotals(today: string, month: string) {
    const p = pool();
    const [users, activeToday, activeMonth, todayAgg, monthAgg] = await Promise.all([
      p.query<{ c: string }>(`SELECT COUNT(*)::text AS c FROM users WHERE is_active = TRUE`),
      p.query<{ c: string }>(
        `SELECT COUNT(*)::text AS c FROM user_usage_daily
         WHERE usage_date = $1::date AND active_flag = TRUE`,
        [today]
      ),
      p.query<{ c: string }>(
        `SELECT COUNT(DISTINCT user_id)::text AS c FROM user_usage_daily
         WHERE to_char(usage_date, 'YYYY-MM') = $1 AND active_flag = TRUE`,
        [month]
      ),
      p.query<UsageCounterRow>(
        `SELECT
           COALESCE(SUM(exercise_card_create_count),0)::int AS exercise_card_create_count,
           COALESCE(SUM(exercise_card_update_count),0)::int AS exercise_card_update_count,
           COALESCE(SUM(exercise_record_save_count),0)::int AS exercise_record_save_count,
           COALESCE(SUM(exercise_record_delete_count),0)::int AS exercise_record_delete_count,
           COALESCE(SUM(template_create_count),0)::int AS template_create_count,
           COALESCE(SUM(template_use_count),0)::int AS template_use_count,
           COALESCE(SUM(template_download_count),0)::int AS template_download_count,
           COALESCE(SUM(template_save_count),0)::int AS template_save_count,
           COALESCE(SUM(timer_start_count),0)::int AS timer_start_count,
           COALESCE(SUM(timer_end_count),0)::int AS timer_end_count,
           COALESCE(SUM(rest_timer_count),0)::int AS rest_timer_count,
           COALESCE(SUM(lap_record_count),0)::int AS lap_record_count,
           COALESCE(SUM(voice_count_count),0)::int AS voice_count_count,
           COALESCE(SUM(voice_count_complete_count),0)::int AS voice_count_complete_count,
           COALESCE(SUM(login_count),0)::int AS login_count,
           COALESCE(SUM(api_request_count),0)::int AS api_request_count,
           '{}'::jsonb AS extras
         FROM user_usage_daily WHERE usage_date = $1::date`,
        [today]
      ),
      p.query<UsageCounterRow>(
        `SELECT
           COALESCE(SUM(exercise_card_create_count),0)::int AS exercise_card_create_count,
           COALESCE(SUM(exercise_card_update_count),0)::int AS exercise_card_update_count,
           COALESCE(SUM(exercise_record_save_count),0)::int AS exercise_record_save_count,
           COALESCE(SUM(exercise_record_delete_count),0)::int AS exercise_record_delete_count,
           COALESCE(SUM(template_create_count),0)::int AS template_create_count,
           COALESCE(SUM(template_use_count),0)::int AS template_use_count,
           COALESCE(SUM(template_download_count),0)::int AS template_download_count,
           COALESCE(SUM(template_save_count),0)::int AS template_save_count,
           COALESCE(SUM(timer_start_count),0)::int AS timer_start_count,
           COALESCE(SUM(timer_end_count),0)::int AS timer_end_count,
           COALESCE(SUM(rest_timer_count),0)::int AS rest_timer_count,
           COALESCE(SUM(lap_record_count),0)::int AS lap_record_count,
           COALESCE(SUM(voice_count_count),0)::int AS voice_count_count,
           COALESCE(SUM(voice_count_complete_count),0)::int AS voice_count_complete_count,
           COALESCE(SUM(login_count),0)::int AS login_count,
           COALESCE(SUM(api_request_count),0)::int AS api_request_count,
           '{}'::jsonb AS extras
         FROM user_usage_monthly WHERE usage_month = $1`,
        [month]
      ),
    ]);

    return {
      totalUsers: Number(users.rows[0]?.c ?? 0),
      activeUsersToday: Number(activeToday.rows[0]?.c ?? 0),
      activeUsersMonth: Number(activeMonth.rows[0]?.c ?? 0),
      today: mapCounters(todayAgg.rows[0]),
      month: mapCounters(monthAgg.rows[0]),
    };
  },

  async getTimeseries(from: string, to: string) {
    const { rows } = await pool().query<{
      usage_date: string;
      active_users: string;
      exercise_card_create_count: number;
      template_use_count: number;
      timer_start_count: number;
      voice_count_count: number;
    }>(
      `SELECT usage_date::text AS usage_date,
              COUNT(*) FILTER (WHERE active_flag)::text AS active_users,
              COALESCE(SUM(exercise_card_create_count),0)::int AS exercise_card_create_count,
              COALESCE(SUM(template_use_count),0)::int AS template_use_count,
              COALESCE(SUM(timer_start_count),0)::int AS timer_start_count,
              COALESCE(SUM(voice_count_count),0)::int AS voice_count_count
       FROM user_usage_daily
       WHERE usage_date BETWEEN $1::date AND $2::date
       GROUP BY usage_date
       ORDER BY usage_date ASC`,
      [from, to]
    );
    return rows.map((r) => ({
      date: r.usage_date.slice(0, 10),
      activeUsers: Number(r.active_users ?? 0),
      exerciseCardCreateCount: Number(r.exercise_card_create_count ?? 0),
      templateUseCount: Number(r.template_use_count ?? 0),
      timerStartCount: Number(r.timer_start_count ?? 0),
      voiceCountCount: Number(r.voice_count_count ?? 0),
    }));
  },

  async searchUsers(opts: { q?: string; page: number; limit: number }) {
    const offset = (opts.page - 1) * opts.limit;
    const today = seoulDateKey();
    const month = seoulMonthKey();
    const filterParams: unknown[] = [];
    let where = 'WHERE u.is_active = TRUE';
    if (opts.q?.trim()) {
      filterParams.push(`%${opts.q.trim()}%`);
      where += ` AND (
        u.email ILIKE $1
        OR u.display_name ILIKE $1
        OR u.id::text ILIKE $1
      )`;
    }

    const countRes = await pool().query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM users u ${where}`,
      filterParams
    );

    const listParams: unknown[] = [today, month, ...filterParams, opts.limit, offset];
    const qIdx = filterParams.length ? 3 : null;
    const limitIdx = listParams.length - 1;
    const offsetIdx = listParams.length;
    const whereList = filterParams.length
      ? `WHERE u.is_active = TRUE AND (
           u.email ILIKE $${qIdx}
           OR u.display_name ILIKE $${qIdx}
           OR u.id::text ILIKE $${qIdx}
         )`
      : 'WHERE u.is_active = TRUE';

    const { rows } = await pool().query(
      `SELECT u.id, u.email, u.display_name, u.role_code,
              u.membership_type, u.subscription_plan, u.created_at,
              d.*, m.active_days AS month_active_days,
              m.exercise_card_create_count AS m_exercise_card_create_count,
              m.exercise_card_update_count AS m_exercise_card_update_count,
              m.exercise_record_save_count AS m_exercise_record_save_count,
              m.exercise_record_delete_count AS m_exercise_record_delete_count,
              m.template_create_count AS m_template_create_count,
              m.template_use_count AS m_template_use_count,
              m.template_download_count AS m_template_download_count,
              m.template_save_count AS m_template_save_count,
              m.timer_start_count AS m_timer_start_count,
              m.timer_end_count AS m_timer_end_count,
              m.rest_timer_count AS m_rest_timer_count,
              m.lap_record_count AS m_lap_record_count,
              m.voice_count_count AS m_voice_count_count,
              m.voice_count_complete_count AS m_voice_count_complete_count,
              m.login_count AS m_login_count,
              m.api_request_count AS m_api_request_count,
              m.extras AS m_extras
       FROM users u
       LEFT JOIN user_usage_daily d ON d.user_id = u.id AND d.usage_date = $1::date
       LEFT JOIN user_usage_monthly m ON m.user_id = u.id AND m.usage_month = $2
       ${whereList}
       ORDER BY u.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      listParams
    );

    return {
      total: Number(countRes.rows[0]?.c ?? 0),
      items: rows.map((r) => ({
        userId: String(r.id),
        email: String(r.email ?? ''),
        displayName: String(r.display_name ?? ''),
        roleCode: String(r.role_code ?? ''),
        membershipType: r.membership_type ? String(r.membership_type) : null,
        subscriptionPlan: r.subscription_plan ? String(r.subscription_plan) : null,
        createdAt: new Date(r.created_at).toISOString(),
        todayActive: Boolean(r.active_flag),
        monthActiveDays: Number(r.month_active_days ?? 0),
        today: mapCounters(r as UsageCounterRow),
        month: mapCounters({
          exercise_card_create_count: r.m_exercise_card_create_count,
          exercise_card_update_count: r.m_exercise_card_update_count,
          exercise_record_save_count: r.m_exercise_record_save_count,
          exercise_record_delete_count: r.m_exercise_record_delete_count,
          template_create_count: r.m_template_create_count,
          template_use_count: r.m_template_use_count,
          template_download_count: r.m_template_download_count,
          template_save_count: r.m_template_save_count,
          timer_start_count: r.m_timer_start_count,
          timer_end_count: r.m_timer_end_count,
          rest_timer_count: r.m_rest_timer_count,
          lap_record_count: r.m_lap_record_count,
          voice_count_count: r.m_voice_count_count,
          voice_count_complete_count: r.m_voice_count_complete_count,
          login_count: r.m_login_count,
          api_request_count: r.m_api_request_count,
          extras: r.m_extras,
        } as UsageCounterRow),
      })),
    };
  },

  async getUserDetail(userId: string) {
    const today = seoulDateKey();
    const month = seoulMonthKey();
    const from7 = seoulDateKey(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));

    const userRes = await pool().query(
      `SELECT u.id, u.email, u.display_name, r.code AS role_code, u.membership_type,
              u.subscription_plan, u.subscription_status, u.created_at
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [userId]
    );
    const u = userRes.rows[0];
    if (!u) return null;

    const [todayRow, monthRow, last7, lifetime, series] = await Promise.all([
      this.getDaily(userId, today),
      this.getMonthly(userId, month),
      pool().query<UsageCounterRow>(
        `SELECT
           COALESCE(SUM(exercise_card_create_count),0)::int AS exercise_card_create_count,
           COALESCE(SUM(exercise_card_update_count),0)::int AS exercise_card_update_count,
           COALESCE(SUM(exercise_record_save_count),0)::int AS exercise_record_save_count,
           COALESCE(SUM(exercise_record_delete_count),0)::int AS exercise_record_delete_count,
           COALESCE(SUM(template_create_count),0)::int AS template_create_count,
           COALESCE(SUM(template_use_count),0)::int AS template_use_count,
           COALESCE(SUM(template_download_count),0)::int AS template_download_count,
           COALESCE(SUM(template_save_count),0)::int AS template_save_count,
           COALESCE(SUM(timer_start_count),0)::int AS timer_start_count,
           COALESCE(SUM(timer_end_count),0)::int AS timer_end_count,
           COALESCE(SUM(rest_timer_count),0)::int AS rest_timer_count,
           COALESCE(SUM(lap_record_count),0)::int AS lap_record_count,
           COALESCE(SUM(voice_count_count),0)::int AS voice_count_count,
           COALESCE(SUM(voice_count_complete_count),0)::int AS voice_count_complete_count,
           COALESCE(SUM(login_count),0)::int AS login_count,
           COALESCE(SUM(api_request_count),0)::int AS api_request_count,
           '{}'::jsonb AS extras
         FROM user_usage_daily
         WHERE user_id = $1 AND usage_date BETWEEN $2::date AND $3::date`,
        [userId, from7, today]
      ),
      pool().query<UsageCounterRow>(
        `SELECT
           COALESCE(SUM(exercise_card_create_count),0)::int AS exercise_card_create_count,
           COALESCE(SUM(exercise_card_update_count),0)::int AS exercise_card_update_count,
           COALESCE(SUM(exercise_record_save_count),0)::int AS exercise_record_save_count,
           COALESCE(SUM(exercise_record_delete_count),0)::int AS exercise_record_delete_count,
           COALESCE(SUM(template_create_count),0)::int AS template_create_count,
           COALESCE(SUM(template_use_count),0)::int AS template_use_count,
           COALESCE(SUM(template_download_count),0)::int AS template_download_count,
           COALESCE(SUM(template_save_count),0)::int AS template_save_count,
           COALESCE(SUM(timer_start_count),0)::int AS timer_start_count,
           COALESCE(SUM(timer_end_count),0)::int AS timer_end_count,
           COALESCE(SUM(rest_timer_count),0)::int AS rest_timer_count,
           COALESCE(SUM(lap_record_count),0)::int AS lap_record_count,
           COALESCE(SUM(voice_count_count),0)::int AS voice_count_count,
           COALESCE(SUM(voice_count_complete_count),0)::int AS voice_count_complete_count,
           COALESCE(SUM(login_count),0)::int AS login_count,
           COALESCE(SUM(api_request_count),0)::int AS api_request_count,
           '{}'::jsonb AS extras
         FROM user_usage_monthly WHERE user_id = $1`,
        [userId]
      ),
      pool().query<UsageCounterRow & { usage_date: string }>(
        `SELECT * FROM user_usage_daily
         WHERE user_id = $1 AND usage_date BETWEEN $2::date AND $3::date
         ORDER BY usage_date ASC`,
        [userId, from7, today]
      ),
    ]);

    return {
      user: {
        id: String(u.id),
        email: String(u.email ?? ''),
        displayName: String(u.display_name ?? ''),
        roleCode: String(u.role_code ?? ''),
        membershipType: u.membership_type ? String(u.membership_type) : null,
        subscriptionPlan: u.subscription_plan ? String(u.subscription_plan) : null,
        subscriptionStatus: u.subscription_status ? String(u.subscription_status) : null,
        createdAt: new Date(u.created_at).toISOString(),
      },
      today: todayRow,
      last7Days: mapCounters(last7.rows[0]),
      month: monthRow.counters,
      lifetime: mapCounters(lifetime.rows[0]),
      dailySeries: series.rows.map((r) => ({
        date: String(r.usage_date).slice(0, 10),
        counters: mapCounters(r),
      })),
    };
  },

  sumCounterRows,
};
