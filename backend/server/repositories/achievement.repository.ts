import type { AchievementUserStats, LocalizedText } from '@machinefit/shared';
import { emptyAchievementStats } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import {
  seoulDateKey,
  SQL_LOG_VOLUME_LATERAL,
} from '../utils/mypage-workout-metrics.js';

type StatsRow = {
  total_volume_kg: string;
  workout_count: number;
  session_days: number;
  current_streak: number;
  longest_streak: number;
  unique_machines: number;
  unique_brands: number;
  unique_gyms: number;
  pr_count: number;
  dawn_workouts: number;
  morning_workouts: number;
  afternoon_workouts: number;
  evening_workouts: number;
  night_workouts: number;
  chest_workouts: number;
  back_workouts: number;
  legs_workouts: number;
  shoulders_workouts: number;
  arms_workouts: number;
  core_workouts: number;
  holiday_workouts: number;
  new_year_workouts: number;
  christmas_workouts: number;
  halloween_workouts: number;
  summer_2026_workouts: number;
  winter_2026_workouts: number;
  leg_day_workouts: number;
  bench_workouts: number;
  squat_workouts: number;
  upper_ratio_pct: string;
  lower_ratio_pct: string;
  balance_score: string;
  total_xp: number;
  level: number;
  active_title_ko: string | null;
  active_title_en: string | null;
};

function mapStats(row: StatsRow | undefined): AchievementUserStats & {
  totalXp: number;
  level: number;
  activeTitle: LocalizedText | null;
} {
  if (!row) {
    return { ...emptyAchievementStats(), totalXp: 0, level: 1, activeTitle: null };
  }
  return {
    totalVolumeKg: parseFloat(row.total_volume_kg) || 0,
    workoutCount: row.workout_count,
    sessionDays: row.session_days,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    uniqueMachines: row.unique_machines,
    uniqueBrands: row.unique_brands,
    uniqueGyms: row.unique_gyms,
    prCount: row.pr_count,
    dawnWorkouts: row.dawn_workouts,
    morningWorkouts: row.morning_workouts,
    afternoonWorkouts: row.afternoon_workouts,
    eveningWorkouts: row.evening_workouts,
    nightWorkouts: row.night_workouts,
    chestWorkouts: row.chest_workouts,
    backWorkouts: row.back_workouts,
    legsWorkouts: row.legs_workouts,
    shouldersWorkouts: row.shoulders_workouts,
    armsWorkouts: row.arms_workouts,
    coreWorkouts: row.core_workouts,
    holidayWorkouts: row.holiday_workouts,
    newYearWorkouts: row.new_year_workouts,
    christmasWorkouts: row.christmas_workouts,
    halloweenWorkouts: row.halloween_workouts,
    summer2026Workouts: row.summer_2026_workouts,
    winter2026Workouts: row.winter_2026_workouts,
    legDayWorkouts: row.leg_day_workouts,
    benchWorkouts: row.bench_workouts,
    squatWorkouts: row.squat_workouts,
    upperRatioPct: parseFloat(row.upper_ratio_pct) || 0,
    lowerRatioPct: parseFloat(row.lower_ratio_pct) || 0,
    balanceScore: parseFloat(row.balance_score) || 0,
    totalXp: row.total_xp,
    level: row.level,
    activeTitle:
      row.active_title_ko || row.active_title_en
        ? { ko: row.active_title_ko ?? '', en: row.active_title_en ?? '' }
        : null,
  };
}

