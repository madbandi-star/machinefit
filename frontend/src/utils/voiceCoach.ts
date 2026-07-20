/** Voice set coach: beeps → countdown → start → rep count → optional "one more". */

export type VoiceCoachPhase =
  | 'idle'
  | 'beep'
  | 'countdown'
  | 'start'
  | 'counting'
  | 'oneMore'
  | 'done';

export interface VoiceCoachOptions {
  targetReps: number;
  oneMoreEnabled: boolean;
  /** Safety cap when one-more keeps going (default 8). */
  maxOneMore?: number;
  /** Silence after each spoken rep (ms). Defaults to VOICE_COACH_TIMING.repGapMs. */
  repGapMs?: number;
  locale?: string;
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

function ensureAudioContext(): AudioContext | null {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  return new Ctx();
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

function speak(text: string, locale: string | undefined, signal?: AbortSignal): Promise<void> {
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

      if (isSpeechActive()) {
        cancelSpeech();
      }

      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.lang = speechLang(locale);
      utterance.rate = isKoreanLocale(locale) ? 1.08 : 1.05;
      utterance.pitch = 1.05;
      utterance.volume = 1;

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

export function stopVoiceCoach(): void {
  cancelSpeech();
}

/** Speak a single phrase (cancels any current utterance). */
export function speakVoiceText(
  text: string,
  locale?: string,
  signal?: AbortSignal
): Promise<void> {
  return speak(text, locale, signal);
}

export interface RestVoiceCoachingOptions {
  warnings?: string[];
  tips?: string[];
  locale?: string;
  signal?: AbortSignal;
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
    maxWarnings = 3,
    maxTips = 3,
  } = options;

  const warningLines = warnings.map((w) => w.trim()).filter(Boolean).slice(0, maxWarnings);
  const tipLines = tips.map((t) => t.trim()).filter(Boolean).slice(0, maxTips);
  if (warningLines.length === 0 && tipLines.length === 0) return;

  const ko = isKoreanLocale(locale);

  try {
    if (warningLines.length > 0) {
      await speak(ko ? '주의사항.' : 'Cautions.', locale, signal);
      await sleep(280, signal);
      for (let i = 0; i < warningLines.length; i += 1) {
        await speak(warningLines[i], locale, signal);
        if (i < warningLines.length - 1) await sleep(420, signal);
      }
    }

    if (tipLines.length > 0) {
      if (warningLines.length > 0) await sleep(500, signal);
      await speak(ko ? '운동 팁.' : 'Workout tips.', locale, signal);
      await sleep(280, signal);
      for (let i = 0; i < tipLines.length; i += 1) {
        await speak(tipLines[i], locale, signal);
        if (i < tipLines.length - 1) await sleep(420, signal);
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      cancelSpeech();
      return;
    }
    throw error;
  }
}

/** Warm audio/speech after a user gesture so auto-start after rest can play. */
export function unlockVoiceCoachAudio(): void {
  try {
    const ctx = ensureAudioContext();
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume().finally(() => {
        void ctx.close().catch(() => undefined);
      });
    } else if (ctx) {
      void ctx.close().catch(() => undefined);
    }
  } catch {
    // ignore
  }

  if ('speechSynthesis' in window) {
    try {
      const utterance = new SpeechSynthesisUtterance(' ');
      utterance.volume = 0;
      utterance.rate = 2;
      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.cancel();
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
    onPhaseChange,
    signal,
  } = options;

  const reps = Math.max(1, Math.min(50, Math.round(targetReps)));
  const repGapMs = clampVoiceCoachRepGapMs(repGapMsOption ?? VOICE_COACH_TIMING.repGapMs);
  /** Keep one-more slightly slower than the count gap, but still follow user tempo. */
  const oneMoreGapMs = Math.max(repGapMs, VOICE_COACH_TIMING.oneMoreGapMs - 200);
  const audioCtx = ensureAudioContext();

  try {
    onPhaseChange?.('beep');
    if (audioCtx) {
      for (let i = 0; i < 3; i += 1) {
        await playBeep(audioCtx, signal, 880 + i * 40);
        if (i < 2) await sleep(VOICE_COACH_TIMING.beepGapMs, signal);
      }
    } else {
      // Fallback when AudioContext is unavailable: short spoken ticks.
      for (let i = 0; i < 3; i += 1) {
        await speak(isKoreanLocale(locale) ? '띡' : 'tick', locale, signal);
        if (i < 2) await sleep(120, signal);
      }
    }

    await sleep(VOICE_COACH_TIMING.afterBeepsMs, signal);

    onPhaseChange?.('countdown');
    for (let n = 5; n >= 1; n -= 1) {
      onPhaseChange?.('countdown', { countdown: n });
      await speak(formatCountdownWord(n, locale), locale, signal);
      if (n > 1) await sleep(VOICE_COACH_TIMING.countdownGapMs, signal);
    }

    await sleep(VOICE_COACH_TIMING.afterCountdownMs, signal);
    onPhaseChange?.('start');
    await speak(startPhrase(locale), locale, signal);
    await sleep(VOICE_COACH_TIMING.afterStartMs, signal);

    onPhaseChange?.('counting', { rep: 0 });
    for (let rep = 1; rep <= reps; rep += 1) {
      onPhaseChange?.('counting', { rep });
      await speak(formatRepWord(rep, locale), locale, signal);
      if (rep < reps) await sleep(repGapMs, signal);
    }

    if (oneMoreEnabled) {
      onPhaseChange?.('oneMore', { rep: reps });
      for (let extra = 1; extra <= maxOneMore; extra += 1) {
        await sleep(oneMoreGapMs, signal);
        onPhaseChange?.('oneMore', { rep: reps + extra });
        await speak(oneMorePhrase(locale), locale, signal);
      }
    }

    onPhaseChange?.('done', { rep: oneMoreEnabled ? reps + maxOneMore : reps });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      cancelSpeech();
      onPhaseChange?.('idle');
      return;
    }
    throw error;
  } finally {
    if (audioCtx && audioCtx.state !== 'closed') {
      void audioCtx.close().catch(() => undefined);
    }
  }
}
