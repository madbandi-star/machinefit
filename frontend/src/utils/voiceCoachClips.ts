/**
 * Pre-recorded Korean voice-coach clips (Web Audio primary, HTMLAudio fallback).
 * Used for countdown / start / reps / one-more so count works when OS TTS is silent.
 */

export const VOICE_COACH_PACKS = ['female', 'male'] as const;
export type VoiceCoachPack = (typeof VOICE_COACH_PACKS)[number];
export const DEFAULT_VOICE_COACH_PACK: VoiceCoachPack = 'female';

/**
 * Bump when shipping replacement clip audio so browsers / CDNs drop stale files
 * (old male pack was Korean and kept playing from disk cache).
 */
export const VOICE_COACH_CLIP_ASSET_VERSION = 'en-male-3';

/** Highest `rep-N.mp3` shipped under public/voice-coach. */
export const MAX_VOICE_COACH_CLIP_REP = 30;

/** Highest `cd-N.mp3` shipped (prep 10 → 1 all use spoken clips). */
export const MAX_VOICE_COACH_CLIP_COUNTDOWN = 10;

const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';

let sharedAudioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentHtmlAudio: HTMLAudioElement | null = null;
/** HTMLAudio warmed during a user gesture — can play later without a fresh tap. */
let warmedHtmlAudio: HTMLAudioElement | null = null;
const clipBufferCache = new Map<string, AudioBuffer>();
const clipBufferInflight = new Map<string, Promise<AudioBuffer | null>>();

/** Settle the in-flight clip promise when stopVoiceCoachClips() interrupts playback. */
let pendingClipSettle: ((played: boolean) => void) | null = null;
/** Bumped on stop/supersede so playVoiceCoachClip won't HTML-fallback after interrupt. */
let clipGeneration = 0;
/** Last pack unlocked — used to drop decoded buffers when switching female↔male. */
let lastUnlockedPack: VoiceCoachPack | null = null;

export function normalizeVoiceCoachPack(value: unknown): VoiceCoachPack {
  return value === 'male' ? 'male' : DEFAULT_VOICE_COACH_PACK;
}

function publicAssetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.replace(/^\//, '');
  return `${normalizedBase}${normalizedPath}`;
}

export function voiceCoachClipUrl(
  key: string,
  pack: VoiceCoachPack = DEFAULT_VOICE_COACH_PACK
): string {
  const base = publicAssetUrl(
    `voice-coach/${normalizeVoiceCoachPack(pack)}/${key}.mp3`
  );
  return `${base}?v=${VOICE_COACH_CLIP_ASSET_VERSION}`;
}

/** Drop decoded / in-flight clip buffers (pack switch or asset version bump). */
export function clearVoiceCoachClipBufferCache(): void {
  clipBufferCache.clear();
  clipBufferInflight.clear();
}

export function countdownClipKey(n: number): string | null {
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1 || rounded > MAX_VOICE_COACH_CLIP_COUNTDOWN) return null;
  return `cd-${rounded}`;
}

export function repClipKey(n: number): string | null {
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1 || rounded > MAX_VOICE_COACH_CLIP_REP) return null;
  return `rep-${rounded}`;
}

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new Ctx();
  }
  return sharedAudioCtx;
}

export async function ensureVoiceCoachAudioRunning(): Promise<AudioContext | null> {
  const ctx = getSharedAudioContext();
  if (!ctx) return null;
  const state = ctx.state as string;
  if (state === 'suspended' || state === 'interrupted') {
    try {
      await ctx.resume();
    } catch {
      return null;
    }
  }
  return ctx.state === 'closed' ? null : ctx;
}

function settlePendingClip(played: boolean): void {
  const settle = pendingClipSettle;
  pendingClipSettle = null;
  settle?.(played);
}

export function stopVoiceCoachClips(): void {
  clipGeneration += 1;
  if (currentHtmlAudio) {
    try {
      currentHtmlAudio.onended = null;
      currentHtmlAudio.onerror = null;
      currentHtmlAudio.pause();
      currentHtmlAudio.removeAttribute('src');
      currentHtmlAudio.load();
    } catch {
      // ignore
    }
    currentHtmlAudio = null;
  }
  if (currentSource) {
    try {
      currentSource.onended = null;
      currentSource.stop();
    } catch {
      // already stopped
    }
    try {
      currentSource.disconnect();
    } catch {
      // ignore
    }
    currentSource = null;
  }
  // Critical: never leave playVoiceCoachClip() awaiting onended forever after stop.
  settlePendingClip(false);
}

async function loadClipBuffer(url: string, ctx: AudioContext): Promise<AudioBuffer | null> {
  const cached = clipBufferCache.get(url);
  if (cached) return cached;

  const inflight = clipBufferInflight.get(url);
  if (inflight) return inflight;

  const task = (async (): Promise<AudioBuffer | null> => {
    try {
      const response = await fetch(url, { cache: 'force-cache' });
      if (!response.ok) return null;
      const data = await response.arrayBuffer();
      // Copy — decodeAudioData may detach the original buffer.
      const copy = data.slice(0);
      const buffer = await ctx.decodeAudioData(copy);
      clipBufferCache.set(url, buffer);
      return buffer;
    } catch {
      return null;
    } finally {
      clipBufferInflight.delete(url);
    }
  })();

  clipBufferInflight.set(url, task);
  return task;
}

