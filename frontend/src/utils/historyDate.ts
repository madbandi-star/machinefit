export function getLocalDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTodayDateKey(): string {
  return getLocalDateKey(new Date().toISOString());
}

/** Normalize API/log dates to local YYYY-MM-DD for consistent day grouping. */
export function normalizeDateKey(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return getLocalDateKey(parsed.toISOString());
  }

  return value;
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

export function collectMuscleGroupsInOrder<T extends { muscleGroup?: string }>(
  items: T[]
): string[] {
  const seen = new Set<string>();
  const groups: string[] = [];

  for (const item of items) {
    const group = item.muscleGroup;
    if (!group || seen.has(group)) continue;
    seen.add(group);
    groups.push(group);
  }

  return groups;
}

export function formatMuscleGroupSummary(
  groups: string[],
  translateMuscleGroup: (group: string) => string
): string {
  return groups.map((group) => translateMuscleGroup(group)).join(' ');
}

export function formatHistoryDateHeaderWithMuscles(
  dateKey: string,
  locale: string,
  muscleGroups: string[],
  translateMuscleGroup: (group: string) => string
): string {
  const dateLabel = formatHistoryDateHeader(dateKey, locale);
  if (muscleGroups.length === 0) return dateLabel;
  return `${dateLabel} ${formatMuscleGroupSummary(muscleGroups, translateMuscleGroup)}`;
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

export function toDateKey(year: number, monthIndex: number, day: number): string {
  const y = year;
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(dateKey: string): { year: number; monthIndex: number; day: number } {
  const [y, m, d] = dateKey.split('-').map(Number);
  return { year: y, monthIndex: m - 1, day: d };
}

export function extractHistoryDateKeys(items: { viewedAt: string }[]): Set<string> {
  return new Set(items.map((item) => getLocalDateKey(item.viewedAt)));
}

export interface CalendarCell {
  dateKey: string;
  day: number;
  inCurrentMonth: boolean;
}

export function buildMonthGrid(year: number, monthIndex: number): CalendarCell[] {
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, monthIndex, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    const day = daysInPrevMonth - i;
    const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
    const prevYear = monthIndex === 0 ? year - 1 : year;
    cells.push({
      dateKey: toDateKey(prevYear, prevMonthIndex, day),
      day,
      inCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      dateKey: toDateKey(year, monthIndex, day),
      day,
      inCurrentMonth: true,
    });
  }

  let nextDay = 1;
  const nextMonthIndex = monthIndex === 11 ? 0 : monthIndex + 1;
  const nextYear = monthIndex === 11 ? year + 1 : year;
  while (cells.length % 7 !== 0) {
    cells.push({
      dateKey: toDateKey(nextYear, nextMonthIndex, nextDay),
      day: nextDay,
      inCurrentMonth: false,
    });
    nextDay += 1;
  }

  return cells;
}

export function formatMonthLabel(year: number, monthIndex: number, locale: string): string {
  return new Date(year, monthIndex, 1).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
  });
}

export function getWeekdayLabels(locale: string): string[] {
  const base = new Date(2024, 0, 7); // Sunday
  return Array.from({ length: 7 }, (_, index) =>
    new Date(base.getFullYear(), base.getMonth(), base.getDate() + index).toLocaleDateString(locale, {
      weekday: 'narrow',
    })
  );
}

export function getInitialCalendarMonth(
  selectedDate: string,
  datesWithData: Set<string>
): { year: number; monthIndex: number } {
  if (selectedDate) {
    const parsed = parseDateKey(selectedDate);
    return { year: parsed.year, monthIndex: parsed.monthIndex };
  }

  const sorted = [...datesWithData].sort((a, b) => b.localeCompare(a));
  if (sorted[0]) {
    const parsed = parseDateKey(sorted[0]);
    return { year: parsed.year, monthIndex: parsed.monthIndex };
  }

  const now = new Date();
  return { year: now.getFullYear(), monthIndex: now.getMonth() };
}
