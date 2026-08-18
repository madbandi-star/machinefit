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

export function formatClock(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}