export const achievementRepository = {
  /** Cheap fingerprint to skip full achievement recompute when logs are unchanged. */
  async getLogsRevision(
    userId: string,
    options?: { gymId?: string; memberId?: string }
  ): Promise<string> {
    const pool = getPool();
    if (!pool) return '0:';
    const params: unknown[] = [userId];
    let filters = '';
    if (options?.gymId && options?.memberId) {
      params.push(options.gymId, options.memberId);
      filters = ' AND gym_id = $2 AND member_id = $3';
    }
    const result = await pool.query<{ c: string; m: string | null }>(
      `SELECT COUNT(*)::text AS c, MAX(updated_at)::text AS m
       FROM workout_logs
       WHERE user_id = $1${filters}`,
      params
    );
    return `${result.rows[0]?.c ?? '0'}:${result.rows[0]?.m ?? ''}`;
  },

  async getStats(userId: string) {
    const pool = getPool();
    if (!pool) return mapStats(undefined);
    const result = await pool.query<StatsRow>(
      `SELECT * FROM user_achievement_stats WHERE user_id = $1`,
      [userId]
    );
    return mapStats(result.rows[0]);
  },

  async upsertStats(
    userId: string,
    stats: AchievementUserStats,
    meta: { totalXp: number; level: number; activeTitle: LocalizedText | null }
  ): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `INSERT INTO user_achievement_stats (
        user_id, total_volume_kg, workout_count, session_days, current_streak, longest_streak,
        unique_machines, unique_brands, unique_gyms, pr_count,
        dawn_workouts, morning_workouts, afternoon_workouts, evening_workouts, night_workouts,
        chest_workouts, back_workouts, legs_workouts, shoulders_workouts, arms_workouts, core_workouts,
        holiday_workouts, new_year_workouts, christmas_workouts, halloween_workouts,
        summer_2026_workouts, winter_2026_workouts, leg_day_workouts, bench_workouts, squat_workouts,
        upper_ratio_pct, lower_ratio_pct, balance_score, total_xp, level,
        active_title_ko, active_title_en, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,
        $22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        total_volume_kg = EXCLUDED.total_volume_kg,
        workout_count = EXCLUDED.workout_count,
        session_days = EXCLUDED.session_days,
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        unique_machines = EXCLUDED.unique_machines,
        unique_brands = EXCLUDED.unique_brands,
        unique_gyms = EXCLUDED.unique_gyms,
        pr_count = EXCLUDED.pr_count,
        dawn_workouts = EXCLUDED.dawn_workouts,
        morning_workouts = EXCLUDED.morning_workouts,
        afternoon_workouts = EXCLUDED.afternoon_workouts,
        evening_workouts = EXCLUDED.evening_workouts,
        night_workouts = EXCLUDED.night_workouts,
        chest_workouts = EXCLUDED.chest_workouts,
        back_workouts = EXCLUDED.back_workouts,
        legs_workouts = EXCLUDED.legs_workouts,
        shoulders_workouts = EXCLUDED.shoulders_workouts,
        arms_workouts = EXCLUDED.arms_workouts,
        core_workouts = EXCLUDED.core_workouts,
        holiday_workouts = EXCLUDED.holiday_workouts,
        new_year_workouts = EXCLUDED.new_year_workouts,
        christmas_workouts = EXCLUDED.christmas_workouts,
        halloween_workouts = EXCLUDED.halloween_workouts,
        summer_2026_workouts = EXCLUDED.summer_2026_workouts,
        winter_2026_workouts = EXCLUDED.winter_2026_workouts,
        leg_day_workouts = EXCLUDED.leg_day_workouts,
        bench_workouts = EXCLUDED.bench_workouts,
        squat_workouts = EXCLUDED.squat_workouts,
        upper_ratio_pct = EXCLUDED.upper_ratio_pct,
        lower_ratio_pct = EXCLUDED.lower_ratio_pct,
        balance_score = EXCLUDED.balance_score,
        total_xp = EXCLUDED.total_xp,
        level = EXCLUDED.level,
        active_title_ko = EXCLUDED.active_title_ko,
        active_title_en = EXCLUDED.active_title_en,
        updated_at = NOW()`,
      [
        userId,
        stats.totalVolumeKg,
        stats.workoutCount,
        stats.sessionDays,
        stats.currentStreak,
        stats.longestStreak,
        stats.uniqueMachines,
        stats.uniqueBrands,
        stats.uniqueGyms,
        stats.prCount,
        stats.dawnWorkouts,
        stats.morningWorkouts,
        stats.afternoonWorkouts,
        stats.eveningWorkouts,
        stats.nightWorkouts,
        stats.chestWorkouts,
        stats.backWorkouts,
        stats.legsWorkouts,
        stats.shouldersWorkouts,
        stats.armsWorkouts,
        stats.coreWorkouts,
        stats.holidayWorkouts,
        stats.newYearWorkouts,
        stats.christmasWorkouts,
        stats.halloweenWorkouts,
        stats.summer2026Workouts,
        stats.winter2026Workouts,
        stats.legDayWorkouts,
        stats.benchWorkouts,
        stats.squatWorkouts,
        stats.upperRatioPct,
        stats.lowerRatioPct,
        stats.balanceScore,
        meta.totalXp,
        meta.level,
        meta.activeTitle?.ko ?? null,
        meta.activeTitle?.en ?? null,
      ]
    );
  },

  async listEarned(userId: string): Promise<Map<string, { earnedAt: string; xpAwarded: number }>> {
    const pool = getPool();
    const map = new Map<string, { earnedAt: string; xpAwarded: number }>();
    if (!pool) return map;
    const result = await pool.query<{
      achievement_id: string;
      earned_at: Date;
      xp_awarded: number;
    }>(
      `SELECT achievement_id, earned_at, xp_awarded
       FROM user_achievements WHERE user_id = $1`,
      [userId]
    );
    for (const row of result.rows) {
      map.set(row.achievement_id, {
        earnedAt: row.earned_at.toISOString(),
        xpAwarded: row.xp_awarded,
      });
    }
    return map;
  },

  /** Achievement IDs awarded but not yet shown in the unlock popup. */
  async listUnnotified(userId: string): Promise<string[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query<{ achievement_id: string }>(
      `SELECT achievement_id
       FROM user_achievements
       WHERE user_id = $1 AND notified_at IS NULL
       ORDER BY earned_at ASC`,
      [userId]
    );
    return result.rows.map((row) => row.achievement_id);
  },

  async markNotified(userId: string, achievementIds: string[]): Promise<void> {
    const pool = getPool();
    if (!pool || achievementIds.length === 0) return;
    await pool.query(
      `UPDATE user_achievements
       SET notified_at = NOW()
       WHERE user_id = $1
         AND achievement_id = ANY($2::text[])
         AND notified_at IS NULL`,
      [userId, achievementIds]
    );
  },

  async awardMany(
    userId: string,
    awards: Array<{ achievementId: string; xp: number }>
  ): Promise<string[]> {
    const pool = getPool();
    if (!pool || awards.length === 0) return [];

    const achievementIds = awards.map((a) => a.achievementId);
    const xpValues = awards.map((a) => a.xp);
    // notified_at stays NULL so GET /achievements can surface the unlock popup.
    const result = await pool.query<{ achievement_id: string }>(
      `INSERT INTO user_achievements (user_id, achievement_id, xp_awarded, notified_at)
       SELECT $1, x.achievement_id, x.xp, NULL
       FROM UNNEST($2::text[], $3::int[]) AS x(achievement_id, xp)
       ON CONFLICT (user_id, achievement_id) DO NOTHING
       RETURNING achievement_id`,
      [userId, achievementIds, xpValues]
    );
    const inserted = result.rows.map((r) => r.achievement_id);
    if (inserted.length) {
      await pool.query(
        `INSERT INTO achievement_unlock_counts (achievement_id, unlock_count, updated_at)
         SELECT x.achievement_id, 1, NOW()
         FROM UNNEST($1::text[]) AS x(achievement_id)
         ON CONFLICT (achievement_id) DO UPDATE SET
           unlock_count = achievement_unlock_counts.unlock_count + 1,
           updated_at = NOW()`,
        [inserted]
      );
    }
    return inserted;
  },

  async getUnlockCounts(): Promise<Map<string, number>> {
    const pool = getPool();
    const map = new Map<string, number>();
    if (!pool) return map;
    const result = await pool.query<{ achievement_id: string; unlock_count: number }>(
      `SELECT achievement_id, unlock_count FROM achievement_unlock_counts`
    );
    for (const row of result.rows) map.set(row.achievement_id, row.unlock_count);
    return map;
  },

  async countActiveUsers(): Promise<number> {
    const pool = getPool();
    if (!pool) return 1;
    const result = await pool.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM users WHERE is_active = TRUE`
    );
    return Math.max(1, parseInt(result.rows[0]?.c ?? '1', 10) || 1);
  },

  async listTopByXp(limit: number): Promise<
    Array<{
      userId: string;
      displayName: string;
      totalXp: number;
      level: number;
      completed: number;
      activeTitle: LocalizedText | null;
    }>
  > {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query<{
      user_id: string;
      display_name: string;
      total_xp: number;
      level: number;
      completed: string;
      active_title_ko: string | null;
      active_title_en: string | null;
    }>(
      `SELECT s.user_id, u.display_name, s.total_xp, s.level,
              COALESCE(a.completed, 0)::text AS completed,
              s.active_title_ko, s.active_title_en
       FROM user_achievement_stats s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN (
         SELECT user_id, COUNT(*)::int AS completed
         FROM user_achievements
         GROUP BY user_id
       ) a ON a.user_id = s.user_id
       WHERE u.is_active = TRUE
       ORDER BY s.total_xp DESC, a.completed DESC NULLS LAST
       LIMIT $1`,
      [limit]
    );
    return result.rows.map((r) => ({
      userId: r.user_id,
      displayName: r.display_name,
      totalXp: r.total_xp,
      level: r.level,
      completed: parseInt(r.completed, 10) || 0,
      activeTitle:
        r.active_title_ko || r.active_title_en
          ? { ko: r.active_title_ko ?? '', en: r.active_title_en ?? '' }
          : null,
    }));
  },

  /** 1-based rank by XP among active users (avoids loading the full leaderboard). */
  async rankByXp(totalXp: number): Promise<number> {
    const pool = getPool();
    if (!pool) return 1;
    const result = await pool.query<{ rank: string }>(
      `SELECT (COUNT(*)::int + 1)::text AS rank
       FROM user_achievement_stats s
       JOIN users u ON u.id = s.user_id
       WHERE u.is_active = TRUE AND s.total_xp > $1`,
      [totalXp]
    );
    return parseInt(result.rows[0]?.rank ?? '1', 10) || 1;
  },

  /**
   * Rebuild achievement counters from workout_logs in one pass.
   * Uses Asia/Seoul for time-of-day buckets.
   */
  async computeStatsFromLogs(
    userId: string,
    options?: { gymId?: string; memberId?: string }
  ): Promise<AchievementUserStats> {
    const pool = getPool();
    if (!pool) return emptyAchievementStats();

    const scoped = Boolean(options?.gymId && options?.memberId);
    const scopeParams: unknown[] = scoped ? [options!.gymId, options!.memberId] : [];
    const scopeFilter = scoped
      ? ` AND wl.gym_id = $2 AND wl.member_id = $3`
      : '';
    // For queries that use $1 = userId only: gym=$2 member=$3
    const scopeFilterBare = scoped
      ? ` AND gym_id = $2 AND member_id = $3`
      : '';

    const aggParams: unknown[] = [userId, ...scopeParams];
    const [agg, datesResult, prCount] = await Promise.all([
      pool.query<{
        workout_count: string;
        session_days: string;
        total_volume_kg: string;
        unique_machines: string;
        unique_brands: string;
        unique_gyms: string;
        dawn_workouts: string;
        morning_workouts: string;
        afternoon_workouts: string;
        evening_workouts: string;
        night_workouts: string;
        chest_workouts: string;
        back_workouts: string;
        legs_workouts: string;
        shoulders_workouts: string;
        arms_workouts: string;
        core_workouts: string;
        holiday_workouts: string;
        new_year_workouts: string;
        christmas_workouts: string;
        halloween_workouts: string;
        summer_2026_workouts: string;
        winter_2026_workouts: string;
        leg_day_workouts: string;
        bench_workouts: string;
        squat_workouts: string;
      }>(
        `WITH logs AS (
           SELECT
             wl.log_date,
             wl.machine_id,
             wl.gym_id,
             wl.target_muscle_group,
             wl.set_weights_kg,
             wl.created_at,
             wl.updated_at,
             m.code AS machine_code,
             b.code AS brand_code,
             COALESCE(vol.kg, 0) AS volume_kg,
             EXTRACT(HOUR FROM COALESCE(wl.created_at, wl.updated_at) AT TIME ZONE 'Asia/Seoul')::int AS hour_kst
           FROM workout_logs wl
           JOIN machines m ON m.id = wl.machine_id
           LEFT JOIN brands b ON b.id = m.brand_id
           ${SQL_LOG_VOLUME_LATERAL}
           WHERE wl.user_id = $1${scopeFilter}
         )
         SELECT
           COUNT(*)::text AS workout_count,
           COUNT(DISTINCT log_date)::text AS session_days,
           COALESCE(SUM(volume_kg), 0)::text AS total_volume_kg,
           COUNT(DISTINCT machine_id)::text AS unique_machines,
           COUNT(DISTINCT brand_code)::text AS unique_brands,
           COUNT(DISTINCT gym_id)::text AS unique_gyms,
           COUNT(*) FILTER (WHERE hour_kst >= 5 AND hour_kst < 7)::text AS dawn_workouts,
           COUNT(*) FILTER (WHERE hour_kst >= 7 AND hour_kst < 11)::text AS morning_workouts,
           COUNT(*) FILTER (WHERE hour_kst >= 11 AND hour_kst < 17)::text AS afternoon_workouts,
           COUNT(*) FILTER (WHERE hour_kst >= 17 AND hour_kst < 21)::text AS evening_workouts,
           COUNT(*) FILTER (WHERE hour_kst >= 21 OR hour_kst < 5)::text AS night_workouts,
           COUNT(*) FILTER (WHERE target_muscle_group = 'chest' OR machine_code ILIKE '%chest%' OR machine_code ILIKE '%bench%')::text AS chest_workouts,
           COUNT(*) FILTER (WHERE target_muscle_group = 'back' OR machine_code ILIKE '%lat%' OR machine_code ILIKE '%row%' OR machine_code ILIKE '%pulldown%')::text AS back_workouts,
           COUNT(*) FILTER (WHERE target_muscle_group IN ('legs','quads','hamstrings','glutes','calves') OR machine_code ILIKE '%leg%' OR machine_code ILIKE '%squat%' OR machine_code ILIKE '%press%')::text AS legs_workouts,
           COUNT(*) FILTER (WHERE target_muscle_group = 'shoulders' OR machine_code ILIKE '%shoulder%' OR machine_code ILIKE '%delt%')::text AS shoulders_workouts,
           COUNT(*) FILTER (WHERE target_muscle_group IN ('arms','biceps','triceps') OR machine_code ILIKE '%bicep%' OR machine_code ILIKE '%tricep%' OR machine_code ILIKE '%curl%')::text AS arms_workouts,
           COUNT(*) FILTER (WHERE target_muscle_group IN ('core','abs') OR machine_code ILIKE '%ab%' OR machine_code ILIKE '%core%')::text AS core_workouts,
           COUNT(*) FILTER (
             WHERE (EXTRACT(MONTH FROM log_date), EXTRACT(DAY FROM log_date)) IN ((1,1),(3,1),(5,5),(8,15),(10,3),(10,9),(12,25),(12,31))
           )::text AS holiday_workouts,
           COUNT(*) FILTER (WHERE EXTRACT(MONTH FROM log_date) = 1 AND EXTRACT(DAY FROM log_date) = 1)::text AS new_year_workouts,
           COUNT(*) FILTER (WHERE EXTRACT(MONTH FROM log_date) = 12 AND EXTRACT(DAY FROM log_date) = 25)::text AS christmas_workouts,
           COUNT(*) FILTER (WHERE EXTRACT(MONTH FROM log_date) = 10 AND EXTRACT(DAY FROM log_date) = 31)::text AS halloween_workouts,
           COUNT(*) FILTER (
             WHERE log_date >= DATE '2026-06-01' AND log_date < DATE '2026-09-01'
           )::text AS summer_2026_workouts,
           COUNT(*) FILTER (
             WHERE (log_date >= DATE '2025-12-01' AND log_date < DATE '2026-03-01')
                OR (log_date >= DATE '2026-12-01' AND log_date < DATE '2027-03-01')
           )::text AS winter_2026_workouts,
           COUNT(*) FILTER (
             WHERE target_muscle_group IN ('legs','quads','hamstrings','glutes','calves')
                OR machine_code ILIKE '%leg%' OR machine_code ILIKE '%squat%'
           )::text AS leg_day_workouts,
           COUNT(*) FILTER (WHERE machine_code ILIKE '%bench%')::text AS bench_workouts,
           COUNT(*) FILTER (WHERE machine_code ILIKE '%squat%')::text AS squat_workouts
         FROM logs`,
        aggParams
      ),
      pool.query<{ log_date: string }>(
        `SELECT DISTINCT log_date::text AS log_date
         FROM workout_logs
         WHERE user_id = $1${scopeFilterBare}
         ORDER BY log_date ASC`,
        [userId, ...scopeParams]
      ),
      computePrCount(pool, userId, options),
    ]);

    const totalVolumeKg = parseFloat(agg.rows[0]?.total_volume_kg ?? '0') || 0;
    const row = agg.rows[0];
    const n = (v: string | undefined) => parseInt(v ?? '0', 10) || 0;
    const dates = datesResult.rows.map((r) => r.log_date);
    const { currentStreak, longestStreak } = computeStreaks(dates);

    const chest = n(row?.chest_workouts);
    const back = n(row?.back_workouts);
    const legs = n(row?.legs_workouts);
    const shoulders = n(row?.shoulders_workouts);
    const arms = n(row?.arms_workouts);
    const core = n(row?.core_workouts);
    const upper = chest + back + shoulders + arms;
    const lower = legs;
    const muscleTotal = upper + lower + core;
    const upperRatioPct = muscleTotal > 0 ? Math.round((upper / muscleTotal) * 1000) / 10 : 0;
    const lowerRatioPct = muscleTotal > 0 ? Math.round((lower / muscleTotal) * 1000) / 10 : 0;
    const balanceScore =
      muscleTotal > 0
        ? Math.max(0, Math.round(100 - Math.abs(upperRatioPct - (100 - upperRatioPct)) * 1.2))
        : 0;
    // Better balance: closeness of upper vs lower around 50/50 of upper+lower
    const ul = upper + lower;
    const balance =
      ul > 0
        ? Math.max(0, Math.round((1 - Math.abs(upper / ul - 0.5) * 2) * 1000) / 10)
        : 0;

    return {
      totalVolumeKg,
      workoutCount: n(row?.workout_count),
      sessionDays: n(row?.session_days),
      currentStreak,
      longestStreak,
      uniqueMachines: n(row?.unique_machines),
      uniqueBrands: n(row?.unique_brands),
      uniqueGyms: n(row?.unique_gyms),
      prCount,
      dawnWorkouts: n(row?.dawn_workouts),
      morningWorkouts: n(row?.morning_workouts),
      afternoonWorkouts: n(row?.afternoon_workouts),
      eveningWorkouts: n(row?.evening_workouts),
      nightWorkouts: n(row?.night_workouts),
      chestWorkouts: chest,
      backWorkouts: back,
      legsWorkouts: legs,
      shouldersWorkouts: shoulders,
      armsWorkouts: arms,
      coreWorkouts: core,
      holidayWorkouts: n(row?.holiday_workouts),
      newYearWorkouts: n(row?.new_year_workouts),
      christmasWorkouts: n(row?.christmas_workouts),
      halloweenWorkouts: n(row?.halloween_workouts),
      summer2026Workouts: n(row?.summer_2026_workouts),
      winter2026Workouts: n(row?.winter_2026_workouts),
      legDayWorkouts: n(row?.leg_day_workouts),
      benchWorkouts: n(row?.bench_workouts),
      squatWorkouts: n(row?.squat_workouts),
      upperRatioPct,
      lowerRatioPct,
      balanceScore: balance || balanceScore,
    };
  },
};

function computeStreaks(datesAsc: string[]): { currentStreak: number; longestStreak: number } {
  if (!datesAsc.length) return { currentStreak: 0, longestStreak: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < datesAsc.length; i += 1) {
    const prev = new Date(`${datesAsc[i - 1]}T00:00:00Z`);
    const cur = new Date(`${datesAsc[i]}T00:00:00Z`);
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
    if (diff === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else if (diff > 1) {
      run = 1;
    }
  }

  const todayKey = seoulDateKey();
  // Prefer KST "today" so streak doesn't drop overnight for Korea users.
  const last = datesAsc[datesAsc.length - 1]!;
  const lastDate = new Date(`${last}T00:00:00Z`);
  const todayDate = new Date(`${todayKey}T00:00:00Z`);
  const gap = Math.round((todayDate.getTime() - lastDate.getTime()) / 86_400_000);
  let current = 0;
  if (gap <= 1) {
    current = 1;
    for (let i = datesAsc.length - 1; i > 0; i -= 1) {
      const a = new Date(`${datesAsc[i - 1]}T00:00:00Z`);
      const b = new Date(`${datesAsc[i]}T00:00:00Z`);
      const d = Math.round((b.getTime() - a.getTime()) / 86_400_000);
      if (d === 1) current += 1;
      else break;
    }
  }

  return { currentStreak: current, longestStreak: Math.max(longest, current) };
}

async function computePrCount(
  pool: NonNullable<ReturnType<typeof getPool>>,
  userId: string,
  options?: { gymId?: string; memberId?: string }
): Promise<number> {
  const scoped = Boolean(options?.gymId && options?.memberId);
  const params: unknown[] = [userId];
  let filters = '';
  if (scoped) {
    params.push(options!.gymId, options!.memberId);
    filters = ' AND gym_id = $2 AND member_id = $3';
  }

  const result = await pool.query<{
    machine_id: string;
    log_date: string;
    max_w: string;
  }>(
    `SELECT machine_id, log_date::text AS log_date,
            COALESCE((
              SELECT MAX(value::numeric)
              FROM jsonb_array_elements_text(set_weights_kg) AS t(value)
            ), 0)::text AS max_w
     FROM workout_logs
     WHERE user_id = $1${filters}
     ORDER BY machine_id, log_date ASC, created_at ASC`,
    params
  );

  let prs = 0;
  const best = new Map<string, number>();
  for (const row of result.rows) {
    const w = parseFloat(row.max_w) || 0;
    if (w <= 0) continue;
    const prev = best.get(row.machine_id) ?? 0;
    if (w > prev) {
      prs += 1;
      best.set(row.machine_id, w);
    }
  }
  return prs;
}
