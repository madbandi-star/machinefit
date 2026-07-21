import { getPool } from '../config/database.js';
import type { LifterDnaRawStats, PeerBaseline } from '@machinefit/shared';

const LOG_LIMIT = 500;

const UPPER = new Set([
  'chest',
  'back',
  'shoulders',
  'arms',
  'biceps',
  'triceps',
]);
const LOWER = new Set(['legs']);
const PUSH = new Set(['chest', 'shoulders', 'triceps']);
const PULL = new Set(['back', 'biceps', 'arms']);

function hourBucket(hour: number): 'dawn' | 'day' | 'night' {
  if (hour >= 5 && hour < 9) return 'dawn';
  if (hour >= 18 || hour < 5) return 'night';
  return 'day';
}

function hourLabel(bucket: 'dawn' | 'day' | 'night', hour: number): string {
  if (bucket === 'dawn') return '05:00~09:00';
  if (bucket === 'night') {
    if (hour >= 20) return '20:00~22:00';
    if (hour >= 18) return '18:00~20:00';
    return '22:00~05:00';
  }
  return '09:00~18:00';
}

interface LogRow {
  id: string;
  log_date: string;
  set_count: number;
  set_weights_kg: number[] | string;
  created_at: string;
  updated_at: string;
  machine_code: string;
  machine_name: Record<string, string> | string;
  brand_code: string | null;
  brand_name: Record<string, string> | string | null;
  muscle_group: string | null;
  target_muscle_group: string | null;
}

function parseWeights(raw: number[] | string): number[] {
  if (Array.isArray(raw)) return raw.map(Number).filter((n) => Number.isFinite(n));
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.map(Number).filter((n) => Number.isFinite(n));
  } catch {
    /* ignore */
  }
  return [];
}

function machineNameOf(row: LogRow, locale: string): string {
  if (typeof row.machine_name === 'object' && row.machine_name) {
    return locale.startsWith('ko')
      ? row.machine_name.ko || row.machine_name.en || row.machine_code
      : row.machine_name.en || row.machine_name.ko || row.machine_code;
  }
  return String(row.machine_name || row.machine_code);
}

function brandNameOf(row: LogRow, locale: string): string | null {
  if (!row.brand_name) return row.brand_code;
  if (typeof row.brand_name === 'object') {
    return locale.startsWith('ko')
      ? row.brand_name.ko || row.brand_name.en || row.brand_code
      : row.brand_name.en || row.brand_name.ko || row.brand_code;
  }
  return String(row.brand_name);
}

function muscleOf(row: LogRow): string | null {
  return row.target_muscle_group || row.muscle_group || null;
}

function emptyPeers(): PeerBaseline {
  return {
    intensity: 55,
    consistency: 55,
    volume: 800,
    lowerRatio: 0.35,
    prRate: 0.12,
    avgSessionMinutes: 60,
  };
}

