import type { TimerHistoryCreateInput, WorkoutLog } from '@machinefit/shared';
import {
  assignMarksToLaps,
  buildTimerHistoryLaps,
  isAllGymsId,
  msToDurationSeconds,
} from '@machinefit/shared';
import { timerHistoryApi } from '@/api/timer-history.api';
import { useAuthStore } from '@/store/auth.store';
import {
  useWorkoutSessionTimerStore,
  type WorkoutSessionLap,
  type WorkoutSessionMachineMark,
} from '@/store/workoutSessionTimer.store';
import { getLocalDateKey } from '@/utils/historyDate';

const QUEUE_KEY = 'machinefit-timer-history-queue';
const MAX_QUEUE = 20;

let flushing = false;
let onlineBound = false;

function isUuid(value: string | null | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function readQueue(): TimerHistoryCreateInput[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as TimerHistoryCreateInput[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: TimerHistoryCreateInput[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-MAX_QUEUE)));
  } catch {
    // Quota / private mode — drop the queue rather than breaking the timer.
  }
}

function enqueue(body: TimerHistoryCreateInput): void {
  const current = readQueue().filter((item) => item.clientSessionId !== body.clientSessionId);
  writeQueue([...current, body]);
}

export function noteActiveTimerMachine(
  log: Pick<WorkoutLog, 'id' | 'machineCode' | 'machineName'>
): void {
  useWorkoutSessionTimerStore.getState().noteMachineUsed({
    machineCode: log.machineCode,
    machineName: log.machineName,
    workoutLogId: log.id,
    recordedAtMs: Date.now(),
  });
}

export function buildTimerHistoryBody(input: {
  clientSessionId: string;
  sessionStartedAtMs: number;
  endedAtMs: number;
  durationMs: number;
  laps: WorkoutSessionLap[];
  machineMarks: WorkoutSessionMachineMark[];
  gymId?: string | null;
  memberId?: string | null;
}): TimerHistoryCreateInput | null {
  const durationSeconds = msToDurationSeconds(input.durationMs);
  if (durationSeconds < 1) return null;
  const laps = buildTimerHistoryLaps({
    sessionStartedAtMs: input.sessionStartedAtMs,
    endedAtMs: input.endedAtMs,
    durationMs: input.durationMs,
    laps: input.laps,
  });
  const grouped = assignMarksToLaps(laps, input.machineMarks);
  const gymId = input.gymId && !isAllGymsId(input.gymId) && isUuid(input.gymId) ? input.gymId : undefined;
  const memberId = isUuid(input.memberId) ? input.memberId : undefined;
  return {
    clientSessionId: input.clientSessionId,
    sessionDate: getLocalDateKey(new Date(input.sessionStartedAtMs).toISOString()),
    startedAt: new Date(input.sessionStartedAtMs).toISOString(),
    endedAt: new Date(input.endedAtMs).toISOString(),
    durationSeconds,
    ...(gymId ? { gymId } : {}),
    ...(memberId ? { memberId } : {}),
    laps: laps.map((lap) => ({
      lapNumber: lap.lapNumber,
      startedAt: new Date(lap.startedAtMs).toISOString(),
      endedAt: new Date(lap.endedAtMs).toISOString(),
      durationSeconds: lap.durationSeconds,
      exercises: (grouped.get(lap.lapNumber) ?? []).map((mark) => ({
        ...(isUuid(mark.workoutLogId) ? { workoutLogId: mark.workoutLogId } : {}),
        machineCode: mark.machineCode,
        ...(mark.machineName ? { machineName: mark.machineName } : {}),
        recordedAt: new Date(mark.recordedAtMs).toISOString(),
      })),
    })),
  };
}

async function postBody(body: TimerHistoryCreateInput): Promise<boolean> {
  try {
    await timerHistoryApi.create(body);
    return true;
  } catch (error) {
    const status =
      error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { status?: number } }).response?.status
        : undefined;
    if (status === 400 || status === 401 || status === 403) return true;
    return false;
  }
}

export async function flushTimerHistoryQueue(): Promise<void> {
  if (flushing) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  if (!useAuthStore.getState().isAuthenticated) return;
  flushing = true;
  try {
    const items = readQueue();
    const remain: TimerHistoryCreateInput[] = [];
    for (const item of items) {
      const ok = await postBody(item);
      if (!ok) remain.push(item);
    }
    writeQueue(remain);
  } finally {
    flushing = false;
  }
}

function bindOnlineFlush(): void {
  if (onlineBound || typeof window === 'undefined') return;
  onlineBound = true;
  window.addEventListener('online', () => {
    void flushTimerHistoryQueue();
  });
}

export function persistEndedTimerSession(input: {
  durationMs: number;
  endedAtMs?: number;
  gymId?: string | null;
  memberId?: string | null;
  sessionStartedAtMs?: number | null;
  clientSessionId?: string | null;
  laps?: WorkoutSessionLap[];
  machineMarks?: WorkoutSessionMachineMark[];
}): void {
  bindOnlineFlush();
  if (!useAuthStore.getState().isAuthenticated) return;
  const state = useWorkoutSessionTimerStore.getState();
  const endedAtMs = input.endedAtMs ?? Date.now();
  const startedAtMs =
    input.sessionStartedAtMs ??
    state.sessionStartedAtMs ??
    Math.max(0, endedAtMs - Math.max(0, input.durationMs));
  const rawClientId = input.clientSessionId ?? state.clientSessionId;
  const clientSessionId = isUuid(rawClientId)
    ? rawClientId
    : typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : null;
  if (!clientSessionId) return;

  const body = buildTimerHistoryBody({
    clientSessionId,
    sessionStartedAtMs: startedAtMs,
    endedAtMs,
    durationMs: input.durationMs,
    laps: input.laps ?? state.laps ?? [],
    machineMarks: input.machineMarks ?? state.machineMarks ?? [],
    gymId: input.gymId,
    memberId: input.memberId,
  });
  if (!body) return;

  void (async () => {
    const ok = await postBody(body);
    if (!ok) enqueue(body);
    else void flushTimerHistoryQueue();
  })();
}
