import type { TargetMuscleGroup } from '@machinefit/shared';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { historyApi, workoutCardApi, workoutLogApi, type HistoryItem } from '@/api';
import { ROUTES } from '@/constants/routes';
import {
  getLocalDateKey,
  getLocalDayRange,
  getTodayDateKey,
  normalizeDateKey,
} from '@/utils/historyDate';

export class DuplicateRecommendationError extends Error {
  readonly historyItem: HistoryItem | null;
  readonly workoutCardId: string | null;
  readonly dateKey: string;
  readonly machineCode: string;

  constructor(params: {
    dateKey: string;
    machineCode: string;
    historyItem?: HistoryItem | null;
    workoutCardId?: string | null;
  }) {
    super('duplicate_recommendation');
    this.name = 'DuplicateRecommendationError';
    this.historyItem = params.historyItem ?? null;
    this.workoutCardId = params.workoutCardId ?? null;
    this.dateKey = params.dateKey;
    this.machineCode = params.machineCode;
  }
}

export function buildRecordsHistoryFocusUrl(
  item: Pick<HistoryItem, 'id' | 'viewedAt'>
): string {
  const date = getLocalDateKey(item.viewedAt);
  return `${ROUTES.RECORDS}?tab=history&date=${date}&focus=${item.id}`;
}

export function buildRecordsDateUrl(dateKey: string): string {
  return `${ROUTES.RECORDS}?tab=history&date=${normalizeDateKey(dateKey)}`;
}

function isSameFreeWeightMuscle(
  requestedMuscle: TargetMuscleGroup | undefined,
  cardMuscle: TargetMuscleGroup | string | undefined | null
): boolean {
  if (!requestedMuscle) return false;
  return cardMuscle === requestedMuscle;
}

export type TodayDuplicateMatch = {
  dateKey: string;
  machineCode: string;
  historyItem: HistoryItem | null;
  workoutCardId: string | null;
};

/** Look up an existing same-day recommendation for this machine (or free-weight muscle). */
export async function findDuplicateToday(params: {
  gymId: string;
  memberId: string;
  machineCode: string;
  targetMuscleGroup?: TargetMuscleGroup;
  /** YYYY-MM-DD plan/log date. Defaults to today. */
  dateKey?: string;
}): Promise<TodayDuplicateMatch | null> {
  try {
    const dateKey = normalizeDateKey(params.dateKey ?? getTodayDateKey());
    const { from, to } = getLocalDayRange(dateKey);
    const requestedMuscle = params.targetMuscleGroup;

    const [historyRes, cardsRes] = await Promise.all([
      historyApi.list(params.gymId, {
        machineCode: params.machineCode,
        limit: 20,
        from,
        to,
        memberId: params.memberId,
      }),
      workoutCardApi.list({
        gymId: params.gymId,
        memberId: params.memberId,
        scheduledDate: dateKey,
      }),
    ]);

    const dayHistory = historyRes.data.data;
    const dayCards = (cardsRes.data.data ?? []).filter(
      (card) => card.machineCode === params.machineCode
    );

    if (isFreeWeightMachineCode(params.machineCode)) {
      if (!requestedMuscle) return null;

      const sameMuscleHistory = dayHistory.find((item) =>
        isSameFreeWeightMuscle(requestedMuscle, item.targetMuscleGroup)
      );
      const sameMuscleCard = dayCards.find((card) =>
        isSameFreeWeightMuscle(requestedMuscle, card.targetMuscleGroup)
      );

      if (!sameMuscleHistory && !sameMuscleCard) return null;

      return {
        dateKey,
        machineCode: params.machineCode,
        historyItem: sameMuscleHistory ?? null,
        workoutCardId: sameMuscleCard?.id ?? null,
      };
    }

    if (dayHistory.length === 0 && dayCards.length === 0) return null;

    return {
      dateKey,
      machineCode: params.machineCode,
      historyItem: dayHistory[0] ?? null,
      workoutCardId: dayCards[0]?.id ?? null,
    };
  } catch {
    // History/card lookup is best-effort — never block recommend for gym/network issues.
    return null;
  }
}

/** Block a second recommendation for the same machine (or free-weight muscle) on a date. */
export async function assertNoDuplicateToday(params: {
  gymId: string;
  memberId: string;
  machineCode: string;
  targetMuscleGroup?: TargetMuscleGroup;
  /** YYYY-MM-DD plan/log date. Defaults to today. */
  dateKey?: string;
}): Promise<void> {
  const match = await findDuplicateToday(params);
  if (!match) return;
  throw new DuplicateRecommendationError(match);
}

/**
 * Remove today's recommendation trail for a machine so easy-mode can create a fresh one.
 * Mirrors Records delete: plan card, history row, and workout log when present.
 */
export async function removeDuplicateTodayRecommendation(params: {
  gymId: string;
  memberId: string;
  machineCode: string;
  dateKey: string;
  targetMuscleGroup?: TargetMuscleGroup;
  historyItem?: HistoryItem | null;
  workoutCardId?: string | null;
}): Promise<void> {
  const dateKey = normalizeDateKey(params.dateKey);
  let historyId = params.historyItem?.id ?? null;
  let workoutCardId = params.workoutCardId ?? null;

  if (!historyId || !workoutCardId) {
    const fresh = await findDuplicateToday({
      gymId: params.gymId,
      memberId: params.memberId,
      machineCode: params.machineCode,
      targetMuscleGroup: params.targetMuscleGroup,
      dateKey,
    });
    if (fresh) {
      historyId = historyId ?? fresh.historyItem?.id ?? null;
      workoutCardId = workoutCardId ?? fresh.workoutCardId;
    }
  }

  if (workoutCardId && !historyId) {
    await workoutCardApi.remove(workoutCardId);
    try {
      await workoutLogApi.remove({
        gymId: params.gymId,
        memberId: params.memberId,
        machineCode: params.machineCode,
        logDate: dateKey,
        ...(params.targetMuscleGroup ? { targetMuscleGroup: params.targetMuscleGroup } : {}),
      });
    } catch {
      /* workout log may not exist */
    }
    return;
  }

  if (historyId) {
    await historyApi.remove(historyId);
  }

  try {
    await workoutLogApi.remove({
      gymId: params.gymId,
      memberId: params.memberId,
      machineCode: params.machineCode,
      logDate: dateKey,
      ...(params.targetMuscleGroup ? { targetMuscleGroup: params.targetMuscleGroup } : {}),
    });
  } catch {
    /* workout log may not exist */
  }

  if (workoutCardId) {
    try {
      await workoutCardApi.remove(workoutCardId);
    } catch {
      /* plan may already be gone */
    }
  }
}
