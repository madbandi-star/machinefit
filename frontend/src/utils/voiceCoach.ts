/** Voice set coach: beeps → countdown → start → rep count → optional "one more". */

export type VoiceCoachPhase =
  | 'idle'
  | 'beep'
  | 'countdown'
  | 'start'
  | 'counting'
  | 'oneMore'
  | 'done';

/** Pre-recorded coach voices (sample #4 male / #3 female). */
export type VoiceCoachVoice = 'male' | 'female';

export const DEFAULT_VOICE_COACH_VOICE: VoiceCoachVoice = 'male';

export function normalizeVoiceCoachVoice(value: unknown): VoiceCoachVoice {
  return value === 'female' ? 'female' : 'male';
}

export interface VoiceCoachOptions {
  targetReps: number;
  oneMoreEnabled: boolean;
  /** Safety cap when one-more keeps going (default 8). */
  maxOneMore?: number;
  /** Silence after each spoken rep (ms). Defaults to VOICE_COACH_TIMING.repGapMs. */
  repGapMs?: number;
  locale?: string;
  /** Pre-recorded coach voice. Default male (drill count). */
  voice?: VoiceCoachVoice;
  onPhaseChange?: (phase: VoiceCoachPhase, detail?: { rep?: number; countdown?: number }) => void;
  signal?: AbortSignal;
}

/** Trainer-like pacing (ms). */
export const VOICE_COACH_TIMING = {
  beepGapMs: 420,
  afterBeepsMs: 650,
  countdownGapMs: 880,
  afterCountdownMs: 350,
  afterStartMs: 950,
  /** Default post-speech gap — ~2s is a calm, form-friendly tempo. */
  repGapMs: 2000,
  oneMoreGapMs: 2200,
} as const;

/** User-configurable gap between spoken counts. */
export const VOICE_COACH_REP_GAP = {
  defaultMs: VOICE_COACH_TIMING.repGapMs,
  minMs: 800,
  maxMs: 3000,
  stepMs: 100,
} as const;

export function clampVoiceCoachRepGapMs(ms: number): number {
  if (!Number.isFinite(ms)) return VOICE_COACH_REP_GAP.defaultMs;
  const stepped = Math.round(ms / VOICE_COACH_REP_GAP.stepMs) * VOICE_COACH_REP_GAP.stepMs;
  return Math.min(VOICE_COACH_REP_GAP.maxMs, Math.max(VOICE_COACH_REP_GAP.minMs, stepped));
}

const NATIVE_ONES = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'] as const;
const NATIVE_TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'] as const;

const EN_ONES = [
  '',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
] as const;

const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'] as const;

/** Max rep clip bundled under public/voice-coach/{voice}/rep-N.mp3 */
const MAX_CLIP_REP = 30;

function isKoreanLocale(locale?: string): boolean {
  return (locale ?? 'ko').toLowerCase().startsWith('ko');
}

function speechLang(locale?: string): string {
  return isKoreanLocale(locale) ? 'ko-KR' : 'en-US';
}

/** Native Korean counting used by trainers for reps (하나, 둘, … 열하나). */
export function toNativeKoreanRep(n: number): string {
  if (n <= 0) return String(n);
  if (n < 10) return NATIVE_ONES[n];
  if (n === 10) return '열';
  if (n < 20) return `열${NATIVE_ONES[n - 10]}`;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  if (tens >= 1 && tens <= 9) {
    return ones === 0 ? NATIVE_TENS[tens] : `${NATIVE_TENS[tens]}${NATIVE_ONES[ones]}`;
  }
  return String(n);
}

export function toEnglishRep(n: number): string {
  if (n <= 0) return String(n);
  if (n < 20) return EN_ONES[n];
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return ones === 0 ? EN_TENS[tens] : `${EN_TENS[tens]} ${EN_ONES[ones]}`;
  }
  return String(n);
}

export function formatRepWord(n: number, locale?: string): string {
  return isKoreanLocale(locale) ? toNativeKoreanRep(n) : toEnglishRep(n);
}

function formatCountdownWord(n: number, locale?: string): string {
  // Speak digits clearly for the pre-start countdown (5 4 3 2 1).
  if (isKoreanLocale(locale)) {
    const map: Record<number, string> = { 5: '오', 4: '사', 3: '삼', 2: '이', 1: '일' };
    return map[n] ?? String(n);
  }
  return String(n);
}

function startPhrase(locale?: string): string {
  return isKoreanLocale(locale) ? '시작!' : 'Start!';
}

