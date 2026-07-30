const STORAGE_KEY = 'machinefit.recentMachineSearches';
const MAX_ITEMS = 10;

function readRaw(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

function writeRaw(items: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* ignore quota / private mode */
  }
}

export function getRecentMachineSearches(): string[] {
  return readRaw();
}

export function pushRecentMachineSearch(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return readRaw();
  const next = [trimmed, ...readRaw().filter((item) => item.toLowerCase() !== trimmed.toLowerCase())];
  writeRaw(next);
  return next.slice(0, MAX_ITEMS);
}

export function removeRecentMachineSearch(query: string): string[] {
  const trimmed = query.trim().toLowerCase();
  const next = readRaw().filter((item) => item.toLowerCase() !== trimmed);
  writeRaw(next);
  return next;
}

export function clearRecentMachineSearches(): string[] {
  writeRaw([]);
  return [];
}
