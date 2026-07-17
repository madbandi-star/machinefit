import type { HistoryItem } from '@/api';
import { ROUTES } from '@/constants/routes';
import { getLocalDateKey } from '@/utils/historyDate';

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