export const lifterDnaRepository = {
  async loadUserLogs(userId: string, locale = 'ko'): Promise<LogRow[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query<LogRow>(
      `SELECT wl.id::text,
              wl.log_date::text,
              wl.set_count,
              wl.set_weights_kg,
              wl.created_at::text,
              wl.updated_at::text,
              m.code AS machine_code,
              m.name AS machine_name,
              b.code AS brand_code,
              b.name AS brand_name,
              m.muscle_group,
              NULLIF(wl.target_muscle_group, '') AS target_muscle_group
       FROM workout_logs wl
       JOIN machines m ON m.id = wl.machine_id
       LEFT JOIN brands b ON b.id = m.brand_id
       WHERE wl.user_id = $1
       ORDER BY wl.log_date DESC, wl.updated_at DESC
       LIMIT $2`,
      [userId, LOG_LIMIT]
    );
    void locale;
    return result.rows;
  },

  async peerBaseline(scope: 'global' | 'gym', gymId?: string): Promise<PeerBaseline> {
    const pool = getPool();
    if (!pool) return emptyPeers();

    const params: unknown[] = [];
    let gymFilter = '';
    if (scope === 'gym' && gymId) {
      params.push(gymId);
      gymFilter = ` AND wl.gym_id = $${params.length}`;
    }

    const result = await pool.query<{
      avg_sets: string;
      avg_volume: string;
      avg_max: string;
      lower_ratio: string;
      session_days: string;
      users: string;
    }>(
      `WITH recent AS (
         SELECT wl.user_id,
                wl.log_date,
                wl.set_count,
                (
                  SELECT COALESCE(SUM(value::numeric),0)
                  FROM jsonb_array_elements_text(wl.set_weights_kg) t(value)
                ) AS volume,
                (
                  SELECT COALESCE(MAX(value::numeric),0)
                  FROM jsonb_array_elements_text(wl.set_weights_kg) t(value)
                ) AS max_w,
                COALESCE(NULLIF(wl.target_muscle_group,''), m.muscle_group) AS muscle
         FROM workout_logs wl
         JOIN machines m ON m.id = wl.machine_id
         WHERE wl.log_date >= CURRENT_DATE - INTERVAL '90 days'
           ${gymFilter}
       ),
       by_user AS (
         SELECT user_id,
                COUNT(DISTINCT log_date)::float AS days,
                AVG(set_count)::float AS avg_sets,
                AVG(volume)::float AS avg_volume,
                AVG(max_w)::float AS avg_max,
                AVG(CASE WHEN muscle = 'legs' THEN 1 ELSE 0 END)::float AS lower_ratio
         FROM recent
         GROUP BY user_id
       )
       SELECT COALESCE(AVG(avg_sets),0)::text AS avg_sets,
              COALESCE(AVG(avg_volume),0)::text AS avg_volume,
              COALESCE(AVG(avg_max),0)::text AS avg_max,
              COALESCE(AVG(lower_ratio),0.35)::text AS lower_ratio,
              COALESCE(AVG(days),0)::text AS session_days,
              COUNT(*)::text AS users
       FROM by_user`,
      params
    );

    const row = result.rows[0];
    const avgSets = parseFloat(row?.avg_sets ?? '0') || 0;
    const avgVolume = parseFloat(row?.avg_volume ?? '0') || 0;
    const avgMax = parseFloat(row?.avg_max ?? '0') || 0;
    const lowerRatio = parseFloat(row?.lower_ratio ?? '0.35') || 0.35;
    const days = parseFloat(row?.session_days ?? '0') || 0;

    return {
      intensity: Math.min(100, avgMax * 0.35 + avgSets * 2),
      consistency: Math.min(100, days * 4),
      volume: Math.max(100, avgVolume),
      lowerRatio,
      prRate: 0.12,
      avgSessionMinutes: Math.max(30, Math.round(avgSets * 2.6)),
    };
  },

  computeStats(rows: LogRow[], locale: string, peers?: LifterDnaRawStats['peers']): LifterDnaRawStats {
    if (!rows.length) {
      return {
        analyzedLogs: 0,
        sessionDays: 0,
        totalSets: 0,
        totalVolumeKg: 0,
        avgWeightKg: 0,
        maxWeightKg: 0,
        avgSetsPerDay: 0,
        avgSessionsPerWeek: 0,
        avgRestDays: 2,
        machineCount: 0,
        topMachineCode: null,
        topMachineName: null,
        longestMachineCode: null,
        longestMachineName: null,
        topBrandCode: null,
        topBrandName: null,
        topMuscle: null,
        topWeekday: null,
        topHourBucket: null,
        topHourLabel: null,
        upperRatio: 0.5,
        lowerRatio: 0.5,
        pushRatio: 0.5,
        pullRatio: 0.5,
        growthRate: 0,
        prEvents: 0,
        prRate: 0,
        loyaltyRate: 0,
        varietyScore: 20,
        intensityScore: 20,
        powerScore: 20,
        enduranceScore: 20,
        consistencyScore: 20,
        balanceScore: 50,
        challengeScore: 20,
        explosivenessScore: 20,
        peers,
      };
    }

    const dayMap = new Map<string, { sets: number; volume: number }>();
    const machineCount = new Map<string, { count: number; name: string }>();
    const brandCount = new Map<string, { count: number; name: string }>();
    const muscleCount = new Map<string, number>();
    const weekdayCount = new Map<number, number>();
    const hourCount = new Map<number, number>();
    const machineMax = new Map<string, number>();
    let prEvents = 0;
    let totalSets = 0;
    let totalVolume = 0;
    let weightSum = 0;
    let weightN = 0;
    let maxWeight = 0;
    let upper = 0;
    let lower = 0;
    let push = 0;
    let pull = 0;

    // Process oldest→newest for PR detection
    const chronological = [...rows].reverse();
    for (const row of chronological) {
      const weights = parseWeights(row.set_weights_kg);
      const setCount = row.set_count || weights.length || 0;
      const volume = weights.reduce((a, b) => a + b, 0);
      const maxW = weights.length ? Math.max(...weights) : 0;
      totalSets += setCount;
      totalVolume += volume;
      for (const w of weights) {
        weightSum += w;
        weightN += 1;
        if (w > maxWeight) maxWeight = w;
      }

      const day = row.log_date.slice(0, 10);
      const dayAgg = dayMap.get(day) ?? { sets: 0, volume: 0 };
      dayAgg.sets += setCount;
      dayAgg.volume += volume;
      dayMap.set(day, dayAgg);

      const mName = machineNameOf(row, locale);
      const mPrev = machineCount.get(row.machine_code) ?? { count: 0, name: mName };
      mPrev.count += 1;
      machineCount.set(row.machine_code, mPrev);

      if (row.brand_code) {
        const bName = brandNameOf(row, locale) ?? row.brand_code;
        const bPrev = brandCount.get(row.brand_code) ?? { count: 0, name: bName };
        bPrev.count += 1;
        brandCount.set(row.brand_code, bPrev);
      }

      const muscle = muscleOf(row);
      if (muscle) {
        muscleCount.set(muscle, (muscleCount.get(muscle) ?? 0) + setCount);
        if (UPPER.has(muscle)) upper += setCount;
        if (LOWER.has(muscle)) lower += setCount;
        if (PUSH.has(muscle)) push += setCount;
        if (PULL.has(muscle)) pull += setCount;
      }

      const d = new Date(`${day}T12:00:00Z`);
      const wd = d.getUTCDay();
      weekdayCount.set(wd, (weekdayCount.get(wd) ?? 0) + 1);

      const hour = new Date(row.updated_at || row.created_at).getHours();
      hourCount.set(hour, (hourCount.get(hour) ?? 0) + 1);

      const prevMax = machineMax.get(row.machine_code) ?? 0;
      if (maxW > prevMax + 0.5) {
        if (prevMax > 0) prEvents += 1;
        machineMax.set(row.machine_code, maxW);
      } else if (maxW > prevMax) {
        machineMax.set(row.machine_code, maxW);
      }
    }

    const sessionDays = dayMap.size;
    const daysSorted = [...dayMap.keys()].sort();
    let restGaps = 0;
    let restCount = 0;
    for (let i = 1; i < daysSorted.length; i += 1) {
      const prev = new Date(`${daysSorted[i - 1]}T00:00:00Z`).getTime();
      const cur = new Date(`${daysSorted[i]}T00:00:00Z`).getTime();
      const gap = Math.round((cur - prev) / 86_400_000) - 1;
      if (gap >= 0) {
        restGaps += gap;
        restCount += 1;
      }
    }
    const avgRestDays = restCount > 0 ? restGaps / restCount : 2;

    const spanDays = Math.max(
      7,
      (new Date(`${daysSorted[daysSorted.length - 1]}T00:00:00Z`).getTime() -
        new Date(`${daysSorted[0]}T00:00:00Z`).getTime()) /
        86_400_000 +
        1
    );
    const avgSessionsPerWeek = (sessionDays / spanDays) * 7;
    const avgSetsPerDay = totalSets / Math.max(1, sessionDays);

    const half = Math.floor(daysSorted.length / 2) || 1;
    const olderDays = daysSorted.slice(0, half);
    const newerDays = daysSorted.slice(half);
    const olderVol =
      olderDays.reduce((s, d) => s + (dayMap.get(d)?.volume ?? 0), 0) / Math.max(1, olderDays.length);
    const newerVol =
      newerDays.reduce((s, d) => s + (dayMap.get(d)?.volume ?? 0), 0) / Math.max(1, newerDays.length);
    const growthRate = olderVol > 0 ? (newerVol - olderVol) / olderVol : newerVol > 0 ? 0.2 : 0;

    const topMachine = [...machineCount.entries()].sort((a, b) => b[1].count - a[1].count)[0];
    const topBrand = [...brandCount.entries()].sort((a, b) => b[1].count - a[1].count)[0];
    const topMuscle = [...muscleCount.entries()].sort((a, b) => b[1] - a[1])[0];
    const topWeekday = [...weekdayCount.entries()].sort((a, b) => b[1] - a[1])[0];
    const topHour = [...hourCount.entries()].sort((a, b) => b[1] - a[1])[0];
    const bucket = topHour ? hourBucket(topHour[0]) : null;

    const muscleTotal = upper + lower || 1;
    const pushPullTotal = push + pull || 1;
    const upperRatio = upper / muscleTotal;
    const lowerRatio = lower / muscleTotal;
    const pushRatio = push / pushPullTotal;
    const pullRatio = pull / pushPullTotal;

    const loyaltyRate = topMachine ? topMachine[1].count / rows.length : 0;
    const varietyScore = Math.min(100, (machineCount.size / Math.max(8, rows.length / 20)) * 70);
    const avgWeight = weightN > 0 ? weightSum / weightN : 0;
    const powerScore = Math.min(100, avgWeight * 0.45 + maxWeight * 0.25);
    const intensityScore = Math.min(100, avgSetsPerDay * 2.2 + avgWeight * 0.2);
    const enduranceScore = Math.min(100, avgSetsPerDay * 2.8 + rows.length * 0.05);
    const consistencyScore = Math.min(100, avgSessionsPerWeek * 18 + (avgRestDays >= 1 && avgRestDays <= 3 ? 15 : 0));
    const balanceScore = Math.min(
      100,
      100 - Math.abs(upperRatio - 0.5) * 120 - Math.abs(pushRatio - 0.5) * 80
    );
    const prRate = sessionDays > 0 ? prEvents / sessionDays : 0;
    const challengeScore = Math.min(100, prRate * 220 + Math.max(0, growthRate) * 80);
    const explosivenessScore = Math.min(100, maxWeight * 0.35 + prRate * 150);

    return {
      analyzedLogs: rows.length,
      sessionDays,
      totalSets,
      totalVolumeKg: totalVolume,
      avgWeightKg: avgWeight,
      maxWeightKg: maxWeight,
      avgSetsPerDay,
      avgSessionsPerWeek,
      avgRestDays,
      machineCount: machineCount.size,
      topMachineCode: topMachine?.[0] ?? null,
      topMachineName: topMachine?.[1].name ?? null,
      longestMachineCode: topMachine?.[0] ?? null,
      longestMachineName: topMachine?.[1].name ?? null,
      topBrandCode: topBrand?.[0] ?? null,
      topBrandName: topBrand?.[1].name ?? null,
      topMuscle: topMuscle?.[0] ?? null,
      topWeekday: topWeekday?.[0] ?? null,
      topHourBucket: bucket,
      topHourLabel: topHour && bucket ? hourLabel(bucket, topHour[0]) : null,
      upperRatio,
      lowerRatio,
      pushRatio,
      pullRatio,
      growthRate,
      prEvents,
      prRate,
      loyaltyRate,
      varietyScore,
      intensityScore,
      powerScore,
      enduranceScore,
      consistencyScore,
      balanceScore,
      challengeScore,
      explosivenessScore,
      peers,
    };
  },
};
