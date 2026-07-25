/** Voice set coach: beeps → 준비 → N–1 → 시작 → reps → optional "하나더". All speech via SpeechManager. */

import {
  buildCountPaceSchedule,
  clampVoiceCountMode,
  DEFAULT_VOICE_COUNT_MODE,
  type VoiceCountMode,
} from '@/utils/aiCountPace';
import { speechManager } from '@/utils/speechManager';

export type VoiceCoachPhase =
  | 'idle'
  | 'beep'
  | 'countdown'
  | 'start'
  | 'counting'
  | 'oneMore'
  | 'done';

export interface VoiceCoachPhaseDetail {
  rep?: number;
  countdown?: number;
  /** Exercise-count only: inside turbo window. */
  turbo?: boolean;
  /** Exercise-count only: 0–1 intensity for UI/haptics. */
  intensity?: number;
}

/** Prep countdown length before "시작" (5→1 or 10→1). */
export const VOICE_COACH_PREP_COUNTS = [5, 10] as const;
export type VoiceCoachPrepCount = (typeof VOICE_COACH_PREP_COUNTS)[number];
export const DEFAULT_VOICE_COACH_PREP_COUNT: VoiceCoachPrepCount = 5;

export function clampVoiceCoachPrepCount(value: unknown): VoiceCoachPrepCount {
  const n = typeof value === 'number' ? value : Number(value);
  return VOICE_COACH_PREP_COUNTS.includes(n as VoiceCoachPrepCount)
    ? (n as VoiceCoachPrepCount)
    : DEFAULT_VOICE_COACH_PREP_COUNT;
}

export interface VoiceCoachOptions {
  targetReps: number;
  oneMoreEnabled: boolean;
  /** How many times to speak "하나더" after target reps (default 3). */
  maxOneMore?: number;
  /** Silence after each spoken rep (ms). Defaults to VOICE_COACH_TIMING.repGapMs. */
  repGapMs?: number;
  /**
   * Exercise-count pacing only (prep/rest unchanged).
   * Default: AI accel + turbo.
   */
  countMode?: VoiceCountMode;
  /** Prep countdown from N to 1 (default 5). */
  prepCount?: VoiceCoachPrepCount;
  locale?: string;
  onPhaseChange?: (phase: VoiceCoachPhase, detail?: VoiceCoachPhaseDetail) => void;
  signal?: AbortSignal;
}

export type { VoiceCountMode };
export {
  DEFAULT_VOICE_COUNT_MODE,
  VOICE_COUNT_MODES,
  clampVoiceCountMode,
  resolveTurboCount,
  buildCountPaceSchedule,
  formatCountDisplay,
} from '@/utils/aiCountPace';

/** Trainer-like pacing (ms). */
export const VOICE_COACH_TIMING = {
  beepGapMs: 420,
  afterBeepsMs: 650,
  countdownGapMs: 880,
  afterCountdownMs: 350,
  afterStartMs: 950,
  /** Default post-speech gap — 3s is a calm, form-friendly tempo. */
  repGapMs: 3000,
  oneMoreGapMs: 2200,
} as const;

/** User-configurable gap between spoken counts. */
export const VOICE_COACH_REP_GAP = {
  defaultMs: VOICE_COACH_TIMING.repGapMs,
  minMs: 800,
  maxMs: 10_000,
  stepMs: 100,
} as const;

/** How many "하나더" cues after the target reps. */
export const VOICE_COACH_ONE_MORE = {
  defaultCount: 3,
  minCount: 1,
  maxCount: 10,
  step: 1,
} as const;

export function clampVoiceCoachRepGapMs(ms: number): number {
  if (!Number.isFinite(ms)) return VOICE_COACH_REP_GAP.defaultMs;
  const stepped = Math.round(ms / VOICE_COACH_REP_GAP.stepMs) * VOICE_COACH_REP_GAP.stepMs;
  return Math.min(VOICE_COACH_REP_GAP.maxMs, Math.max(VOICE_COACH_REP_GAP.minMs, stepped));
}

export function clampVoiceCoachOneMoreCount(count: number): number {
  if (!Number.isFinite(count)) return VOICE_COACH_ONE_MORE.defaultCount;
  const stepped =
    Math.round(count / VOICE_COACH_ONE_MORE.step) * VOICE_COACH_ONE_MORE.step;
  return Math.min(
    VOICE_COACH_ONE_MORE.maxCount,
    Math.max(VOICE_COACH_ONE_MORE.minCount, stepped)
  );
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
  if (isKoreanLocale(locale)) {
    const map: Record<number, string> = {
      10: '십',
      9: '구',
      8: '팔',
      7: '칠',
      6: '육',
      5: '오',
      4: '사',
      3: '삼',
      2: '이',
      1: '일',
    };
    return map[n] ?? String(n);
  }
  return String(n);
}

