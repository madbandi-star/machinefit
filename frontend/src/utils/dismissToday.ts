import { getTodayDateKey } from '@/utils/historyDate';

export function isDismissedToday(key: string): boolean {
  try {
    return localStorage.getItem(key) === getTodayDateKey();
  } catch {
    return false;
  }
}

export function dismissForToday(key: string): void {
  try {
    localStorage.setItem(key, getTodayDateKey());
  } catch {
    /* ignore quota errors */
  }
}
