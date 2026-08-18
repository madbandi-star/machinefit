import type {
  CreateTimerHistoryInput,
  Locale,
  TimerHistoryCreateLapExerciseInput,
  TimerHistoryDayResponse,
  TimerHistoryMonthResponse,
  TimerHistorySessionDetail,
} from '@machinefit/shared';
import { assignMarksToLaps } from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { machineRepository } from '../repositories/machine.repository.js';
import {
  timerHistoryRepository,
  type TimerHistoryInsertLap,
  type TimerHistoryInsertLapExercise,
} from '../repositories/timer-history.repository.js';
import { pickLocalized } from '../utils/localize.util.js';

function toIso(value: string): string {
  return new Date(value).toISOString();
}

async function sanitizeExercises(
  userId: string,
  exercises: TimerHistoryCreateLapExerciseInput[] | undefined
): Promise<TimerHistoryInsertLapExercise[]> {
  if (!exercises?.length) return [];
  const out: TimerHistoryInsertLapExercise[] = [];
  const seen = new Set<string>();
  for (const ex of exercises) {
    const machineCode = ex.machineCode?.trim() || null;
    let workoutLogId = ex.workoutLogId ?? null;
    if (workoutLogId && !(await timerHistoryRepository.userOwnsWorkoutLog(userId, workoutLogId))) {
      workoutLogId = null;
    }
    let machineId: string | null = null;
    if (machineCode) {
      machineId = await machineRepository.findIdByCode(machineCode);
    }
    const key = `${workoutLogId ?? ''}:${machineId ?? machineCode ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      workoutLogId,
      machineId,
      machineCode,
      machineNameSnapshot: ex.machineName?.trim() || null,
      recordedAt: ex.recordedAt ? toIso(ex.recordedAt) : null,
    });
  }
  return out;
}

async function fillExercisesFromLogs(
  userId: string,
  gymId: string | null,
  startedAt: string,
  endedAt: string,
  laps: TimerHistoryInsertLap[],
  locale: Locale
): Promise<void> {
  if (laps.some((lap) => lap.exercises.length > 0)) return;
  const logs = await timerHistoryRepository.listLogsInWindow(userId, startedAt, endedAt, gymId);
  if (logs.length === 0) return;
  const builtLaps = laps.map((lap) => ({
    lapNumber: lap.lapNumber,
    startedAtMs: Date.parse(lap.startedAt),
    endedAtMs: Date.parse(lap.endedAt),
    durationSeconds: lap.durationSeconds,
  }));
  const grouped = assignMarksToLaps(
    builtLaps,
    logs.map((log) => ({
      recordedAtMs: Date.parse(log.updatedAt),
      log,
    }))
  );
  for (const lap of laps) {
    const marks = grouped.get(lap.lapNumber) ?? [];
    lap.exercises = marks.map(({ log }) => ({
      workoutLogId: log.id,
      machineId: log.machineId,
      machineCode: log.machineCode,
      machineNameSnapshot: log.machineName
        ? pickLocalized(log.machineName, locale) ?? log.machineCode
        : log.machineCode,
      recordedAt: log.updatedAt,
    }));
  }
}

export const timerHistoryService = {
  async create(
    userId: string,
    input: CreateTimerHistoryInput,
    locale: Locale
  ): Promise<{ id: string; duplicate: boolean }> {
    const existing = await timerHistoryRepository.findIdByClientSession(
      userId,
      input.clientSessionId
    );
    if (existing) return { id: existing, duplicate: true };

    if (input.durationSeconds < 1) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Timer session is too short to save');
    }

    let gymId: string | null = input.gymId ?? null;
    if (gymId && !(await timerHistoryRepository.userOwnsGym(userId, gymId))) {
      gymId = null;
    }
    let memberId: string | null = input.memberId ?? null;
    if (memberId && !(await timerHistoryRepository.userOwnsMember(userId, memberId, gymId))) {
      memberId = null;
    }

    const orderedLaps = [...input.laps].sort((a, b) => a.lapNumber - b.lapNumber);
    const laps: TimerHistoryInsertLap[] = [];
    for (let i = 0; i < orderedLaps.length; i += 1) {
      const lap = orderedLaps[i];
      laps.push({
        lapNumber: i + 1,
        startedAt: toIso(lap.startedAt),
        endedAt: toIso(lap.endedAt),
        durationSeconds: lap.durationSeconds,
        exercises: await sanitizeExercises(userId, lap.exercises),
      });
    }

    await fillExercisesFromLogs(userId, gymId, input.startedAt, input.endedAt, laps, locale);

    const id = await timerHistoryRepository.insertSession({
      userId,
      clientSessionId: input.clientSessionId,
      gymId,
      memberId,
      sessionDate: input.sessionDate,
      startedAt: toIso(input.startedAt),
      endedAt: toIso(input.endedAt),
      durationSeconds: input.durationSeconds,
      laps,
    });
    return { id, duplicate: false };
  },

  async getMonth(
    userId: string,
    year: number,
    month: number
  ): Promise<TimerHistoryMonthResponse> {
    const days = await timerHistoryRepository.listMonthDays(userId, year, month);
    return { year, month, days };
  },

  async getDate(userId: string, date: string): Promise<TimerHistoryDayResponse> {
    return timerHistoryRepository.listByDate(userId, date);
  },

  async getSession(
    userId: string,
    sessionId: string,
    locale: Locale
  ): Promise<TimerHistorySessionDetail> {
    const detail = await timerHistoryRepository.getOwnedSession(userId, sessionId, locale);
    if (!detail) {
      throw new AppError(404, 'NOT_FOUND', 'Timer session not found');
    }
    return detail;
  },
};
