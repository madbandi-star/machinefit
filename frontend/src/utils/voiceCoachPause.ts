/**
 * Pause gate for voice-count / hold flows.
 * Sleeps and cue waits freeze while paused; Stop still uses AbortSignal.
 *
 * While the screen is locked / tab hidden, browsers throttle nested setTimeout
 * slices (often to ~1s). That stretched rep gaps far beyond the visible-screen
 * baseline. Hidden gaps therefore use a silent HTMLAudio media clock so the
 * interval matches the on-screen `gapAfterMs`.
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

function isDocumentHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

/** Silent PCM WAV object URL for media-clock sleeps under screen lock. */
function buildSilentWavObjectUrl(durationSec: number): string {
  const sampleRate = 8000;
  const seconds = Math.max(0.04, durationSec);
  const numSamples = Math.max(1, Math.round(sampleRate * seconds));
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

/**
 * Wait `ms` using HTMLAudio duration (keeps running under screen lock).
 * Returns elapsed ms actually waited; `completed` false if paused/failed early.
 */
async function sleepViaMediaClock(
  ms: number,
  signal?: AbortSignal
): Promise<{ completed: boolean; elapsedMs: number }> {
  if (ms <= 0) return { completed: true, elapsedMs: 0 };
  if (typeof window === 'undefined') return { completed: false, elapsedMs: 0 };

  const url = buildSilentWavObjectUrl(ms / 1000);
  const audio = new Audio(url);
  audio.preload = 'auto';
  audio.volume = 0.01;
  audio.setAttribute('playsinline', 'true');
  (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
  // Skip motivation ducking / identify as coach timing media.
  audio.dataset.mfVoiceCoachGap = '1';
  audio.dataset.mfVoiceCoachClip = '1';

  return new Promise<{ completed: boolean; elapsedMs: number }>((resolve, reject) => {
    let settled = false;
    let watchdog: number | null = null;

    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
      audio.ontimeupdate = null;
      if (watchdog != null) window.clearTimeout(watchdog);
      try {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      } catch {
        // ignore
      }
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    };

    const finish = (completed: boolean) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', onAbort);
      const mediaMs = Math.max(0, (Number(audio.currentTime) || 0) * 1000);
      const elapsedMs = completed ? ms : Math.min(ms, mediaMs);
      cleanup();
      resolve({ completed, elapsedMs });
    };

    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new DOMException('Aborted', 'AbortError'));
    };

    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);
    audio.ontimeupdate = () => {
      if (getActiveVoiceCoachPause()?.isPaused) {
        finish(false);
      }
    };

    signal?.addEventListener('abort', onAbort, { once: true });

    void audio
      .play()
      .then(() => {
        // Backup if `ended` is dropped after an audio-focus blip. Media clock
        // should win first; this is wall-clock and may lag while locked.
        watchdog = window.setTimeout(() => finish(true), ms + 600);
      })
      .catch(() => finish(false));
  });
}

/** Single timer — better than 80ms slices when background timer min-delay is ~1s. */
function sleepOneShot(ms: number, signal?: AbortSignal): Promise<void> {
  const delay = Math.max(0, ms);
  if (delay <= 0) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, delay);
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function sleepVisibleSlices(ms: number, signal?: AbortSignal): Promise<void> {
  let remaining = Math.max(0, ms);

  while (remaining > 0) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const pause = getActiveVoiceCoachPause();
    await pause?.waitWhilePaused(signal);

    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    // Visibility flipped to hidden mid-gap — switch to media clock for the rest.
    if (isDocumentHidden()) {
      await sleepHiddenGap(remaining, signal);
      return;
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

    // If we entered pause during the slice, do not consume remaining time.
    if (getActiveVoiceCoachPause()?.isPaused) {
      continue;
    }

    // Cap elapsed so a thawed background timer does not burn the whole gap at once
    // (which stacked the next count cue on top of a still-playing clip).
    const elapsed = performance.now() - started;
    remaining -= Math.min(slice + 16, Math.max(0, elapsed));
  }
}

async function sleepHiddenGap(ms: number, signal?: AbortSignal): Promise<void> {
  let remaining = Math.max(0, ms);

  while (remaining > 0) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const pause = getActiveVoiceCoachPause();
    await pause?.waitWhilePaused(signal);

    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    // Screen unlocked mid-gap — finish with visible pacing.
    if (!isDocumentHidden()) {
      await sleepVisibleSlices(remaining, signal);
      return;
    }

    const media = await sleepViaMediaClock(remaining, signal);
    if (getActiveVoiceCoachPause()?.isPaused) {
      // Partial wait before pause — keep leftover for after resume.
      remaining = Math.max(0, remaining - media.elapsedMs);
      continue;
    }

    if (media.completed) {
      remaining = 0;
      return;
    }

    if (media.elapsedMs > 0) {
      remaining = Math.max(0, remaining - media.elapsedMs);
      continue;
    }

    // Media play failed (autoplay / focus). One-shot timeout approximates the
    // visible gap better than 80ms slices under ~1s background throttling.
    await sleepOneShot(remaining, signal);
    if (getActiveVoiceCoachPause()?.isPaused) {
      continue;
    }
    remaining = 0;
  }
}

/** Abort-aware sleep that freezes while the active voice-coach pause is on. */
export async function sleepWithVoiceCoachPause(
  ms: number,
  signal?: AbortSignal
): Promise<void> {
  const total = Math.max(0, ms);
  if (total <= 0) return;

  if (isDocumentHidden()) {
    await sleepHiddenGap(total, signal);
    return;
  }

  await sleepVisibleSlices(total, signal);
}
