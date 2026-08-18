export function formatDurationSeconds(
  totalSeconds: number,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0 && m > 0) return t('timerHistory.durationHm', { h, m });
  if (h > 0) return t('timerHistory.durationH', { h });
  if (m > 0 && s > 0) return t('timerHistory.durationMs', { m, s });
  if (m > 0) return t('timerHistory.durationM', { m });
  return t('timerHistory.durationS', { s });
}

/** Minutes-first label for glance cards (skip leftover seconds unless under 1 min). */
export function formatDurationCompact(
  totalSeconds: number,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0 && m > 0) return t('timerHistory.durationHm', { h, m });
  if (h > 0) return t('timerHistory.durationH', { h });
  if (m > 0) return t('timerHistory.durationM', { m });
  return t('timerHistory.durationS', { s: sec });
}

export function formatClock(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

/** Stopwatch-style clock for a finished session (m:ss or h:mm:ss). */
export function formatTimerClock(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export function formatSetWeightsKg(
  weights: number[] | undefined,
  t: (key: string, options?: Record<string, unknown>) => string
): string | null {
  const nums = (weights ?? []).filter((w) => Number.isFinite(w) && w > 0);
  if (nums.length === 0) return null;
  const pretty = (w: number) => (Number.isInteger(w) ? String(w) : String(w));
  const allSame = nums.every((w) => w === nums[0]);
  const list = allSame ? pretty(nums[0]) : nums.map(pretty).join('·');
  return t('timerHistory.weightsKg', { list });
}