function playHtmlAudioClip(url: string, signal?: AbortSignal): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    settlePendingClip(false);

    const audio = warmedHtmlAudio ?? new Audio();
    warmedHtmlAudio = audio;
    audio.preload = 'auto';
    audio.volume = 1;
    audio.src = url;
    currentHtmlAudio = audio;

    let settled = false;
    const finish = (played: boolean) => {
      if (settled) return;
      settled = true;
      if (pendingClipSettle === settleFromStop) pendingClipSettle = null;
      signal?.removeEventListener('abort', onAbort);
      audio.onended = null;
      audio.onerror = null;
      if (currentHtmlAudio === audio) currentHtmlAudio = null;
      resolve(played);
    };

    const settleFromStop = (played: boolean) => finish(played);
    pendingClipSettle = settleFromStop;

    const onAbort = () => {
      try {
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
      } catch {
        // ignore
      }
      if (currentHtmlAudio === audio) currentHtmlAudio = null;
      if (pendingClipSettle === settleFromStop) pendingClipSettle = null;
      settled = true;
      signal?.removeEventListener('abort', onAbort);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);

    signal?.addEventListener('abort', onAbort, { once: true });
    void audio.play().catch(() => finish(false));
  });
}

/**
 * Play a pre-recorded clip via Web Audio so playback keeps working after the
 * long rep-gap (HTMLAudioElement.play() often fails once the user-gesture window ends).
 * Falls back to HTMLAudio when decode/Web Audio fails.
 *
 * Does NOT call speechManager.cancel() — that used to AbortError an in-flight
 * TTS cue ("준비") / race with rest-tip teardown and kill the whole session.
 */
export async function playVoiceCoachClip(
  key: string,
  signal?: AbortSignal,
  pack: VoiceCoachPack = DEFAULT_VOICE_COACH_PACK
): Promise<boolean> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // Supersede any prior clip without treating this call as "externally stopped".
  const priorSettle = pendingClipSettle;
  pendingClipSettle = null;
  priorSettle?.(false);
  if (currentSource || currentHtmlAudio) {
    // Stop hardware playback only — do not bump generation for our own replace.
    if (currentHtmlAudio) {
      try {
        currentHtmlAudio.onended = null;
        currentHtmlAudio.onerror = null;
        currentHtmlAudio.pause();
        currentHtmlAudio.removeAttribute('src');
        currentHtmlAudio.load();
      } catch {
        // ignore
      }
      currentHtmlAudio = null;
    }
    if (currentSource) {
      try {
        currentSource.onended = null;
        currentSource.stop();
      } catch {
        // ignore
      }
      try {
        currentSource.disconnect();
      } catch {
        // ignore
      }
      currentSource = null;
    }
  }

  const generation = clipGeneration;
  const url = voiceCoachClipUrl(key, pack);

  const ctx = await ensureVoiceCoachAudioRunning();
  if (ctx && generation === clipGeneration) {
    const buffer = await loadClipBuffer(url, ctx);
    if (buffer && generation === clipGeneration) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      const played = await new Promise<boolean>((resolve, reject) => {
        if (generation !== clipGeneration) {
          resolve(false);
          return;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        currentSource = source;

        let settled = false;
        const finish = (value: boolean) => {
          if (settled) return;
          settled = true;
          if (pendingClipSettle === settleFromStop) pendingClipSettle = null;
          signal?.removeEventListener('abort', onAbort);
          source.onended = null;
          if (currentSource === source) currentSource = null;
          if (endedWatchdog) window.clearTimeout(endedWatchdog);
          resolve(value);
        };

        const settleFromStop = (value: boolean) => finish(value);
        pendingClipSettle = settleFromStop;

        const onAbort = () => {
          try {
            source.onended = null;
            source.stop();
          } catch {
            // ignore
          }
          if (currentSource === source) currentSource = null;
          if (pendingClipSettle === settleFromStop) pendingClipSettle = null;
          settled = true;
          if (endedWatchdog) window.clearTimeout(endedWatchdog);
          signal?.removeEventListener('abort', onAbort);
          reject(new DOMException('Aborted', 'AbortError'));
        };

        source.onended = () => finish(true);
        signal?.addEventListener('abort', onAbort, { once: true });

        // Some WebViews skip onended after audio-focus blips — don't hang the coach.
        const endedWatchdog = window.setTimeout(
          () => finish(true),
          Math.min(12_000, Math.max(800, buffer.duration * 1000 + 400))
        );

        try {
          source.start(0);
        } catch {
          finish(false);
        }
      });
      if (played) return true;
      // Interrupted by stopVoiceCoachClips — do not restart via HTMLAudio.
      if (generation !== clipGeneration) return false;
    }
  }

  if (generation !== clipGeneration || signal?.aborted) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    return false;
  }

  return playHtmlAudioClip(url, signal);
}

