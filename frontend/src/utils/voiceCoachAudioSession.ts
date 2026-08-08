/**
 * Keeps voice-coach audio alive while music plays or the screen is locked.
 * Uses a looping silent HTMLAudio keep-alive (media session pipeline),
 * Media Session "playing" assertion, speechSynthesis resume watchdog,
 * Screen Wake Lock, and motivation-music ducking.
 *
 * Note: Web Audio (AudioContext) is often suspended on mobile screen lock.
 * Count clips should prefer HTMLAudio while hidden — see voiceCoachClips.ts.
 */

const DUCK_VOLUME = 0.18;
const RESUME_WATCHDOG_VISIBLE_MS = 4_000;
const RESUME_WATCHDOG_HIDDEN_MS = 1_000;

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
};

let keepAliveAudio: HTMLAudioElement | null = null;
let keepAliveObjectUrl: string | null = null;
let resumeTimer: number | null = null;
let wakeLock: WakeLockSentinelLike | null = null;
let sessionActive = false;
let visibilityBound = false;
let mediaHandlersBound = false;

/** Build a short silent WAV so the OS treats us as an active media session. */
function buildSilentWavObjectUrl(seconds = 2): string {
  const sampleRate = 8000;
  const numSamples = sampleRate * seconds;
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
  // PCM samples already zero-filled
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

function ensureKeepAliveAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!keepAliveAudio) {
    if (!keepAliveObjectUrl) {
      keepAliveObjectUrl = buildSilentWavObjectUrl(2);
    }
    const audio = new Audio(keepAliveObjectUrl);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.01;
    audio.setAttribute('playsinline', 'true');
    // Help Chromium treat this as media that may play in background.
    audio.setAttribute('aria-hidden', 'true');
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
    } else if (audio.ended) {
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

async function resumeAudioContextBestEffort(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const { ensureVoiceCoachAudioRunning } = await import('@/utils/voiceCoachClips');
    await ensureVoiceCoachAudioRunning();
  } catch {
    // ignore
  }
}

function watchdogIntervalMs(): number {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    return RESUME_WATCHDOG_HIDDEN_MS;
  }
  return RESUME_WATCHDOG_VISIBLE_MS;
}

function startResumeWatchdog(): void {
  if (resumeTimer != null) {
    window.clearInterval(resumeTimer);
    resumeTimer = null;
  }
  resumeTimer = window.setInterval(() => {
    if (!sessionActive) return;
    resumeSpeechSynthesis();
    void startSilentKeepAlive();
    void resumeAudioContextBestEffort();
    setMediaSessionPlaying(true);
    // Re-arm at the right cadence if visibility flipped.
    if (resumeTimer != null) {
      const expected = watchdogIntervalMs();
      // Recreate interval when cadence should change (hidden ↔ visible).
      // Cheap: only restart when mismatch by checking dataset flag.
      const audio = keepAliveAudio;
      const mark = audio?.dataset.mfWatchdogMs;
      if (mark !== String(expected)) {
        if (audio) audio.dataset.mfWatchdogMs = String(expected);
        startResumeWatchdog();
      }
    }
  }, watchdogIntervalMs());
  if (keepAliveAudio) {
    keepAliveAudio.dataset.mfWatchdogMs = String(watchdogIntervalMs());
  }
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
    wakeLock.release?.bind?.(wakeLock);
    // Some browsers release wake lock on visibility change — reacquire on show.
    const sentinel = wakeLock as WakeLockSentinelLike & {
      addEventListener?: (type: string, listener: () => void) => void;
    };
    sentinel.addEventListener?.('release', () => {
      wakeLock = null;
      if (sessionActive && document.visibilityState === 'visible') {
        void acquireWakeLock();
      }
    });
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

function bindMediaSessionHandlers(): void {
  if (mediaHandlersBound || typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }
  const session = navigator.mediaSession;
  const keepPlaying = () => {
    if (!sessionActive) return;
    setMediaSessionPlaying(true);
    void startSilentKeepAlive();
    void resumeAudioContextBestEffort();
    resumeSpeechSynthesis();
  };
  try {
    // Lock-screen "pause" must not stop the coach — re-assert playing so count continues.
    session.setActionHandler('play', keepPlaying);
    session.setActionHandler('pause', keepPlaying);
    session.setActionHandler('stop', () => {
      // OS stop: still try to keep session warm; user Stop uses in-app control.
      keepPlaying();
    });
    mediaHandlersBound = true;
  } catch {
    // Some browsers reject unsupported action names.
  }
}

function unbindMediaSessionHandlers(): void {
  if (!mediaHandlersBound || typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }
  try {
    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);
    navigator.mediaSession.setActionHandler('stop', null);
  } catch {
    // ignore
  }
  mediaHandlersBound = false;
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
    if (el.dataset.mfVoiceCoachClip === '1') return;
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
    void resumeAudioContextBestEffort();
    void acquireWakeLock();
    setMediaSessionPlaying(true);
    startResumeWatchdog();
  } else {
    // Screen lock / background: keep media pipeline + HTMLAudio path alive.
    resumeSpeechSynthesis();
    void startSilentKeepAlive();
    void resumeAudioContextBestEffort();
    setMediaSessionPlaying(true);
    startResumeWatchdog();
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
  bindMediaSessionHandlers();
  duckMotivationMusic(true);
  setMediaSessionPlaying(true);
  startResumeWatchdog();
  // Keep-alive play must stay in the gesture turn; do not await wake lock —
  // that delayed unlock past the 120–400ms start race and silenced first Start.
  await startSilentKeepAlive();
  resumeSpeechSynthesis();
  void acquireWakeLock();
}

export async function endVoiceCoachAudioSession(): Promise<void> {
  sessionActive = false;
  stopResumeWatchdog();
  stopSilentKeepAlive();
  setMediaSessionPlaying(false);
  duckMotivationMusic(false);
  unbindMediaSessionHandlers();
  await releaseWakeLock();
  unbindVisibility();
}

export function isVoiceCoachAudioSessionActive(): boolean {
  return sessionActive;
}

/** True when OS likely suspends Web Audio — prefer HTMLAudio for count clips. */
export function voiceCoachShouldPreferHtmlAudio(): boolean {
  if (!sessionActive) return false;
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    return true;
  }
  return false;
}

/** Nudge TTS after gaps / OS interruptions. */
export function nudgeVoiceCoachSpeech(): void {
  if (!sessionActive) return;
  resumeSpeechSynthesis();
  void startSilentKeepAlive();
  setMediaSessionPlaying(true);
}
