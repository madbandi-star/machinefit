import {
  buildWorkoutCompleteReport,
  type WorkoutCompleteReport,
  type WorkoutLog,
} from '@machinefit/shared';
import {
  historyApi,
  machinePreferenceApi,
  recommendationFeedbackApi,
  workoutLogApi,
} from '@/api';
import { pointsApi } from '@/api/points.api';
import { shiftDateKey } from '@/utils/historyDate';
import type { PosterRepsContext } from '@/utils/workoutPosterExerciseDetails';

const WORKOUT_POWER_ACTIONS = new Set([
  'workout_log_save',
  'workout_complete',
  'daily_workout_done',
  'workout_streak',
]);

function seoulDateKey(iso = new Date()): string {
  return iso.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

function resolveReps(min?: number | null, max?: number | null): number | null {
  if (min != null && min > 0) return min;
  if (max != null && max > 0) return max;
  return null;
}

function isSameSeoulDay(iso: string, dayKey: string): boolean {
  try {
    return (
      new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }) === dayKey
    );
  } catch {
    return false;
  }
}

export type WorkoutCompleteFetchResult = {
  report: WorkoutCompleteReport;
  /** Existing today logs — display enrichment for screenshot poster only. */
  todayLogs: WorkoutLog[];
  repsByMachine?: Record<string, PosterRepsContext | undefined>;
};

type LogVolumeContext = {
  adjustedWeight?: number | null;
  recommendedWeight?: number | null;
  adjustedReps?: number | null;
  recommendedReps?: number | null;
  fitRating?: 'good' | 'bad' | null;
};

/**
 * Build per-log volume contexts matching Records / backend workout-load:
 * prefs + recommendation snapshot + fitRating when recommendationId exists.
 */
async function buildLogVolumeContexts(input: {
  logs: WorkoutLog[];
  gymId: string;
  memberId?: string | null;
  preferenceScope?: { gymId: string; memberId: string };
  from: string;
  to: string;
}): Promise<Record<string, LogVolumeContext | undefined> | undefined> {
  const { logs, gymId, memberId, preferenceScope, from, to } = input;
  if (logs.length === 0) return undefined;

  const machineCodes = [...new Set(logs.map((l) => l.machineCode))];
  const recommendationIds = [
    ...new Set(
      logs.map((l) => l.recommendationId).filter((id): id is string => Boolean(id))
    ),
  ];

  try {
    const [prefs, historyRes, feedback] = await Promise.all([
      preferenceScope && machineCodes.length > 0
        ? machinePreferenceApi.getBatch(machineCodes, preferenceScope)
        : Promise.resolve(null),
      historyApi
        .list(gymId, {
          from,
          to,
          limit: 100,
          memberId: memberId ?? undefined,
        })
        .catch(() => null),
      recommendationIds.length > 0
        ? recommendationFeedbackApi.getBatch(recommendationIds).catch(() =>
            Object.fromEntries(recommendationIds.map((id) => [id, null]))
          )
        : Promise.resolve({} as Record<string, 'good' | 'bad' | null>),
    ]);

    const historyItems = historyRes?.data.data ?? [];
    const historyByRecommendation = new Map(
      historyItems
        .filter((h) => h.recommendationId)
        .map((h) => [h.recommendationId!, h] as const)
    );
    const historyByMachine = new Map(
      historyItems.map((h) => [h.machineCode, h] as const)
    );

    const contexts: Record<string, LogVolumeContext | undefined> = {};
    for (const log of logs) {
      const adjusted = prefs?.[log.machineCode]?.customSettings;
      const history =
        (log.recommendationId
          ? historyByRecommendation.get(log.recommendationId)
          : undefined) ?? historyByMachine.get(log.machineCode);
      const fitRating =
        log.recommendationId != null
          ? ((feedback as Record<string, 'good' | 'bad' | null>)[log.recommendationId] ??
            null)
          : undefined;

      contexts[log.id] = {
        adjustedWeight: adjusted?.recommendedWeightKg,
        recommendedWeight: history?.settings.recommendedWeightKg,
        adjustedReps: resolveReps(
          adjusted?.recommendedRepsMin,
          adjusted?.recommendedRepsMax
        ),
        recommendedReps: resolveReps(
          history?.settings.recommendedRepsMin,
          history?.settings.recommendedRepsMax
        ),
        ...(fitRating !== undefined ? { fitRating } : {}),
      };
      // Machine fallback for callers that still key by code (poster enrichment).
      if (!contexts[log.machineCode]) {
        contexts[log.machineCode] = contexts[log.id];
      }
    }
    return contexts;
  } catch {
    return undefined;
  }
}

export async function fetchWorkoutCompleteReport(input: {
  gymId: string;
  memberId?: string | null;
  dateKey: string;
  durationMs: number;
  locale?: string;
  preferenceScope?: { gymId: string; memberId: string };
}): Promise<WorkoutCompleteFetchResult> {
  const { gymId, memberId, dateKey, durationMs, locale, preferenceScope } = input;
  const fromPrior = shiftDateKey(dateKey, -30);

  const [todayRes, priorRes, pointsRes, ledgerRes] = await Promise.all([
    workoutLogApi.list({
      gymId,
      memberId: memberId ?? undefined,
      from: dateKey,
      to: dateKey,
    }),
    workoutLogApi.list({
      gymId,
      memberId: memberId ?? undefined,
      from: fromPrior,
      to: dateKey,
    }),
    pointsApi.getMine().catch(() => null),
    pointsApi.ledger({ limit: 80, offset: 0 }).catch(() => null),
  ]);

  const todayLogs = todayRes.data.data as WorkoutLog[];
  const priorLogs = (priorRes.data.data as WorkoutLog[]).filter(
    (log) => (log.logDate?.slice(0, 10) ?? '') !== dateKey
  );

  const contexts = await buildLogVolumeContexts({
    logs: [...todayLogs, ...priorLogs],
    gymId,
    memberId,
    preferenceScope,
    from: fromPrior,
    to: dateKey,
  });

  const seoulDay = seoulDateKey();
  const ledgerItems = ledgerRes?.data.data.items ?? [];
  const earnedToday = ledgerItems
    .filter(
      (tx) =>
        tx.transactionType === 'EARN' &&
        tx.actionCode != null &&
        WORKOUT_POWER_ACTIONS.has(tx.actionCode) &&
        isSameSeoulDay(tx.createdAt, seoulDay)
    )
    .reduce((sum, tx) => sum + Math.max(0, tx.points), 0);

  const balance = pointsRes?.data.data.balance ?? 0;

  const report = buildWorkoutCompleteReport({
    dateKey,
    durationMs,
    todayLogs,
    priorLogs,
    contexts,
    power: { balance, earnedToday },
    locale: locale?.startsWith('ko') ? 'ko' : 'en',
  });

  const repsByMachine: Record<string, PosterRepsContext | undefined> | undefined = contexts
    ? Object.fromEntries(
        todayLogs.map((log) => {
          const ctx = contexts[log.id] ?? contexts[log.machineCode];
          return [
            log.machineCode,
            ctx
              ? {
                  adjustedReps: ctx.adjustedReps,
                  recommendedReps: ctx.recommendedReps,
                }
              : undefined,
          ];
        })
      )
    : undefined;

  return { report, todayLogs, repsByMachine };
}
