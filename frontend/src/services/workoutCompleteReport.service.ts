import {
  buildWorkoutCompleteReport,
  type WorkoutCompleteReport,
  type WorkoutLog,
} from '@machinefit/shared';
import { historyApi, machinePreferenceApi, workoutLogApi } from '@/api';
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

  const machineCodes = [
    ...new Set([...todayLogs, ...priorLogs].map((l) => l.machineCode)),
  ];

  let contexts:
    | Record<
        string,
        {
          adjustedWeight?: number | null;
          recommendedWeight?: number | null;
          adjustedReps?: number | null;
          recommendedReps?: number | null;
        }
      >
    | undefined;

  if (preferenceScope && machineCodes.length > 0) {
    try {
      const prefs = await machinePreferenceApi.getBatch(machineCodes, preferenceScope);
      const historyRes = await historyApi
        .list(gymId, {
          from: fromPrior,
          to: dateKey,
          limit: 100,
          memberId: memberId ?? undefined,
        })
        .catch(() => null);
      const historyByMachine = new Map(
        (historyRes?.data.data ?? []).map((h) => [h.machineCode, h] as const)
      );

      contexts = {};
      for (const code of machineCodes) {
        const adjusted = prefs?.[code]?.customSettings;
        const history = historyByMachine.get(code);
        contexts[code] = {
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
        };
      }
    } catch {
      contexts = undefined;
    }
  }

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
        Object.entries(contexts).map(([code, ctx]) => [
          code,
          {
            adjustedReps: ctx.adjustedReps,
            recommendedReps: ctx.recommendedReps,
          },
        ])
      )
    : undefined;

  return { report, todayLogs, repsByMachine };
}
