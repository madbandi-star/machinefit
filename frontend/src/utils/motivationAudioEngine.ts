import { playHtmlAudio, sameMediaUrl } from '@/utils/motivationAudio';

export type MotivationPlaybackPhase =
  | 'idle'
  | 'opening'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'failed'
  | 'ended';

export type MotivationMediaFailReason =
  | 'AUTOPLAY_BLOCKED'
  | 'USER_GESTURE_REQUIRED'
  | 'MEDIA_NOT_FOUND'
  | 'MEDIA_LOAD_ERROR'
  | 'NETWORK_ERROR'
  | 'UNSUPPORTED_FORMAT'
  | 'BROWSER_RESTRICTION'
  | 'ABORTED'
  | 'TIMEOUT'
  | 'UNKNOWN';

let sharedAudio: HTMLAudioElement | null = null;
let userPaused = false;
let lastFailToastAt = 0;
let lastFailToastKey = '';

/** App-lifetime audio element — survives Header remounts. */
export function getMotivationAudio(): HTMLAudioElement {
  if (typeof Audio === 'undefined') {
    throw new Error('Audio unavailable');
  }
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = 'metadata';
    sharedAudio.muted = false;
    sharedAudio.defaultMuted = false;
    sharedAudio.volume = 1;
    sharedAudio.setAttribute('playsinline', 'true');
    // Hint browsers this is intentional media, not muted autoplay.
    sharedAudio.setAttribute('data-mf-motivation-audio', '1');
  }
  return sharedAudio;
}

export function isMotivationUserPaused(): boolean {
  return userPaused;
}

export function setMotivationUserPaused(next: boolean): void {
  userPaused = next;
}

export function classifyMotivationMediaError(error: unknown): MotivationMediaFailReason {
  if (!error || typeof error !== 'object') return 'UNKNOWN';
  const name = String((error as { name?: string }).name ?? '');
  const message = String((error as { message?: string }).message ?? '').toLowerCase();
  const code = (error as { code?: number }).code;

  if (name === 'AbortError' || message.includes('aborted')) return 'ABORTED';
  if (name === 'NotAllowedError') {
    if (message.includes('gesture') || message.includes('user')) return 'USER_GESTURE_REQUIRED';
    return 'AUTOPLAY_BLOCKED';
  }
  if (name === 'NotSupportedError') return 'UNSUPPORTED_FORMAT';
  if (name === 'NetworkError' || message.includes('network')) return 'NETWORK_ERROR';
  if (message.includes('timeout')) return 'TIMEOUT';
  if (message.includes('failed to load') || message.includes('media failed')) return 'MEDIA_LOAD_ERROR';
  if (message.includes('404') || message.includes('not found')) return 'MEDIA_NOT_FOUND';

  // HTMLMediaElement.error codes when wrapped
  if (code === 1) return 'ABORTED';
  if (code === 2) return 'NETWORK_ERROR';
  if (code === 3) return 'MEDIA_LOAD_ERROR';
  if (code === 4) return 'UNSUPPORTED_FORMAT';

  return 'UNKNOWN';
}

/** i18n key under common:motivation.* */
export function motivationFailToastKey(reason: MotivationMediaFailReason): string {
  switch (reason) {
    case 'AUTOPLAY_BLOCKED':
    case 'USER_GESTURE_REQUIRED':
      return 'motivation.failAutoplay';
    case 'NETWORK_ERROR':
      return 'motivation.failNetwork';
    case 'MEDIA_NOT_FOUND':
    case 'MEDIA_LOAD_ERROR':
      return 'motivation.failLoad';
    case 'UNSUPPORTED_FORMAT':
      return 'motivation.failFormat';
    case 'TIMEOUT':
      return 'motivation.failTimeout';
    case 'BROWSER_RESTRICTION':
      return 'motivation.failBrowser';
    case 'ABORTED':
      return 'motivation.failAborted';
    default:
      return 'motivation.playFailed';
  }
}

export function shouldShowMotivationFailToast(reason: MotivationMediaFailReason): boolean {
  if (reason === 'ABORTED') return false;
  const key = motivationFailToastKey(reason);
  const now = Date.now();
  if (key === lastFailToastKey && now - lastFailToastAt < 3500) return false;
  lastFailToastKey = key;
  lastFailToastAt = now;
  return true;
}

export type MotivationPlayResult =
  | { ok: true }
  | { ok: false; reason: MotivationMediaFailReason; error: unknown };

/**
 * Ensure unmuted defaults, load if needed, await play().
 * Call from a user gesture when possible.
 */
export async function playMotivationTrack(
  url: string,
  options?: { signal?: AbortSignal }
): Promise<MotivationPlayResult> {
  const trimmed = url.trim();
  if (!trimmed) {
    return { ok: false, reason: 'MEDIA_NOT_FOUND', error: new Error('empty url') };
  }
  if (typeof window !== 'undefined' && !window.navigator.onLine) {
    return { ok: false, reason: 'NETWORK_ERROR', error: new Error('offline') };
  }

  const audio = getMotivationAudio();
  audio.muted = false;
  audio.defaultMuted = false;
  if (!Number.isFinite(audio.volume) || audio.volume <= 0) {
    audio.volume = 1;
  }
  userPaused = false;

  try {
    await playHtmlAudio(audio, trimmed, options);
    if (audio.paused) {
      // Some browsers resolve play() then immediately pause under policy.
      return { ok: false, reason: 'AUTOPLAY_BLOCKED', error: new Error('paused after play') };
    }
    return { ok: true };
  } catch (error) {
    const reason = classifyMotivationMediaError(error);
    return { ok: false, reason, error };
  }
}

export function pauseMotivationAudio(fromUser: boolean): void {
  userPaused = fromUser;
  const audio = sharedAudio;
  if (!audio) return;
  audio.pause();
}

export function stopMotivationAudio(): void {
  userPaused = true;
  const audio = sharedAudio;
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

export function updateMotivationMediaSession(meta: {
  title: string;
  artist?: string;
  artworkUrl?: string | null;
  handlers: {
    play?: () => void;
    pause?: () => void;
    previoustrack?: () => void;
    nexttrack?: () => void;
  };
}): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    const artwork = meta.artworkUrl
      ? [{ src: meta.artworkUrl, sizes: '512x512', type: 'image/jpeg' }]
      : [];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: meta.title,
      artist: meta.artist ?? 'MachineFit',
      album: 'Motivation',
      artwork,
    });
    const set = (action: MediaSessionAction, handler: (() => void) | undefined) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler ?? null);
      } catch {
        /* unsupported action */
      }
    };
    set('play', meta.handlers.play);
    set('pause', meta.handlers.pause);
    set('previoustrack', meta.handlers.previoustrack);
    set('nexttrack', meta.handlers.nexttrack);
  } catch {
    /* ignore */
  }
}

export function setMotivationMediaSessionPlaybackState(
  state: 'none' | 'paused' | 'playing'
): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.playbackState = state;
  } catch {
    /* ignore */
  }
}

export function bindMotivationAudioSrc(url: string): void {
  const audio = getMotivationAudio();
  if (sameMediaUrl(audio.src, url)) return;
  audio.src = url;
  audio.preload = 'metadata';
  audio.load();
}

/** Dev-only media diagnostics. */
export function logMotivationMedia(event: string, meta?: Record<string, unknown>): void {
  if (typeof import.meta === 'undefined' || !import.meta.env?.DEV) return;
  // eslint-disable-next-line no-console
  console.info('[MEDIA]', event, meta ?? {});
}
