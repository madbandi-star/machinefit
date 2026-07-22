import type {
  GrowthTimelineLogInput,
  GrowthTimelinePeerAverages,
  GrowthTimelineSnapshot,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';

const LOG_LIMIT = 1500;
const PEER_AVERAGES_TTL_MS = 10 * 60_000;
let peerAveragesCache:
  | { expiresAt: number; value: GrowthTimelinePeerAverages }
  | null = null;

type LogRow = {
  id: string;
  log_date: string;
  set_count: number;
  set_weights_kg: number[] | string;
  created_at: string;
  machine_code: string;
  machine_name: Record<string, string> | string;
  brand_code: string | null;
  brand_name: Record<string, string> | string | null;
  muscle_group: string | null;
  target_muscle_group: string | null;
  gym_id: string | null;
  gym_name: string | null;
};

function parseWeights(raw: number[] | string): number[] {
  if (Array.isArray(raw)) return raw.map(Number).filter((n) => Number.isFinite(n));
  try {
    const parsed = JSON.parse(String(raw)) as unknown;
    if (Array.isArray(parsed)) return parsed.map(Number).filter((n) => Number.isFinite(n));
  } catch {
    /* ignore */
  }
  return [];
}

function pickName(
  name: Record<string, string> | string | null | undefined,
  fallback: string,
  locale: string
): string {
  if (!name) return fallback;
  if (typeof name === 'object') {
    return locale.startsWith('ko')
      ? name.ko || name.en || fallback
      : name.en || name.ko || fallback;
  }
  return String(name);
}

export const growthTimelineRepository = {
  async loadLogs(
    userId: string,
    locale = 'ko',
    options?: { gymId?: string; memberId?: string }
  ): Promise<GrowthTimelineLogInput[]> {
    const pool = getPool();
    if (!pool) return [];

    const params: unknown[] = [userId];
    let filters = '';
    if (options?.gymId && options?.memberId) {
      params.push(options.gymId, options.memberId);
      filters = ` AND wl.gym_id = $2 AND wl.member_id = $3`;
    }
    params.push(LOG_LIMIT);
    const limitIdx = params.length;

    const result = await pool.query<LogRow>(
      `SELECT wl.id::text,
              wl.log_date::text,
              wl.set_count,
              wl.set_weights_kg,
              wl.created_at::text,
              m.code AS machine_code,
              m.name AS machine_name,
              b.code AS brand_code,
              b.name AS brand_name,
              m.muscle_group,
              NULLIF(wl.target_muscle_group, '') AS target_muscle_group,
              wl.gym_id::text AS gym_id,
              ug.name AS gym_name
       FROM workout_logs wl
       JOIN machines m ON m.id = wl.machine_id
       LEFT JOIN brands b ON b.id = m.brand_id
       LEFT JOIN user_gyms ug ON ug.id = wl.gym_id
       WHERE wl.user_id = $1${filters}
       ORDER BY wl.log_date ASC, wl.created_at ASC
       LIMIT $${limitIdx}`,
      params
    );

    return result.rows.map((row) => ({
      id: row.id,
      logDate: row.log_date,
      setCount: row.set_count,
      setWeightsKg: parseWeights(row.set_weights_kg),
      createdAt: row.created_at,
      machineCode: row.machine_code,
      machineName: pickName(row.machine_name, row.machine_code, locale),
      brandCode: row.brand_code,
      brandName: row.brand_name
        ? pickName(row.brand_name, row.brand_code || '', locale)
        : row.brand_code,
      muscleGroup: row.target_muscle_group || row.muscle_group,
      gymId: row.gym_id,
      gymName: row.gym_name,
    }));
  },

  async peerAverages(): Promise<GrowthTimelinePeerAverages> {
    if (peerAveragesCache && peerAveragesCache.expiresAt > Date.now()) {
      return peerAveragesCache.value;
    }

    const pool = getPool();
    if (!pool) {
      return { sessionsPerWeek: 2.4, volumeKg: 12_000, consistencyScore: 55 };
    }
    // Cached globally — full aggregate is expensive and peers change slowly.
    const result = await pool.query<{
      avg_sessions: string;
      avg_volume: string;
    }>(
      `WITH user_days AS (
         SELECT user_id,
                COUNT(DISTINCT log_date)::numeric AS session_days,
                COALESCE(SUM(
                  (SELECT SUM(value::numeric) FROM jsonb_array_elements_text(set_weights_kg) t(value))
                ), 0) AS volume_kg,
                GREATEST(
                  1,
                  (MAX(log_date) - MIN(log_date)) + 1
                )::numeric AS span_days
         FROM workout_logs
         GROUP BY user_id
       )
       SELECT
         COALESCE(AVG(session_days / (span_days / 7.0)), 2.4)::text AS avg_sessions,
         COALESCE(AVG(volume_kg / GREATEST(1, span_days / 30.0)), 12000)::text AS avg_volume
       FROM user_days`
    );
    const value = {
      sessionsPerWeek: parseFloat(result.rows[0]?.avg_sessions ?? '2.4') || 2.4,
      volumeKg: parseFloat(result.rows[0]?.avg_volume ?? '12000') || 12_000,
      consistencyScore: 55,
    };
    peerAveragesCache = { expiresAt: Date.now() + PEER_AVERAGES_TTL_MS, value };
    return value;
  },

  async getCached(
    userId: string
  ): Promise<{
    snapshot: GrowthTimelineSnapshot;
    logCount: number;
    logsRevision: string;
    updatedAt: Date;
  } | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<{
      snapshot_json: GrowthTimelineSnapshot;
      log_count: number;
      logs_revision: string | null;
      updated_at: Date;
    }>(
      `SELECT snapshot_json, log_count, logs_revision, updated_at
       FROM user_growth_timeline WHERE user_id = $1`,
      [userId]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      snapshot: row.snapshot_json,
      logCount: row.log_count,
      logsRevision: row.logs_revision ?? '',
      updatedAt: row.updated_at,
    };
  },

  async upsertCache(
    userId: string,
    snapshot: GrowthTimelineSnapshot,
    logCount: number,
    logsRevision: string
  ): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `INSERT INTO user_growth_timeline (user_id, snapshot_json, log_count, logs_revision, updated_at)
       VALUES ($1, $2::jsonb, $3, $4, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         snapshot_json = EXCLUDED.snapshot_json,
         log_count = EXCLUDED.log_count,
         logs_revision = EXCLUDED.logs_revision,
         updated_at = NOW()`,
      [userId, JSON.stringify(snapshot), logCount, logsRevision]
    );
  },

  /** Cheap fingerprint so edits with the same log count still invalidate cache. */
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

  async countLogs(
    userId: string,
    options?: { gymId?: string; memberId?: string }
  ): Promise<number> {
    const pool = getPool();
    if (!pool) return 0;
    const params: unknown[] = [userId];
    let filters = '';
    if (options?.gymId && options?.memberId) {
      params.push(options.gymId, options.memberId);
      filters = ' AND gym_id = $2 AND member_id = $3';
    }
    const result = await pool.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM workout_logs WHERE user_id = $1${filters}`,
      params
    );
    return parseInt(result.rows[0]?.c ?? '0', 10) || 0;
  },
};
