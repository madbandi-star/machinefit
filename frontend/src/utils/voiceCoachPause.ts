/**
 * Pause gate for voice-count / hold flows.
 * Sleeps and cue waits freeze while paused; Stop still uses AbortSignal.
 */

export class VoiceCoachPauseController {
  private paused = false;
  private waiters: Array<() => void> = [];

  get isPaused(): boolean {
    return this.paused;
  }

  pause(): void {
    if (this.paused) return;
    this.paused = true;
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    const pending = this.waiters.splice(0);
    for (const resume of pending) resume();
  }

  /** Resolve when not paused (or immediately if already running). Abort-aware. */
  waitWhilePaused(signal?: AbortSignal): Promise<void> {
    if (!this.paused) return Promise.resolve();
    if (signal?.aborted) {
      return Promise.reject(new DOMException('Aborted', 'AbortError'));
    }

    return new Promise<void>((resolve, reject) => {
      const onResume = () => {
        cleanup();
        resolve();
      };
      const onAbort = () => {
        cleanup();
        reject(new DOMException('Aborted', 'AbortError'));
      };
      const cleanup = () => {
        this.waiters = this.waiters.filter((waiter) => waiter !== onResume);
        signal?.removeEventListener('abort', onAbort);
      };

      this.waiters.push(onResume);
      signal?.addEventListener('abort', onAbort, { once: true });

      if (!this.paused) {
        cleanup();
        resolve();
      }
    });
  }
}

let activePause: VoiceCoachPauseController | null = null;

export function setActiveVoiceCoachPause(
  controller: VoiceCoachPauseController | null
): void {
  activePause = controller;
}

export function getActiveVoiceCoachPause(): VoiceCoachPauseController | null {
  return activePause;
}

/** Wait until the tab is visible again (screen lock / background freeze). */
async function waitWhileDocumentHidden(signal?: AbortSignal): Promise<void> {
  if (typeof document === 'undefined') return;
  if (document.visibilityState !== 'hidden') return;
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  await new Promise<void>((resolve, reject) => {
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        cleanup();
        resolve();
      }
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException('Aborted', 'AbortError'));
    };
    const cleanup = () => {
      document.removeEventListener('visibilitychange', onVis);
      signal?.removeEventListener('abort', onAbort);
    };

    document.addEventListener('visibilitychange', onVis);
    signal?.addEventListener('abort', onAbort, { once: true });

    if (document.visibilityState !== 'hidden') {
      cleanup();
      resolve();
    }
  });
}

/** Abort-aware sleep that freezes while the active voice-coach pause is on. */
export async function sleepWithVoiceCoachPause(
  ms: number,
  signal?: AbortSignal
): Promise<void> {
  let remaining = Math.max(0, ms);

  while (remaining > 0) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const pause = getActiveVoiceCoachPause();
    await pause?.waitWhilePaused(signal);
    await waitWhileDocumentHidden(signal);

    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const slice = Math.min(remaining, 80);
    const started = performance.now();

    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      const timer = window.setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }, slice);
      const onAbort = () => {
        window.clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      };
      signal?.addEventListener('abort', onAbort, { once: true });
    });

    // If we entered pause / screen-lock during the slice, do not consume remaining time.
    if (getActiveVoiceCoachPause()?.isPaused) {
      continue;
    }
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      continue;
    }

    // Cap elapsed so a frozen timer wake does not burn the whole gap at once.
    const elapsed = performance.now() - started;
    remaining -= Math.min(slice + 16, Math.max(0, elapsed));
  }
}
