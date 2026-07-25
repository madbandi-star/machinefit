/**
 * Keeps voice-coach audio alive while music plays or the app is backgrounded.
 * Uses a silent HTMLAudio keep-alive (media pipeline), speechSynthesis resume
 * watchdog, Screen Wake Lock, and motivation-music ducking.
 */

const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';

const DUCK_VOLUME = 0.18;
const RESUME_WATCHDOG_MS = 4_000;

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
};

let keepAliveAudio: HTMLAudioElement | null = null;
let resumeTimer: number | null = null;
let wakeLock: WakeLockSentinelLike | null = null;
let sessionActive = false;
let visibilityBound = false;

function ensureKeepAliveAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!keepAliveAudio) {
    const audio = new Audio(SILENT_WAV);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.01;
    audio.setAttribute('playsinline', 'true');
    keepAliveAudio = audio;
  }
  return keepAliveAudio;
}

async function startSilentKeepAlive(): Promise<void> {
  const audio = ensureKeepAliveAudio();
  if (!audio) return;
  try {
    if (audio.paused) {
      audio.currentTime = 0;
      await audio.play();
    }
  } catch {
    // Autoplay may fail outside a gesture; unlockVoiceCoachAudio runs in gesture.
  }
}

function stopSilentKeepAlive(): void {
  if (!keepAliveAudio) return;
  try {
    keepAliveAudio.pause();
    keepAliveAudio.currentTime = 0;
  } catch {
    // ignore
  }
}

function resumeSpeechSynthesis(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    // Chrome pauses TTS after ~15s / on hide; resume keeps the queue moving.
    if (window.speechSynthesis.paused || window.speechSynthesis.speaking) {
      window.speechSynthesis.resume();
    } else if (window.speechSynthesis.pending) {
      window.speechSynthesis.resume();
    }
  } catch {
    // ignore
  }
}

function startResumeWatchdog(): void {
  if (resumeTimer != null) return;
  resumeTimer = window.setInterval(() => {
    if (!sessionActive) return;
    resumeSpeechSynthesis();
    void startSilentKeepAlive();
  }, RESUME_WATCHDOG_MS);
}

function stopResumeWatchdog(): void {
  if (resumeTimer == null) return;
  window.clearInterval(resumeTimer);
  resumeTimer = null;
}

async function acquireWakeLock(): Promise<void> {
  if (typeof navigator === 'undefined') return;
  const nav = navigator as Navigator & {
    wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
  };
  if (!nav.wakeLock?.request) return;
  if (document.visibilityState !== 'visible') return;
  try {
    if (wakeLock && !wakeLock.released) return;
    wakeLock = await nav.wakeLock.request('screen');
  } catch {
    wakeLock = null;
  }
}

async function releaseWakeLock(): Promise<void> {
  if (!wakeLock) return;
  try {
    if (!wakeLock.released) await wakeLock.release();
  } catch {
    // ignore
  }
  wakeLock = null;
}

function setMediaSessionPlaying(playing: boolean): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    if (playing) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'MachineFit Voice Coach',
        artist: 'MachineFit',
        album: 'Workout',
      });
      navigator.mediaSession.playbackState = 'playing';
    } else if (navigator.mediaSession.playbackState === 'playing') {
      navigator.mediaSession.playbackState = 'none';
    }
  } catch {
    // ignore
  }
}

function duckMotivationMusic(active: boolean): void {
  if (typeof document === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('machinefit:voice-coach-audio', {
      detail: { active, duckVolume: DUCK_VOLUME },
    })
  );

  // Fallback: duck any currently playing <audio> elements (motivation player).
  document.querySelectorAll('audio').forEach((node) => {
    const el = node as HTMLAudioElement;
    if (el === keepAliveAudio) return;
    if (active) {
      if (el.dataset.mfVoiceDuck == null) {
        el.dataset.mfVoiceDuck = String(el.volume);
      }
      const prev = Number(el.dataset.mfVoiceDuck);
      if (Number.isFinite(prev) && prev > DUCK_VOLUME) {
        el.volume = DUCK_VOLUME;
      }
    } else if (el.dataset.mfVoiceDuck != null) {
      const prev = Number(el.dataset.mfVoiceDuck);
      el.volume = Number.isFinite(prev) ? prev : 1;
      delete el.dataset.mfVoiceDuck;
    }
  });
}

function onVisibilityChange(): void {
  if (!sessionActive) return;
  if (document.visibilityState === 'visible') {
    resumeSpeechSynthesis();
    void startSilentKeepAlive();
    void acquireWakeLock();
  } else {
    // Keep media pipeline warm while backgrounded / app switched away.
    resumeSpeechSynthesis();
    void startSilentKeepAlive();
  }
}

function bindVisibility(): void {
  if (visibilityBound || typeof document === 'undefined') return;
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pageshow', onVisibilityChange);
  window.addEventListener('focus', onVisibilityChange);
  visibilityBound = true;
}

function unbindVisibility(): void {
  if (!visibilityBound || typeof document === 'undefined') return;
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('pageshow', onVisibilityChange);
  window.removeEventListener('focus', onVisibilityChange);
  visibilityBound = false;
}

/** Call from a user-gesture before/at voice-coach start. */
export async function beginVoiceCoachAudioSession(): Promise<void> {
  sessionActive = true;
  bindVisibility();
  duckMotivationMusic(true);
  setMediaSessionPlaying(true);
  startResumeWatchdog();
  await startSilentKeepAlive();
  await acquireWakeLock();
  resumeSpeechSynthesis();
}

export async function endVoiceCoachAudioSession(): Promise<void> {
  sessionActive = false;
  stopResumeWatchdog();
  stopSilentKeepAlive();
  setMediaSessionPlaying(false);
  duckMotivationMusic(false);
  await releaseWakeLock();
  unbindVisibility();
}

export function isVoiceCoachAudioSessionActive(): boolean {
  return sessionActive;
}

/** Nudge TTS after gaps / OS interruptions. */
export function nudgeVoiceCoachSpeech(): void {
  if (!sessionActive) return;
  resumeSpeechSynthesis();
}
