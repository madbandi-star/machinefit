/** Safe haptic helpers — no-op when Vibration API is unavailable. */

export function canHaptic(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

/** Light tick for a spoken count. */
export function hapticCountTick(turbo = false): void {
  if (!canHaptic()) return;
  try {
    if (turbo) {
      navigator.vibrate([12, 24, 12]);
    } else {
      navigator.vibrate(10);
    }
  } catch {
    // Unsupported / blocked — ignore
  }
}
