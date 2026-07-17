export function getLocalDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatHistoryDateHeader(dateKey: string, locale: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

export function formatHistoryTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function groupHistoryByDate<T extends { viewedAt: string }>(
  items: T[]
): { dateKey: string; items: T[] }[] {
  const groups: { dateKey: string; items: T[] }[] = [];
  const indexByDate = new Map<string, number>();

  for (const item of items) {
    const dateKey = getLocalDateKey(item.viewedAt);
    const existingIndex = indexByDate.get(dateKey);

    if (existingIndex === undefined) {
      indexByDate.set(dateKey, groups.length);
      groups.push({ dateKey, items: [item] });
      continue;
    }

    groups[existingIndex].items.push(item);
  }

  return groups;
}

export function getLocalDayRange(dateKey: string): { from: string; to: string } {
  const [y, m, d] = dateKey.split('-').map(Number);
  const from = new Date(y, m - 1, d, 0, 0, 0, 0);
  const to = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}
