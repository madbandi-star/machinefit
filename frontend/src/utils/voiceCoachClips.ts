/**
 * Pre-recorded Korean voice-coach clips (Web Audio primary, HTMLAudio fallback).
 * Used for countdown / start / reps / one-more so count works when OS TTS is silent.
 */

import { speechManager } from '@/utils/speechManager';

export const VOICE_COACH_PACKS = ['female', 'male'] as const;
export type VoiceCoachPack = (typeof VOICE_COACH_PACKS)[number];
export const DEFAULT_VOICE_COACH_PACK: VoiceCoachPack = 'female';

/** Highest `rep-N.mp3` shipped under public/voice-coach. */
export const MAX_VOICE_COACH_CLIP_REP = 30;

/** Highest `cd-N.mp3` shipped (prep 10 uses TTS for 10–6). */
export const MAX_VOICE_COACH_CLIP_COUNTDOWN = 5;

let sharedAudioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentHtmlAudio: HTMLAudioElement | null = null;
/** HTMLAudio warmed during a user gesture — can play later without a fresh tap. */
let warmedHtmlAudio: HTMLAudioElement | null = null;
const clipBufferCache = new Map<string, AudioBuffer>();
const clipBufferInflight = new Map<string, Promise<AudioBuffer | null>>();

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
  return publicAssetUrl(`voice-coach/${normalizeVoiceCoachPack(pack)}/${key}.mp3`);
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

export function stopVoiceCoachClips(): void {
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
  if (!currentSource) return;
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

    const audio = warmedHtmlAudio ?? new Audio();
    warmedHtmlAudio = audio;
    audio.preload = 'auto';
    audio.volume = 1;
    audio.src = url;
    currentHtmlAudio = audio;

    const onAbort = () => {
      stopVoiceCoachClips();
      cleanup();
      reject(new DOMException('Aborted', 'AbortError'));
    };

    const cleanup = () => {
      signal?.removeEventListener('abort', onAbort);
      audio.onended = null;
      audio.onerror = null;
      if (currentHtmlAudio === audio) currentHtmlAudio = null;
    };

    audio.onended = () => {
      cleanup();
      resolve(true);
    };
    audio.onerror = () => {
      cleanup();
      resolve(false);
    };

    signal?.addEventListener('abort', onAbort, { once: true });
    void audio.play().catch(() => {
      cleanup();
      resolve(false);
    });
  });
}

/**
 * Play a pre-recorded clip via Web Audio so playback keeps working after the
 * long rep-gap (HTMLAudioElement.play() often fails once the user-gesture window ends).
 * Falls back to HTMLAudio when decode/Web Audio fails.
 */
export async function playVoiceCoachClip(
  key: string,
  signal?: AbortSignal,
  pack: VoiceCoachPack = DEFAULT_VOICE_COACH_PACK
): Promise<boolean> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  stopVoiceCoachClips();
  // Stop any lingering TTS so clip + OS voice never overlap.
  speechManager.cancel();
  const url = voiceCoachClipUrl(key, pack);

  const ctx = await ensureVoiceCoachAudioRunning();
  if (ctx) {
    const buffer = await loadClipBuffer(url, ctx);
    if (buffer) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      const played = await new Promise<boolean>((resolve, reject) => {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        currentSource = source;

        const onAbort = () => {
          try {
            source.stop();
          } catch {
            // ignore
          }
          cleanup();
          reject(new DOMException('Aborted', 'AbortError'));
        };

        const cleanup = () => {
          signal?.removeEventListener('abort', onAbort);
          source.onended = null;
          if (currentSource === source) currentSource = null;
        };

        source.onended = () => {
          cleanup();
          resolve(true);
        };

        signal?.addEventListener('abort', onAbort, { once: true });
        try {
          source.start(0);
        } catch {
          cleanup();
          resolve(false);
        }
      });
      if (played) return true;
    }
  }

  return playHtmlAudioClip(url, signal);
}

export async function preloadVoiceCoachClips(options: {
  reps: number;
  oneMoreEnabled: boolean;
  prepCount: number;
  pack?: VoiceCoachPack;
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

  await Promise.all(
    keys.map(async (key) => {
      if (options.signal?.aborted) return;
      await loadClipBuffer(voiceCoachClipUrl(key, pack), ctx);
    })
  );
}

/**
 * Unlock clip playback inside a user-gesture turn.
 * Sync work runs before the first await so mobile autoplay policies stay satisfied.
 */
export function unlockVoiceCoachClips(
  pack: VoiceCoachPack = DEFAULT_VOICE_COACH_PACK
): Promise<void> {
  const normalized = normalizeVoiceCoachPack(pack);
  const warmUrl = voiceCoachClipUrl('cd-5', normalized);

  // 1) Kick AudioContext resume while we still have the tap gesture.
  const ctx = getSharedAudioContext();
  if (ctx) {
    const state = ctx.state as string;
    if (state === 'suspended' || state === 'interrupted') {
      void ctx.resume();
    }
  }

  return (async () => {
    const running = await ensureVoiceCoachAudioRunning();

    // 2) Warm HTMLAudio with a real play()/pause() so later fallback can play.
    try {
      const audio = warmedHtmlAudio ?? new Audio();
      warmedHtmlAudio = audio;
      audio.preload = 'auto';
      audio.src = new URL(warmUrl, window.location.href).href;
      audio.volume = 0.001;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1;
    } catch {
      // Some browsers block even gesture play if muted tabs — continue with Web Audio.
    }

    // 3) Silent tick keeps the graph hot, then decode first countdown clips.
    if (running) {
      try {
        const osc = running.createOscillator();
        const gain = running.createGain();
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(running.destination);
        const now = running.currentTime;
        osc.start(now);
        osc.stop(now + 0.02);
      } catch {
        // ignore
      }
      await Promise.all([
        loadClipBuffer(warmUrl, running),
        loadClipBuffer(voiceCoachClipUrl('cd-4', normalized), running),
        loadClipBuffer(voiceCoachClipUrl('cd-3', normalized), running),
        loadClipBuffer(voiceCoachClipUrl('start', normalized), running),
        loadClipBuffer(voiceCoachClipUrl('rep-1', normalized), running),
      ]);
    }
  })();
}
