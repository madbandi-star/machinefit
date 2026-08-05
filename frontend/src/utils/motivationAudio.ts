const AUDIO_ACCEPT =
  'audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/m4a,audio/aac,audio/wav,audio/wave,audio/x-wav,audio/ogg,audio/vorbis,.mp3,.m4a,.aac,.wav,.ogg';

export const MOTIVATION_AUDIO_ACCEPT = AUDIO_ACCEPT;

export const MOTIVATION_AUDIO_EXTENSIONS = ['mp3', 'm4a', 'aac', 'wav', 'ogg'] as const;

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '—';
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/** Compare audio element src vs stored media URL (browser always absolutizes `audio.src`). */
export function sameMediaUrl(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = (a ?? '').trim();
  const right = (b ?? '').trim();
  if (!left || !right) return false;
  if (left === right) return true;
  try {
    const base =
      typeof window !== 'undefined' && window.location?.href
        ? window.location.href
        : 'https://machinefit.local/';
    return new URL(left, base).href === new URL(right, base).href;
  } catch {
    return false;
  }
}

/** Interrupted play() / autoplay races — not a real media failure. */
export function isBenignAudioPlayError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = String((error as { name?: string }).name ?? '');
  if (name === 'AbortError') return true;
  // Some browsers surface interrupted loads as NotAllowedError briefly during src swaps.
  if (name === 'NotAllowedError') {
    const message = String((error as { message?: string }).message ?? '').toLowerCase();
    if (message.includes('interrupted') || message.includes('aborted')) return true;
  }
  return false;
}

/**
 * Set src (if needed), wait until the element can play, then start playback.
 * Avoids false failures from calling play() immediately after load().
 */
export async function playHtmlAudio(
  audio: HTMLAudioElement,
  url: string,
  options?: { signal?: AbortSignal }
): Promise<void> {
  const signal = options?.signal;
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const waitForCanPlay = () =>
    new Promise<void>((resolve, reject) => {
      if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        resolve();
        return;
      }

      let settled = false;
      const cleanup = () => {
        audio.removeEventListener('canplay', onReady);
        audio.removeEventListener('loadeddata', onReady);
        audio.removeEventListener('error', onError);
        signal?.removeEventListener('abort', onAbort);
        window.clearTimeout(timer);
      };
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        cleanup();
        fn();
      };
      const onReady = () => finish(() => resolve());
      const onError = () =>
        finish(() => reject(new DOMException('Media failed to load', 'NotSupportedError')));
      const onAbort = () => finish(() => reject(new DOMException('Aborted', 'AbortError')));

      audio.addEventListener('canplay', onReady, { once: true });
      audio.addEventListener('loadeddata', onReady, { once: true });
      audio.addEventListener('error', onError, { once: true });
      signal?.addEventListener('abort', onAbort, { once: true });

      const timer = window.setTimeout(() => {
        // Soft timeout: try play anyway — some browsers never fire canplay for short clips.
        finish(() => resolve());
      }, 10_000);
    });

  if (!sameMediaUrl(audio.src, url)) {
    audio.src = url;
    audio.load();
    await waitForCanPlay();
  } else if (audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
    await waitForCanPlay();
  }

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  await audio.play();
}

export function formatUploadDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale.startsWith('ko') ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function extensionOf(filename: string): string | null {
  const match = /\.([a-z0-9]+)$/i.exec(filename.trim());
  return match ? match[1].toLowerCase() : null;
}

export function isAllowedMotivationAudioFile(file: File): boolean {
  const ext = extensionOf(file.name);
  if (!ext || !(MOTIVATION_AUDIO_EXTENSIONS as readonly string[]).includes(ext)) {
    return false;
  }
  return true;
}

export function readAudioDurationSeconds(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = 'metadata';

    const cleanup = () => {
      URL.revokeObjectURL(url);
      audio.removeAttribute('src');
      audio.load();
    };

    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : null;
      cleanup();
      resolve(duration);
    };
    audio.onerror = () => {
      cleanup();
      resolve(null);
    };
    audio.src = url;
  });
}

export function getApiErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const response = (error as { response?: { data?: { error?: { code?: string } } } }).response;
  return response?.data?.error?.code ?? null;
}
