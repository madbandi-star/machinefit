const STORAGE_KEY = 'machinefit.searchInitialLoadMs';
const MAX_SAMPLES = 5;
export const SEARCH_INITIAL_LOAD_SLOW_MS = 3_000;

function readSamples(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v) => (typeof v === 'number' ? v : Number(v)))
      .filter((v) => Number.isFinite(v) && v > 0 && v < 120_000)
      .slice(-MAX_SAMPLES);
  } catch {
    return [];
  }
}

function writeSamples(samples: number[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(samples.slice(-MAX_SAMPLES)));
  } catch {
    // Quota / private mode — ignore.
  }
}

/** Median of recent successful initial search-page load durations (ms), or null. */
export function getSearchInitialLoadEstimateMs(): number | null {
  const samples = readSamples();
  if (samples.length === 0) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
  }
  return sorted[mid]!;
}

export function recordSearchInitialLoadMs(durationMs: number): void {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return;
  const clamped = Math.min(Math.round(durationMs), 120_000);
  const next = [...readSamples(), clamped];
  writeSamples(next);
}

export function isSearchInitialLoadExpectedSlow(): boolean {
  const estimate = getSearchInitialLoadEstimateMs();
  return estimate != null && estimate >= SEARCH_INITIAL_LOAD_SLOW_MS;
}
