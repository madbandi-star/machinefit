const STORAGE_KEY = 'machinefit.seenStandardImageHint';

type Listener = () => void;

const listeners = new Set<Listener>();
let openRequested = false;
/** In-memory fallback when localStorage is unavailable (tests / private mode). */
let memorySeen = false;

function readSeen(): boolean {
  if (typeof localStorage === 'undefined') return memorySeen;
  try {
    return localStorage.getItem(STORAGE_KEY) === '1' || memorySeen;
  } catch {
    return memorySeen;
  }
}

function writeSeen(): void {
  memorySeen = true;
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore quota / private mode */
  }
}

export function hasSeenStandardMachineImageHint(): boolean {
  return readSeen();
}

export function markStandardMachineImageHintSeen(): void {
  writeSeen();
}

/** Call when a standard-type thumb is on screen. Opens onboarding at most once. */
export function notifyStandardMachineImageShown(): void {
  if (readSeen() || openRequested) return;
  openRequested = true;
  for (const listener of listeners) listener();
}

export function subscribeStandardMachineImageOnboarding(listener: Listener): () => void {
  listeners.add(listener);
  if (openRequested && !readSeen()) {
    listener();
  }
  return () => {
    listeners.delete(listener);
  };
}

/** Test helper */
export function resetStandardMachineImageOnboardingForTests(): void {
  openRequested = false;
  memorySeen = false;
  listeners.clear();
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
