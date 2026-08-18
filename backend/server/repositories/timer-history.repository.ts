import type {
  Locale,
  TimerHistoryDayResponse,
  TimerHistoryLap,
  TimerHistoryLapExercise,
  TimerHistoryMonthDays,
  TimerHistorySessionDetail,
  TimerHistorySessionSummary,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { pickLocalized } from '../utils/localize.util.js';

interface SessionRow {
  id: string;
  gym_id: string | null;
  member_id: string | null;
  session_date: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  lap_count: number;
}

interface MonthAggRow {
  session_date: string;
  session_count: string | number;
  total_duration_seconds: string | number;
  lap_count: string | number;
}

interface LapRow {
  id: string;
  lap_number: number;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
}

interface ExerciseRow {
  id: string;
  timer_lap_id: string;
  workout_log_id: string | null;
  machine_id: string | null;
  machine_code: string | null;
  machine_name_snapshot: string | null;
  recorded_at: string | null;
  machine_name_json: Record<string, string> | null;
  set_count: number | null;
  set_weights_kg: number[] | null;
}

export interface TimerHistoryInsertLapExercise {
  workoutLogId: string | null;
  machineId: string | null;
  machineCode: string | null;
  machineNameSnapshot: string | null;
  recordedAt: string | null;
}

export interface TimerHistoryInsertLap {
  lapNumber: number;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  exercises: TimerHistoryInsertLapExercise[];
}

export interface TimerHistoryInsertSession {
  userId: string;
  clientSessionId: string;
  gymId: string | null;
  memberId: string | null;
  sessionDate: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  laps: TimerHistoryInsertLap[];
}

function formatDate(value: string | Date): string {
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    return value.slice(0, 10);
  }
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, '0');
  const d = String(value.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toIso(value: string | Date): string {
  return typeof value === 'string' ? new Date(value).toISOString() : value.toISOString();
}

function mapSessionSummary(row: SessionRow): TimerHistorySessionSummary {
  return {
    id: row.id,
    sessionDate: formatDate(row.session_date),
    startedAt: toIso(row.started_at),
    endedAt: toIso(row.ended_at),
    durationSeconds: Number(row.duration_seconds) || 0,
    lapCount: Number(row.lap_count) || 0,
  };
}

function mapExercise(row: ExerciseRow, locale: Locale): TimerHistoryLapExercise {
  const fromCatalog = row.machine_name_json
    ? pickLocalized(row.machine_name_json, locale)
    : null;
  const name =
    fromCatalog ||
    row.machine_name_snapshot?.trim() ||
    row.machine_code ||
    '';
  return {
    id: row.id,
    workoutLogId: row.workout_log_id,
    machineId: row.machine_id,
    machineCode: row.machine_code,
    machineName: name || '—',
    recordedAt: row.recorded_at ? toIso(row.recorded_at) : null,
    setCount: row.set_count ?? undefined,
    setWeightsKg: row.set_weights_kg ?? undefined,
  };
}

export const timerHistoryRepository = {
  async findIdByClientSession(userId: string, clientSessionId: string): Promise<string | null> {
    const pool = getPool();
    if (!pool) return null;
    const { rows } = await pool.query<{ id: string }>(
      `SELECT id FROM timer_sessions WHERE user_id = $1 AND client_session_id = $2 LIMIT 1`,
      [userId, clientSessionId]
    );
    return rows[0]?.id ?? null;
  },

  async insertSession(input: TimerHistoryInsertSession): Promise<string> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const sessionResult = await client.query<{ id: string }>(
        `INSERT INTO timer_sessions (
           user_id, client_session_id, gym_id, member_id, session_date,
           started_at, ended_at, duration_seconds, lap_count
         ) VALUES ($1, $2, $3, $4, $5::date, $6, $7, $8, $9)
         ON CONFLICT (user_id, client_session_id) DO NOTHING
         RETURNING id`,
        [
          input.userId,
          input.clientSessionId,
          input.gymId,
          input.memberId,
          input.sessionDate,
          input.startedAt,
          input.endedAt,
          input.durationSeconds,
          input.laps.length,
        ]
      );

      let sessionId = sessionResult.rows[0]?.id ?? null;
      if (!sessionId) {
        const existing = await client.query<{ id: string }>(
          `SELECT id FROM timer_sessions WHERE user_id = $1 AND client_session_id = $2 LIMIT 1`,
          [input.userId, input.clientSessionId]
        );
        sessionId = existing.rows[0]?.id ?? null;
        await client.query('COMMIT');
        if (!sessionId) throw new Error('Timer session insert failed');
        return sessionId;
      }

      for (const lap of input.laps) {
        const lapResult = await client.query<{ id: string }>(
          `INSERT INTO timer_laps (
             timer_session_id, lap_number, started_at, ended_at, duration_seconds
           ) VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [sessionId, lap.lapNumber, lap.startedAt, lap.endedAt, lap.durationSeconds]
        );
        const lapId = lapResult.rows[0]?.id;
        if (!lapId || lap.exercises.length === 0) continue;
        for (const ex of lap.exercises) {
          await client.query(
            `INSERT INTO timer_lap_exercises (
               timer_lap_id, workout_log_id, machine_id, machine_code,
               machine_name_snapshot, recorded_at
             ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              lapId,
              ex.workoutLogId,
              ex.machineId,
              ex.machineCode,
              ex.machineNameSnapshot,
              ex.recordedAt,
            ]
          );
        }
      }

      await client.query('COMMIT');
      return sessionId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async listMonthDays(
    userId: string,
    year: number,
    month: number
  ): Promise<TimerHistoryMonthDays> {
    const pool = getPool();
    if (!pool) return {};
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const toMonth = month === 12 ? 1 : month + 1;
    const toYear = month === 12 ? year + 1 : year;
    const to = `${toYear}-${String(toMonth).padStart(2, '0')}-01`;
    const { rows } = await pool.query<MonthAggRow>(
      `SELECT
         session_date::text AS session_date,
         COUNT(*)::int AS session_count,
         COALESCE(SUM(duration_seconds), 0)::int AS total_duration_seconds,
         COALESCE(SUM(lap_count), 0)::int AS lap_count
       FROM timer_sessions
       WHERE user_id = $1
         AND session_date >= $2::date
         AND session_date < $3::date
       GROUP BY session_date`,
      [userId, from, to]
    );
    const days: TimerHistoryMonthDays = {};
    for (const row of rows) {
      days[formatDate(row.session_date)] = {
        sessionCount: Number(row.session_count) || 0,
        totalDurationSeconds: Number(row.total_duration_seconds) || 0,
        lapCount: Number(row.lap_count) || 0,
      };
    }
    return days;
  },

  async listByDate(userId: string, date: string): Promise<TimerHistoryDayResponse> {
    const pool = getPool();
    if (!pool) {
      return {
        date,
        sessionCount: 0,
        totalDurationSeconds: 0,
        lapCount: 0,
        sessions: [],
      };
    }
    const { rows } = await pool.query<SessionRow>(
      `SELECT id, gym_id, member_id, session_date::text AS session_date,
              started_at, ended_at, duration_seconds, lap_count
       FROM timer_sessions
       WHERE user_id = $1 AND session_date = $2::date
       ORDER BY started_at ASC`,
      [userId, date]
    );
    const sessions = rows.map(mapSessionSummary);
    return {
      date,
      sessionCount: sessions.length,
      totalDurationSeconds: sessions.reduce((sum, s) => sum + s.durationSeconds, 0),
      lapCount: sessions.reduce((sum, s) => sum + s.lapCount, 0),
      sessions,
    };
  },

  async getOwnedSession(
    userId: string,
    sessionId: string,
    locale: Locale
  ): Promise<TimerHistorySessionDetail | null> {
    const pool = getPool();
    if (!pool) return null;
    const sessionResult = await pool.query<SessionRow>(
      `SELECT id, gym_id, member_id, session_date::text AS session_date,
              started_at, ended_at, duration_seconds, lap_count
       FROM timer_sessions
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [sessionId, userId]
    );
    const session = sessionResult.rows[0];
    if (!session) return null;

    const lapsResult = await pool.query<LapRow>(
      `SELECT id, lap_number, started_at, ended_at, duration_seconds
       FROM timer_laps
       WHERE timer_session_id = $1
       ORDER BY lap_number ASC`,
      [sessionId]
    );

    const exercisesResult = await pool.query<ExerciseRow>(
      `SELECT
         e.id, e.timer_lap_id, e.workout_log_id, e.machine_id, e.machine_code,
         e.machine_name_snapshot, e.recorded_at,
         m.name AS machine_name_json,
         wl.set_count, wl.set_weights_kg
       FROM timer_lap_exercises e
       JOIN timer_laps l ON l.id = e.timer_lap_id
       LEFT JOIN machines m ON m.id = e.machine_id
       LEFT JOIN workout_logs wl ON wl.id = e.workout_log_id AND wl.user_id = $2
       WHERE l.timer_session_id = $1
       ORDER BY e.created_at ASC`,
      [sessionId, userId]
    );

    const exercisesByLap = new Map<string, TimerHistoryLapExercise[]>();
    for (const row of exercisesResult.rows) {
      const list = exercisesByLap.get(row.timer_lap_id) ?? [];
      list.push(mapExercise(row, locale));
      exercisesByLap.set(row.timer_lap_id, list);
    }

    const laps: TimerHistoryLap[] = lapsResult.rows.map((row) => ({
      id: row.id,
      lapNumber: row.lap_number,
      startedAt: toIso(row.started_at),
      endedAt: toIso(row.ended_at),
      durationSeconds: Number(row.duration_seconds) || 0,
      exercises: exercisesByLap.get(row.id) ?? [],
    }));

    return {
      ...mapSessionSummary(session),
      gymId: session.gym_id,
      memberId: session.member_id,
      laps,
    };
  },

  async userOwnsGym(userId: string, gymId: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    const { rows } = await pool.query<{ ok: number }>(
      `SELECT 1 AS ok FROM user_gyms WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [gymId, userId]
    );
    return Boolean(rows[0]);
  },

  async userOwnsMember(userId: string, memberId: string, gymId: string | null): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    const { rows } = await pool.query<{ ok: number }>(
      gymId
        ? `SELECT 1 AS ok FROM gym_members WHERE id = $1 AND gym_id = $2 LIMIT 1`
        : `SELECT 1 AS ok
           FROM gym_members gm
           JOIN user_gyms ug ON ug.id = gm.gym_id
           WHERE gm.id = $1 AND ug.user_id = $2
           LIMIT 1`,
      gymId ? [memberId, gymId] : [memberId, userId]
    );
    return Boolean(rows[0]);
  },

  async userOwnsWorkoutLog(userId: string, logId: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    const { rows } = await pool.query<{ ok: number }>(
      `SELECT 1 AS ok FROM workout_logs WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [logId, userId]
    );
    return Boolean(rows[0]);
  },

  async listLogsInWindow(
    userId: string,
    startedAt: string,
    endedAt: string,
    gymId: string | null
  ): Promise<
    Array<{
      id: string;
      machineId: string;
      machineCode: string;
      machineName: Record<string, string> | null;
      updatedAt: string;
    }>
  > {
    const pool = getPool();
    if (!pool) return [];
    const params: unknown[] = [userId, startedAt, endedAt];
    let gymFilter = '';
    if (gymId) {
      params.push(gymId);
      gymFilter = ` AND wl.gym_id = $${params.length}`;
    }
    const { rows } = await pool.query<{
      id: string;
      machine_id: string;
      machine_code: string;
      machine_name: Record<string, string> | null;
      updated_at: string;
    }>(
      `SELECT wl.id, wl.machine_id, m.code AS machine_code, m.name AS machine_name, wl.updated_at
       FROM workout_logs wl
       JOIN machines m ON m.id = wl.machine_id
       WHERE wl.user_id = $1
         AND wl.updated_at >= $2::timestamptz
         AND wl.updated_at <= $3::timestamptz
         ${gymFilter}
       ORDER BY wl.updated_at ASC`,
      params
    );
    return rows.map((row) => ({
      id: row.id,
      machineId: row.machine_id,
      machineCode: row.machine_code,
      machineName: row.machine_name,
      updatedAt: toIso(row.updated_at),
    }));
  },
};
