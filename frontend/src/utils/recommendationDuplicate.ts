import type { TargetMuscleGroup } from '@machinefit/shared';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { historyApi, workoutCardApi, type HistoryItem } from '@/api';
import { ROUTES } from '@/constants/routes';
import {
  getLocalDateKey,
  getLocalDayRange,
  getTodayDateKey,
  normalizeDateKey,
} from '@/utils/historyDate';

export class DuplicateRecommendationError extends Error {
  readonly historyItem: HistoryItem | null;
  readonly dateKey: string;
  readonly machineCode: string;

  constructor(params: {
    dateKey: string;
    machineCode: string;
    historyItem?: HistoryItem | null;
  }) {
    super('duplicate_recommendation');
    this.name = 'DuplicateRecommendationError';
    this.historyItem = params.historyItem ?? null;
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

/** Block a second recommendation for the same machine (or free-weight muscle) on a date. */
export async function assertNoDuplicateToday(params: {
  gymId: string;
  memberId: string;
  machineCode: string;
  targetMuscleGroup?: TargetMuscleGroup;
  /** YYYY-MM-DD plan/log date. Defaults to today. */
  dateKey?: string;
}): Promise<void> {
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
      if (requestedMuscle) {
        const sameMuscleHistory = dayHistory.find((item) =>
          isSameFreeWeightMuscle(requestedMuscle, item.targetMuscleGroup)
        );
        if (sameMuscleHistory) {
          throw new DuplicateRecommendationError({
            dateKey,
            machineCode: params.machineCode,
            historyItem: sameMuscleHistory,
          });
        }
        const sameMuscleCard = dayCards.find((card) =>
          isSameFreeWeightMuscle(requestedMuscle, card.targetMuscleGroup)
        );
        if (sameMuscleCard) {
          throw new DuplicateRecommendationError({
            dateKey,
            machineCode: params.machineCode,
          });
        }
      }
      return;
    }

    if (dayHistory.length > 0) {
      throw new DuplicateRecommendationError({
        dateKey,
        machineCode: params.machineCode,
        historyItem: dayHistory[0],
      });
    }

    if (dayCards.length > 0) {
      throw new DuplicateRecommendationError({
        dateKey,
        machineCode: params.machineCode,
      });
    }
  } catch (error) {
    if (error instanceof DuplicateRecommendationError) throw error;
    // History/card lookup is best-effort — never block recommend for gym/network issues.
  }
}