export async function preloadVoiceCoachClips(options: {
  reps: number;
  oneMoreEnabled: boolean;
  prepCount: number;
  pack?: VoiceCoachPack;
  /** Preload hold cue + finish + countdown ticks for hold segment. */
  includeHold?: boolean;
  holdDurationSec?: number;
  signal?: AbortSignal;
}): Promise<void> {
  const pack = normalizeVoiceCoachPack(options.pack);
  const ctx = await ensureVoiceCoachAudioRunning();
  if (!ctx) return;

  const keys: string[] = ['start'];
  if (options.oneMoreEnabled) keys.push('one-more');

  const prep = Math.max(1, Math.round(options.prepCount));
  for (let n = 1; n <= Math.min(prep, MAX_VOICE_COACH_CLIP_COUNTDOWN); n += 1) {
    keys.push(`cd-${n}`);
  }

  const maxRep = Math.min(MAX_VOICE_COACH_CLIP_REP, Math.max(1, Math.round(options.reps)));
  for (let rep = 1; rep <= maxRep; rep += 1) {
    keys.push(`rep-${rep}`);
  }

  if (options.includeHold) {
    keys.push('hold', 'finish-done', 'finish-great', 'finish-nice');
    const holdSec = Math.max(1, Math.round(options.holdDurationSec ?? 10));
    for (let n = 1; n <= Math.min(holdSec, MAX_VOICE_COACH_CLIP_COUNTDOWN); n += 1) {
      keys.push(`cd-${n}`);
    }
    if (holdSec > MAX_VOICE_COACH_CLIP_COUNTDOWN) {
      for (
        let n = MAX_VOICE_COACH_CLIP_COUNTDOWN + 1;
        n <= Math.min(holdSec, MAX_VOICE_COACH_CLIP_REP);
        n += 1
      ) {
        keys.push(`rep-${n}`);
      }
    }
  }

  const unique = [...new Set(keys)];
  await Promise.all(
    unique.map(async (key) => {
      if (options.signal?.aborted) return;
      await loadClipBuffer(voiceCoachClipUrl(key, pack), ctx);
    })
  );
}

/**
 * Synchronously create/resume AudioContext and fire a silent tick.
 * Must run in the same turn as the user tap — awaiting clip fetch first
 * loses the mobile gesture and makes the first Count Start silent.
 */
export function primeVoiceCoachAudioSync(): AudioContext | null {
  const ctx = getSharedAudioContext();
  if (!ctx) return null;
  const state = ctx.state as string;
  if (state === 'suspended' || state === 'interrupted') {
    void ctx.resume();
  }
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    osc.start(now);
    osc.stop(now + 0.03);
  } catch {
    // ignore
  }
  return ctx;
}

/**
 * Unlock clip playback inside a user-gesture turn.
 * Resolves quickly after audio is primed — clip decode continues in background
 * so the first Start (before any set-complete) still gets audible beeps/clips.
 */
export function unlockVoiceCoachClips(
  pack: VoiceCoachPack = DEFAULT_VOICE_COACH_PACK
): Promise<void> {
  const normalized = normalizeVoiceCoachPack(pack);
  if (lastUnlockedPack != null && lastUnlockedPack !== normalized) {
    clearVoiceCoachClipBufferCache();
  }
  lastUnlockedPack = normalized;

  // 1) Sync prime in the tap turn (no await).
  primeVoiceCoachAudioSync();

  return (async () => {
    const running = await ensureVoiceCoachAudioRunning();

    // 2) Warm HTMLAudio with silent play()/pause() (not cd-5 — that leaked "오").
    try {
      const audio = warmedHtmlAudio ?? new Audio();
      warmedHtmlAudio = audio;
      audio.preload = 'auto';
      audio.src = SILENT_WAV;
      audio.volume = 0.001;
      const playResult = audio.play();
      const playGuard = new Promise<void>((resolve) => {
        window.setTimeout(resolve, 250);
      });
      await Promise.race([playResult?.then(() => undefined), playGuard]);
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1;
    } catch {
      // Some browsers block even gesture play if muted tabs — continue with Web Audio.
    }

    // 3) Preload clips in the background — do not block Count Start on decode.
    if (running) {
      void Promise.all([
        loadClipBuffer(voiceCoachClipUrl('cd-5', normalized), running),
        loadClipBuffer(voiceCoachClipUrl('cd-4', normalized), running),
        loadClipBuffer(voiceCoachClipUrl('cd-3', normalized), running),
        loadClipBuffer(voiceCoachClipUrl('start', normalized), running),
        loadClipBuffer(voiceCoachClipUrl('rep-1', normalized), running),
      ]);
    }
  })();
}

/** Test helper — clears module playback state between cases. */
export function __resetVoiceCoachClipsForTests(): void {
  stopVoiceCoachClips();
  clearVoiceCoachClipBufferCache();
  warmedHtmlAudio = null;
  pendingClipSettle = null;
  clipGeneration = 0;
  lastUnlockedPack = null;
  if (sharedAudioCtx) {
    try {
      void sharedAudioCtx.close();
    } catch {
      // ignore
    }
  }
  sharedAudioCtx = null;
}
