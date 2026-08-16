const SESSION_KEY = 'mf_ad_sid';
const NAV_COUNT_KEY = 'mf_ad_nav_count';
const WORKOUT_COMPLETE_COUNT_KEY = 'mf_ad_workout_complete_count';

export function getAdSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = `ad_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return `ad_${Date.now()}`;
  }
}

export function bumpNavCount(): number {
  try {
    const next = Number(sessionStorage.getItem(NAV_COUNT_KEY) || '0') + 1;
    sessionStorage.setItem(NAV_COUNT_KEY, String(next));
    return next;
  } catch {
    return 1;
  }
}

export function bumpWorkoutCompleteCount(): number {
  try {
    const next = Number(sessionStorage.getItem(WORKOUT_COMPLETE_COUNT_KEY) || '0') + 1;
    sessionStorage.setItem(WORKOUT_COMPLETE_COUNT_KEY, String(next));
    return next;
  } catch {
    return 1;
  }
}

/** StrictMode / remount dedupe within a short window. */
const recentKeys = new Map<string, number>();

export function shouldDedupe(key: string, windowMs = 1500): boolean {
  const now = Date.now();
  const prev = recentKeys.get(key);
  if (prev && now - prev < windowMs) return true;
  recentKeys.set(key, now);
  if (recentKeys.size > 200) {
    for (const [k, t] of recentKeys) {
      if (now - t > 10_000) recentKeys.delete(k);
    }
  }
  return false;
}