function oneMorePhrase(locale?: string): string {
  return isKoreanLocale(locale) ? '하나더!' : 'One more!';
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Shared AudioContext — stays unlocked after a user gesture so later reps still play. */
let sharedAudioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentHtmlAudio: HTMLAudioElement | null = null;
/** HTMLAudio warmed during a user gesture — can play later without a fresh tap. */
let warmedHtmlAudio: HTMLAudioElement | null = null;
const clipBufferCache = new Map<string, AudioBuffer>();
/** In-flight fetches so parallel preload/play share one decode. */
const clipBufferInflight = new Map<string, Promise<AudioBuffer | null>>();

function getSharedAudioContext(): AudioContext | null {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new Ctx();
  }
  return sharedAudioCtx;
}

async function ensureSharedAudioRunning(): Promise<AudioContext | null> {
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

async function playBeep(
  ctx: AudioContext,
  signal: AbortSignal | undefined,
  frequency = 920,
  durationSec = 0.11
): Promise<void> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durationSec + 0.02);
  await sleep(Math.round(durationSec * 1000) + 40, signal);
}

function cancelSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function stopCurrentClip(): void {
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

function publicAssetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.replace(/^\//, '');
  return `${normalizedBase}${normalizedPath}`;
}

export function voiceCoachClipUrl(voice: VoiceCoachVoice, key: string): string {
  return publicAssetUrl(`voice-coach/${normalizeVoiceCoachVoice(voice)}/${key}.mp3`);
}

/** Full sample used on the listen page (male=#4 drill, female=#3 pro). */
export function voiceCoachPreviewSampleUrl(voice: VoiceCoachVoice): string {
  const file =
    normalizeVoiceCoachVoice(voice) === 'female'
      ? 'voice-samples/03-pro-female.mp3'
      : 'voice-samples/04-drill-count.mp3';
  return publicAssetUrl(file);
}

function isSpeechActive(): boolean {
  if (!('speechSynthesis' in window)) return false;
  return window.speechSynthesis.speaking || window.speechSynthesis.pending;
}

function waitForSpeechVoices(timeoutMs = 400): Promise<void> {
  if (!('speechSynthesis' in window)) return Promise.resolve();
  if (window.speechSynthesis.getVoices().length > 0) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
      resolve();
    };
    const onVoices = () => finish();
    window.speechSynthesis.addEventListener('voiceschanged', onVoices);
    window.setTimeout(finish, timeoutMs);
  });
}

async function loadClipBuffer(url: string, ctx: AudioContext): Promise<AudioBuffer | null> {
  const cached = clipBufferCache.get(url);
  if (cached) return cached;

  const inflight = clipBufferInflight.get(url);
  if (inflight) return inflight;

  const task = (async (): Promise<AudioBuffer | null> => {
    try {
      const response = await fetch(url, { cache: 'no-cache' });
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

async function preloadCoachClips(
  voice: VoiceCoachVoice,
  reps: number,
  oneMoreEnabled: boolean,
  signal?: AbortSignal,
  mode: 'countdown' | 'all' = 'all'
): Promise<void> {
  const ctx = await ensureSharedAudioRunning();
  if (!ctx) return;

  const keys: string[] = ['cd-5', 'cd-4', 'cd-3', 'cd-2', 'cd-1', 'start'];
  if (mode === 'all') {
    if (oneMoreEnabled) keys.push('one-more');
    const maxRep = Math.min(MAX_CLIP_REP, Math.max(1, reps));
    for (let rep = 1; rep <= maxRep; rep += 1) {
      keys.push(`rep-${rep}`);
    }
  } else {
    keys.push('rep-1');
  }

  await Promise.all(
    keys.map(async (key) => {
      if (signal?.aborted) return;
      await loadClipBuffer(voiceCoachClipUrl(voice, key), ctx);
    })
  );
}

function playHtmlAudioClip(url: string, signal?: AbortSignal): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const audio = warmedHtmlAudio ?? new Audio();
    warmedHtmlAudio = audio;
    currentHtmlAudio = audio;
    audio.preload = 'auto';
    audio.volume = 1;
    // Absolute URL helps some mobile WebViews after SPA navigation.
    audio.src = new URL(url, window.location.href).href;

    const onAbort = () => {
      try {
        audio.pause();
      } catch {
        // ignore
      }
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
    void audio.play().then(
      () => undefined,
      () => {
        cleanup();
        resolve(false);
      }
    );
  });
}

/**
 * Play a pre-recorded clip via Web Audio so playback keeps working after the
 * long rep-gap (HTMLAudioElement.play() often fails once the user-gesture window ends).
 * Falls back to warmed HTMLAudio when decode/Web Audio fails.
 */
async function playClip(url: string, signal?: AbortSignal): Promise<boolean> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  stopCurrentClip();
  cancelSpeech();

  const ctx = await ensureSharedAudioRunning();
  if (ctx) {
    const buffer = await loadClipBuffer(url, ctx);
    if (buffer) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      // Resume again right before start — mobile can suspend during preload/beeps.
      try {
        if ((ctx.state as string) !== 'running') {
          await ctx.resume();
        }
      } catch {
        // fall through to HTMLAudio
      }

      if ((ctx.state as string) === 'running') {
        const played = await new Promise<boolean>((resolve, reject) => {
          const source = ctx.createBufferSource();
          const gain = ctx.createGain();
          gain.gain.value = 1;
          source.buffer = buffer;
          source.connect(gain);
          gain.connect(ctx.destination);
          currentSource = source;

          const safetyMs = Math.max(400, Math.ceil(buffer.duration * 1000) + 250);
          let settled = false;
          let timeoutId = 0;

          const onAbort = () => {
            try {
              source.stop();
            } catch {
              // ignore
            }
            finishReject(new DOMException('Aborted', 'AbortError'));
          };

          const cleanup = () => {
            if (timeoutId) window.clearTimeout(timeoutId);
            signal?.removeEventListener('abort', onAbort);
            source.onended = null;
            if (currentSource === source) currentSource = null;
          };

          const finishResolve = (value: boolean) => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve(value);
          };

          const finishReject = (error: DOMException) => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(error);
          };

          source.onended = () => finishResolve(true);
          signal?.addEventListener('abort', onAbort, { once: true });
          timeoutId = window.setTimeout(() => finishResolve(true), safetyMs);

          try {
            source.start(0);
          } catch {
            finishResolve(false);
          }
        });
        if (played) return true;
      }
    }
  }

  return playHtmlAudioClip(url, signal);
}

