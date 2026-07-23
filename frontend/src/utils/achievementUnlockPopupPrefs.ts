import { getTodayDateKey } from '@/utils/historyDate';

const ENABLED_KEY = 'machinefit:achievement-unlock-popup-enabled';
const HIDE_DATE_KEY = 'machinefit:achievement-unlock-popup-hide-date';

/** Default: show unlock popups. */
export function isAchievementUnlockPopupEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_KEY) !== '0';
  } catch {
    return true;
  }
}

export function setAchievementUnlockPopupEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(ENABLED_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function isAchievementUnlockPopupHiddenToday(): boolean {
  try {
    return localStorage.getItem(HIDE_DATE_KEY) === getTodayDateKey();
  } catch {
    return false;
  }
}

export function hideAchievementUnlockPopupToday(): void {
  try {
    localStorage.setItem(HIDE_DATE_KEY, getTodayDateKey());
  } catch {
    /* ignore */
  }
}

export function clearAchievementUnlockPopupHideToday(): void {
  try {
    localStorage.removeItem(HIDE_DATE_KEY);
  } catch {
    /* ignore */
  }
}
