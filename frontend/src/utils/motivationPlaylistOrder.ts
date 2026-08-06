const ORDER_KEY_PREFIX = 'machinefit-motivation-playlist-order:';
const SHUFFLE_KEY = 'machinefit-motivation-shuffle';

function orderKey(scopeId: string): string {
  return `${ORDER_KEY_PREFIX}${scopeId || 'guest'}`;
}

export function loadPlaylistOrder(scopeId: string): string[] {
  try {
    const raw = localStorage.getItem(orderKey(scopeId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch {
    return [];
  }
}

export function savePlaylistOrder(scopeId: string, order: string[]): void {
  try {
    localStorage.setItem(orderKey(scopeId), JSON.stringify(order));
  } catch {
    // ignore quota / private mode
  }
}

/** Merge saved order with current track ids (keep known order, append new ids). */
export function mergePlaylistOrder(saved: string[], trackIds: string[]): string[] {
  const idSet = new Set(trackIds);
  const kept = saved.filter((id) => idSet.has(id));
  const keptSet = new Set(kept);
  const appended = trackIds.filter((id) => !keptSet.has(id));
  return [...kept, ...appended];
}

export function movePlaylistIndex(order: string[], from: number, to: number): string[] {
  if (from === to || from < 0 || to < 0 || from >= order.length || to >= order.length) {
    return order;
  }
  const next = [...order];
  const [item] = next.splice(from, 1);
  if (!item) return order;
  next.splice(to, 0, item);
  return next;
}

export function loadShuffleEnabled(): boolean {
  try {
    return localStorage.getItem(SHUFFLE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveShuffleEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SHUFFLE_KEY, enabled ? '1' : '0');
  } catch {
    // ignore
  }
}

export function pickNextIndex(params: {
  length: number;
  current: number;
  shuffle: boolean;
}): number | null {
  const { length, current, shuffle } = params;
  if (length <= 0) return null;
  if (length === 1) return null;
  if (shuffle) {
    let next = current;
    // Avoid immediate repeat; bounded retries for tiny lists.
    for (let i = 0; i < 8 && next === current; i += 1) {
      next = Math.floor(Math.random() * length);
    }
    if (next === current) next = (current + 1) % length;
    return next;
  }
  const sequential = current + 1;
  if (sequential >= length) return null;
  return sequential;
}

export function pickPrevIndex(params: {
  length: number;
  current: number;
  shuffle: boolean;
}): number | null {
  const { length, current, shuffle } = params;
  if (length <= 0) return null;
  if (length === 1) return null;
  if (shuffle) {
    return pickNextIndex(params);
  }
  const prev = current - 1;
  if (prev < 0) return null;
  return prev;
}