function pickSpeechVoice(
  locale: string | undefined,
  gender: VoiceCoachVoice
): SpeechSynthesisVoice | undefined {
  if (!('speechSynthesis' in window)) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return undefined;

  const lang = speechLang(locale).toLowerCase();
  const langPrefix = lang.slice(0, 2);
  const langVoices = voices.filter((voice) => {
    const voiceLang = voice.lang.toLowerCase();
    return voiceLang === lang || voiceLang.startsWith(`${langPrefix}-`) || voiceLang.startsWith(langPrefix);
  });
  const pool = langVoices.length > 0 ? langVoices : voices;

  const maleHints = [/male/i, /남성/i, /\bman\b/i, /injoon/i, /hyunsu/i, /jinho/i, /minsu/i];
  const femaleHints = [/female/i, /여성/i, /\bwoman\b/i, /sunhi/i, /yuna/i, /sora/i, /heami/i];
  const hints = gender === 'male' ? maleHints : femaleHints;
  const opposite = gender === 'male' ? femaleHints : maleHints;

  const preferred = pool.find((voice) => hints.some((hint) => hint.test(voice.name)));
  if (preferred) return preferred;

  const nonOpposite = pool.find((voice) => !opposite.some((hint) => hint.test(voice.name)));
  return nonOpposite ?? pool[0];
}

function speak(
  text: string,
  locale: string | undefined,
  signal?: AbortSignal,
  voiceGender: VoiceCoachVoice = DEFAULT_VOICE_COACH_VOICE
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      resolve();
      return;
    }

    void waitForSpeechVoices().then(() => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }

      stopCurrentClip();
      if (isSpeechActive()) {
        cancelSpeech();
      }

      const gender = normalizeVoiceCoachVoice(voiceGender);
      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.lang = speechLang(locale);
      utterance.rate = isKoreanLocale(locale) ? 1.08 : 1.05;
      // Nudge pitch when OS has no clearly gendered Korean voice.
      utterance.pitch = gender === 'male' ? 0.92 : 1.12;
      utterance.volume = 1;
      const matchedVoice = pickSpeechVoice(locale, gender);
      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang || utterance.lang;
      }

      const maxMs = Math.min(12_000, Math.max(2_500, trimmed.length * 700));
      let timeoutId = 0;

      const onAbort = () => {
        cancelSpeech();
        cleanup();
        reject(new DOMException('Aborted', 'AbortError'));
      };

      const cleanup = () => {
        if (timeoutId) window.clearTimeout(timeoutId);
        signal?.removeEventListener('abort', onAbort);
        utterance.onend = null;
        utterance.onerror = null;
      };

      const finish = () => {
        cleanup();
        resolve();
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      timeoutId = window.setTimeout(() => {
        cancelSpeech();
        finish();
      }, maxMs);

      signal?.addEventListener('abort', onAbort, { once: true });
      window.speechSynthesis.speak(utterance);
    });
  });
}