function readyPhrase(locale?: string): string {
  return isKoreanLocale(locale) ? '준비' : 'Ready';
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

/** Shared AudioContext for beeps only (speech is SpeechManager / TTS). */
let sharedAudioCtx: AudioContext | null = null;

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
  if ((ctx.state as string) === 'suspended') {
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

export function stopVoiceCoach(): void {
  speechManager.cancel();
}

/** Speak a single phrase through SpeechManager (cancels any current queue). */
export function speakVoiceText(
  text: string,
  _locale?: string,
  signal?: AbortSignal
): Promise<void> {
  return speechManager.speak(text, signal);
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
 * During rest: speak cautions first, then workout tips — same SpeechManager Voice/queue.
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

  const queue: string[] = [];
  if (warningLines.length > 0) {
    queue.push(ko ? '주의사항.' : 'Cautions.');
    queue.push(...warningLines);
  }
  if (tipLines.length > 0) {
    queue.push(ko ? '운동 팁.' : 'Workout tips.');
    queue.push(...tipLines);
  }

  try {
    await speechManager.speakQueue(queue, {
      signal,
      gapMs: 320,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      stopVoiceCoach();
      return;
    }
    throw error;
  }
}

/**
 * Warm audio/TTS inside a user-gesture turn.
 * Must be awaited from the start button handler.
 */
export async function unlockVoiceCoachAudio(): Promise<void> {
  await speechManager.init();
  speechManager.unlock();
  await ensureSharedAudioRunning();
}

/**
 * Full set coach sequence (all spoken lines share one SpeechManager Voice):
 * tip tip tip → 준비 → N … 1 → 시작! → 하나 둘 … → (optional) 하나더!
 */
export async function runVoiceCoachSession(options: VoiceCoachOptions): Promise<void> {
  const {
    targetReps,
    oneMoreEnabled,
    maxOneMore = VOICE_COACH_ONE_MORE.defaultCount,
    repGapMs: repGapMsOption,
    countMode: countModeOption,
    prepCount: prepCountOption,
    locale = 'ko',
    onPhaseChange,
    signal,
  } = options;

  const reps = Math.max(1, Math.min(50, Math.round(targetReps)));
  const oneMoreReps = clampVoiceCoachOneMoreCount(maxOneMore);
  const repGapMs = clampVoiceCoachRepGapMs(repGapMsOption ?? VOICE_COACH_TIMING.repGapMs);
  const oneMoreGapMs = Math.max(repGapMs, VOICE_COACH_TIMING.oneMoreGapMs - 200);
  const countMode = clampVoiceCountMode(countModeOption ?? DEFAULT_VOICE_COUNT_MODE);
  const prepCount = clampVoiceCoachPrepCount(
    prepCountOption ?? DEFAULT_VOICE_COACH_PREP_COUNT
  );

  await speechManager.init();

  const audioCtx = await ensureSharedAudioRunning();

  try {
    onPhaseChange?.('beep');
    if (audioCtx) {
      for (let i = 0; i < 3; i += 1) {
        await playBeep(audioCtx, signal, 880 + i * 40);
        if (i < 2) await sleep(VOICE_COACH_TIMING.beepGapMs, signal);
      }
    } else {
      await speechManager.speakQueue(
        isKoreanLocale(locale) ? ['띡', '띡', '띡'] : ['tick', 'tick', 'tick'],
        { signal, gapMs: 120 }
      );
    }

    await sleep(VOICE_COACH_TIMING.afterBeepsMs, signal);

    // Prep countdown — fixed pacing (never AI-accel / turbo).
    onPhaseChange?.('countdown');
    const countdownNumbers = Array.from({ length: prepCount }, (_, i) => prepCount - i);
    const countdownItems = [
      readyPhrase(locale),
      ...countdownNumbers.map((n) => formatCountdownWord(n, locale)),
    ];
    await speechManager.speakQueue(countdownItems, {
      signal,
      gapMs: VOICE_COACH_TIMING.countdownGapMs,
      onItemStart: (index) => {
        if (index === 0) {
          onPhaseChange?.('countdown');
          return;
        }
        onPhaseChange?.('countdown', { countdown: prepCount - index + 1 });
      },
    });

    await sleep(VOICE_COACH_TIMING.afterCountdownMs, signal);
    onPhaseChange?.('start');
    await speechManager.speak(startPhrase(locale), signal);
    await sleep(VOICE_COACH_TIMING.afterStartMs, signal);

    // Exercise counts only — AI accel / turbo schedule (voice rate/pitch unchanged).
    onPhaseChange?.('counting', { rep: 0 });
    const pace = buildCountPaceSchedule({
      totalCounts: reps,
      baseGapMs: repGapMs,
      mode: countMode,
      minGapMs: VOICE_COACH_REP_GAP.minMs,
    });
    const repWords = Array.from({ length: reps }, (_, i) => formatRepWord(i + 1, locale));
    await speechManager.speakQueue(repWords, {
      signal,
      gapMs: repGapMs,
      getGapMs: (index) => pace[index]?.gapAfterMs ?? repGapMs,
      onItemStart: (index) => {
        const step = pace[index];
        onPhaseChange?.('counting', {
          rep: index + 1,
          turbo: step?.turbo ?? false,
          intensity: step?.intensity ?? 0,
        });
      },
    });

    if (oneMoreEnabled) {
      // Pause after final rep before "하나더" (last schedule gap is 0 by design).
      const bridgeGap =
        reps >= 2 ? pace[reps - 2]?.gapAfterMs || repGapMs : repGapMs;
      await sleep(bridgeGap, signal);
      onPhaseChange?.('oneMore', { rep: reps });
      const oneMoreWords = Array.from({ length: oneMoreReps }, () => oneMorePhrase(locale));
      await speechManager.speakQueue(oneMoreWords, {
        signal,
        gapMs: oneMoreGapMs,
        onItemStart: (index) => {
          onPhaseChange?.('oneMore', { rep: reps + index + 1 });
        },
      });
    }

    onPhaseChange?.('done', { rep: oneMoreEnabled ? reps + oneMoreReps : reps });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      stopVoiceCoach();
      onPhaseChange?.('idle');
      return;
    }
    throw error;
  }
}
