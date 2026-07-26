import type { TargetMuscleGroup } from '@machinefit/shared';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { historyApi, type HistoryItem } from '@/api';
import { ROUTES } from '@/constants/routes';
import { getLocalDateKey, getLocalDayRange, getTodayDateKey } from '@/utils/historyDate';

export class DuplicateRecommendationError extends Error {
  readonly historyItem: HistoryItem;

  constructor(historyItem: HistoryItem) {
    super('duplicate_recommendation');
    this.name = 'DuplicateRecommendationError';
    this.historyItem = historyItem;
  }
}

export function buildRecordsHistoryFocusUrl(item: Pick<HistoryItem, 'id' | 'viewedAt'>): string {
  const date = getLocalDateKey(item.viewedAt);
  return `${ROUTES.RECORDS}?tab=history&date=${date}&focus=${item.id}`;
}

/** Block a second recommendation for the same machine (or free-weight muscle) today. */
export async function assertNoDuplicateToday(params: {
  gymId: string;
  memberId: string;
  machineCode: string;
  targetMuscleGroup?: TargetMuscleGroup;
}): Promise<void> {
  try {
    const today = getTodayDateKey();
    const { from, to } = getLocalDayRange(today);
    const historyRes = await historyApi.list(params.gymId, {
      machineCode: params.machineCode,
      limit: 20,
      from,
      to,
      memberId: params.memberId,
    });
    const todayItems = historyRes.data.data;
    const requestedMuscle = params.targetMuscleGroup;

    if (isFreeWeightMachineCode(params.machineCode)) {
      if (requestedMuscle) {
        const sameMuscleToday = todayItems.find(
          (item) => item.targetMuscleGroup === requestedMuscle
        );
        if (sameMuscleToday) {
          throw new DuplicateRecommendationError(sameMuscleToday);
        }
      }
      return;
    }

    if (todayItems.length > 0) {
      throw new DuplicateRecommendationError(todayItems[0]);
    }
  } catch (error) {
    if (error instanceof DuplicateRecommendationError) throw error;
    // History lookup is best-effort — never block recommend for gym/network issues.
  }
}