async function speakCoachPhrase(options: {
  clipKey: string | null;
  text: string;
  locale: string | undefined;
  voice: VoiceCoachVoice;
  signal?: AbortSignal;
}): Promise<void> {
  const { clipKey, text, locale, voice, signal } = options;
  if (isKoreanLocale(locale) && clipKey) {
    try {
      const played = await playClip(voiceCoachClipUrl(voice, clipKey), signal);
      if (played) return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
    }
  }
  // Always fall back to OS TTS (gender-matched) so count never goes silent.
  await speak(text, locale, signal, voice);
}

export function stopVoiceCoach(): void {
  cancelSpeech();
  stopCurrentClip();
}

/** Speak a single phrase (cancels any current utterance). */
export function speakVoiceText(
  text: string,
  locale?: string,
  signal?: AbortSignal,
  voice: VoiceCoachVoice = DEFAULT_VOICE_COACH_VOICE
): Promise<void> {
  return speak(text, locale, signal, voice);
}

export interface RestVoiceCoachingOptions {
  warnings?: string[];
  tips?: string[];
  locale?: string;
  signal?: AbortSignal;
  /** Prefer male/female OS TTS voice to match coach setting. */
  voice?: VoiceCoachVoice;
  /** Max warning lines to speak (default 3). */
  maxWarnings?: number;
  /** Max tip lines to speak (default 3). */
  maxTips?: number;
}

/**
 * During rest: speak cautions first, then workout tips (trainer pacing).
 */
export async function speakRestTipsAndWarnings(
  options: RestVoiceCoachingOptions
): Promise<void> {
  const {
    warnings = [],
    tips = [],
    locale = 'ko',
    signal,
    voice = DEFAULT_VOICE_COACH_VOICE,
    maxWarnings = 3,
    maxTips = 3,
  } = options;

  const warningLines = warnings.map((w) => w.trim()).filter(Boolean).slice(0, maxWarnings);
  const tipLines = tips.map((t) => t.trim()).filter(Boolean).slice(0, maxTips);
  if (warningLines.length === 0 && tipLines.length === 0) return;

  const ko = isKoreanLocale(locale);
  const gender = normalizeVoiceCoachVoice(voice);

  try {
    if (warningLines.length > 0) {
      await speak(ko ? '주의사항.' : 'Cautions.', locale, signal, gender);
      await sleep(280, signal);
      for (let i = 0; i < warningLines.length; i += 1) {
        await speak(warningLines[i], locale, signal, gender);
        if (i < warningLines.length - 1) await sleep(420, signal);
      }
    }

    if (tipLines.length > 0) {
      if (warningLines.length > 0) await sleep(500, signal);
      await speak(ko ? '운동 팁.' : 'Workout tips.', locale, signal, gender);
      await sleep(280, signal);
      for (let i = 0; i < tipLines.length; i += 1) {
        await speak(tipLines[i], locale, signal, gender);
        if (i < tipLines.length - 1) await sleep(420, signal);
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      stopVoiceCoach();
      return;
    }
    throw error;
  }
}

/**
 * Warm audio/speech inside a user-gesture turn so countdown clips keep playing
 * after the beep lead-in. Must be awaited from the start button handler.
 */
export async function unlockVoiceCoachAudio(
  voice: VoiceCoachVoice = DEFAULT_VOICE_COACH_VOICE
): Promise<void> {
  const normalized = normalizeVoiceCoachVoice(voice);
  const warmUrl = voiceCoachClipUrl(normalized, 'cd-5');

  // 1) Resume Web Audio while we still have the tap gesture.
  const ctx = await ensureSharedAudioRunning();

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

  // 3) Decode the first countdown clips while the context is still hot.
  if (ctx) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      osc.start(now);
      osc.stop(now + 0.02);
    } catch {
      // ignore
    }
    await Promise.all([
      loadClipBuffer(warmUrl, ctx),
      loadClipBuffer(voiceCoachClipUrl(normalized, 'cd-4'), ctx),
      loadClipBuffer(voiceCoachClipUrl(normalized, 'cd-3'), ctx),
      loadClipBuffer(voiceCoachClipUrl(normalized, 'start'), ctx),
      loadClipBuffer(voiceCoachClipUrl(normalized, 'rep-1'), ctx),
    ]);
  }

  // 4) Unlock speechSynthesis without immediately cancelling (cancel undoes unlock on some WebViews).
  if ('speechSynthesis' in window) {
    try {
      const utterance = new SpeechSynthesisUtterance('\u200B');
      utterance.volume = 0;
      utterance.rate = 2;
      utterance.lang = 'ko-KR';
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }
}

/**
 * Full set coach sequence:
 * tip tip tip → 5 4 3 2 1 → 시작! → 하나 둘 … → (optional) 하나더!
 */
export async function runVoiceCoachSession(options: VoiceCoachOptions): Promise<void> {
  const {
    targetReps,
    oneMoreEnabled,
    maxOneMore = 8,
    repGapMs: repGapMsOption,
    locale = 'ko',
    voice: voiceOption,
    onPhaseChange,
    signal,
  } = options;

  const voice = normalizeVoiceCoachVoice(voiceOption ?? DEFAULT_VOICE_COACH_VOICE);
  const reps = Math.max(1, Math.min(50, Math.round(targetReps)));
  const repGapMs = clampVoiceCoachRepGapMs(repGapMsOption ?? VOICE_COACH_TIMING.repGapMs);
  /** Keep one-more slightly slower than the count gap, but still follow user tempo. */
  const oneMoreGapMs = Math.max(repGapMs, VOICE_COACH_TIMING.oneMoreGapMs - 200);
  const audioCtx = await ensureSharedAudioRunning();

  try {
    // Only warm countdown clips before beeps — full rep preload can suspend mobile audio.
    if (isKoreanLocale(locale)) {
      await preloadCoachClips(voice, reps, oneMoreEnabled, signal, 'countdown');
    }

    onPhaseChange?.('beep');
    const beepCtx = (await ensureSharedAudioRunning()) ?? audioCtx;
    if (beepCtx) {
      for (let i = 0; i < 3; i += 1) {
        await playBeep(beepCtx, signal, 880 + i * 40);
        if (i < 2) await sleep(VOICE_COACH_TIMING.beepGapMs, signal);
      }
    } else {
      // Fallback when AudioContext is unavailable: short spoken ticks.
      for (let i = 0; i < 3; i += 1) {
        await speak(isKoreanLocale(locale) ? '띡' : 'tick', locale, signal, voice);
        if (i < 2) await sleep(120, signal);
      }
    }

    // Prefetch remaining reps in the background while countdown speaks.
    if (isKoreanLocale(locale)) {
      void preloadCoachClips(voice, reps, oneMoreEnabled, signal, 'all');
    }

    await sleep(VOICE_COACH_TIMING.afterBeepsMs, signal);

    onPhaseChange?.('countdown');
    for (let n = 5; n >= 1; n -= 1) {
      onPhaseChange?.('countdown', { countdown: n });
      await speakCoachPhrase({
        clipKey: `cd-${n}`,
        text: formatCountdownWord(n, locale),
        locale,
        voice,
        signal,
      });
      if (n > 1) await sleep(VOICE_COACH_TIMING.countdownGapMs, signal);
    }

    await sleep(VOICE_COACH_TIMING.afterCountdownMs, signal);
    onPhaseChange?.('start');
    await speakCoachPhrase({
      clipKey: 'start',
      text: startPhrase(locale),
      locale,
      voice,
      signal,
    });
    await sleep(VOICE_COACH_TIMING.afterStartMs, signal);

    onPhaseChange?.('counting', { rep: 0 });
    for (let rep = 1; rep <= reps; rep += 1) {
      onPhaseChange?.('counting', { rep });
      await speakCoachPhrase({
        clipKey: rep <= MAX_CLIP_REP ? `rep-${rep}` : null,
        text: formatRepWord(rep, locale),
        locale,
        voice,
        signal,
      });
      if (rep < reps) await sleep(repGapMs, signal);
    }

    if (oneMoreEnabled) {
      onPhaseChange?.('oneMore', { rep: reps });
      for (let extra = 1; extra <= maxOneMore; extra += 1) {
        await sleep(oneMoreGapMs, signal);
        onPhaseChange?.('oneMore', { rep: reps + extra });
        await speakCoachPhrase({
          clipKey: 'one-more',
          text: oneMorePhrase(locale),
          locale,
          voice,
          signal,
        });
      }
    }

    onPhaseChange?.('done', { rep: oneMoreEnabled ? reps + maxOneMore : reps });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      stopVoiceCoach();
      onPhaseChange?.('idle');
      return;
    }
    throw error;
  }
}
