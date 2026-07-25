/** Voice set coach: beeps → 준비 → N–1 → 시작 → reps → optional "하나더" → optional hold. */

import {
  buildCountPaceSchedule,
  clampVoiceCountMode,
  DEFAULT_VOICE_COUNT_MODE,
  type VoiceCountMode,
} from '@/utils/aiCountPace';
import { speechManager } from '@/utils/speechManager';
import {
  beginVoiceCoachAudioSession,
  endVoiceCoachAudioSession,
} from '@/utils/voiceCoachAudioSession';
import {
  countdownClipKey,
  DEFAULT_VOICE_COACH_PACK,
  ensureVoiceCoachAudioRunning,
  normalizeVoiceCoachPack,
  playVoiceCoachClip,
  preloadVoiceCoachClips,
  repClipKey,
  primeVoiceCoachAudioSync,
  stopVoiceCoachClips,
  unlockVoiceCoachClips,
  type VoiceCoachPack,
} from '@/utils/voiceCoachClips';
import {
  clampVoiceHoldDurationSec,
  clampVoiceHoldFlowMode,
  DEFAULT_VOICE_HOLD_FLOW_MODE,
  runVoiceHoldSegment,
  VOICE_HOLD_DURATION,
  type VoiceHoldFlowMode,
} from '@/utils/voiceHold';

export type VoiceCoachPhase =
  | 'idle'
  | 'beep'
  | 'countdown'
  | 'start'
  | 'counting'
  | 'oneMore'
  | 'hold'
  | 'done';

export interface VoiceCoachPhaseDetail {
  rep?: number;
  countdown?: number;
  /** Inside turbo window (number counts + one-more). */
  turbo?: boolean;
  /** 0–1 intensity for UI/haptics (number counts + one-more). */
  intensity?: number;
  /** True while speaking the "버텨!!!" cue. */
  holdCue?: boolean;
  finishPhrase?: string;
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
   * Count pacing for number reps + optional one-more cues (prep/rest unchanged).
   * Default: AI accel + turbo.
   */
  countMode?: VoiceCountMode;
  /** Prep countdown from N to 1 (default 5). */
  prepCount?: VoiceCoachPrepCount;
  /** Pre-recorded Korean clip pack: female | male. */
  voicePack?: VoiceCoachPack;
  /**
   * Optional hold segment after number counts (+ one-more).
   * Additive — does not alter the count loop itself.
   */
  afterCountHold?: { durationSec: number } | null;
  locale?: string;
  onPhaseChange?: (phase: VoiceCoachPhase, detail?: VoiceCoachPhaseDetail) => void;
  signal?: AbortSignal;
}

export interface VoiceCoachFlowOptions extends VoiceCoachOptions {
  /** count | count_hold | hold — default count (legacy behavior). */
  flowMode?: VoiceHoldFlowMode;
  holdDurationSec?: number;
}

export type { VoiceCountMode } from '@/utils/aiCountPace';
export type { VoiceHoldFlowMode } from '@/utils/voiceHold';
export type { VoiceCoachPack } from '@/utils/voiceCoachClips';
export {
  DEFAULT_VOICE_COUNT_MODE,
  VOICE_COUNT_MODES,
  clampVoiceCountMode,
  resolveTurboCount,
  buildCountPaceSchedule,
  formatCountDisplay,
} from '@/utils/aiCountPace';
export {
  DEFAULT_VOICE_COACH_PACK,
  VOICE_COACH_PACKS,
  normalizeVoiceCoachPack,
} from '@/utils/voiceCoachClips';
export {
  DEFAULT_VOICE_HOLD_FLOW_MODE,
  VOICE_HOLD_FLOW_MODES,
  VOICE_HOLD_DURATION,
  VOICE_HOLD_DURATION_PRESETS,
  clampVoiceHoldFlowMode,
  clampVoiceHoldDurationSec,
  isVoiceHoldDurationPreset,
  runVoiceHoldSegment,
  holdCuePhrase,
} from '@/utils/voiceHold';

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

export interface StopVoiceCoachOptions {
  /**
   * Keep silent keep-alive / ducked music / wake lock warm.
   * Use when restarting count after rest so mobile does not need a fresh gesture.
   */
  keepAudioSession?: boolean;
}

/**
 * Monotonic session id. Abort cleanup from an older run must not stop clips /
 * end the audio session that a newer Start already owns (fixes "오/5만 외치고 끝").
 */
let voiceCoachSessionGeneration = 0;

function bumpVoiceCoachSessionGeneration(): number {
  voiceCoachSessionGeneration += 1;
  return voiceCoachSessionGeneration;
}

export function stopVoiceCoach(options?: StopVoiceCoachOptions): void {
  bumpVoiceCoachSessionGeneration();
  speechManager.cancel();
  stopVoiceCoachClips();
  if (!options?.keepAudioSession) {
    void endVoiceCoachAudioSession();
  }
}

/** Speak a single phrase through SpeechManager (cancels any current queue). */
export function speakVoiceText(
  text: string,
  _locale?: string,
  signal?: AbortSignal
): Promise<void> {
  return speechManager.speak(text, signal);
}

/**
 * Shared prep: 준비 → N…1 → 시작!
 * Used by count sessions and hold-only so "버텨!!!만" still gets a ready countdown.
 */
async function runPrepCountdownPhase(options: {
  prepCount: VoiceCoachPrepCount;
  locale: string;
  voicePack: VoiceCoachPack;
  signal?: AbortSignal;
  stillOwner: () => boolean;
  onPhaseChange?: (phase: VoiceCoachPhase, detail?: VoiceCoachPhaseDetail) => void;
}): Promise<void> {
  const { prepCount, locale, voicePack, signal, stillOwner, onPhaseChange } = options;

  onPhaseChange?.('countdown');
  await speakCoachCue({
    clipKey: null,
    text: readyPhrase(locale),
    locale,
    signal,
    voicePack,
    kind: 'ready',
  });
  await sleep(VOICE_COACH_TIMING.countdownGapMs, signal);

  for (let n = prepCount; n >= 1; n -= 1) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (!stillOwner()) throw new DOMException('Aborted', 'AbortError');
    onPhaseChange?.('countdown', { countdown: n });
    await speakCoachCue({
      clipKey: countdownClipKey(n),
      text: formatCountdownWord(n, locale),
      locale,
      signal,
      voicePack,
      kind: 'count',
    });
    if (n > 1) await sleep(VOICE_COACH_TIMING.countdownGapMs, signal);
  }

  await sleep(VOICE_COACH_TIMING.afterCountdownMs, signal);
  onPhaseChange?.('start');
  await speakCoachCue({
    clipKey: 'start',
    text: startPhrase(locale),
    locale,
    signal,
    voicePack,
    kind: 'phrase',
  });
  await sleep(VOICE_COACH_TIMING.afterStartMs, signal);
}

/**
 * Korean set-count path is Web Audio clips only — never interleave speechSynthesis.
 * Mixing TTS + clips on mobile often plays the first clip (cd-5 / 「오」) then dies.
 * Non-Korean still uses TTS.
 */
async function speakCoachCue(options: {
  clipKey: string | null;
  text: string;
  locale?: string;
  signal?: AbortSignal;
  voicePack?: VoiceCoachPack;
  /** ready = 준비 cue without a clip file */
  kind?: 'ready' | 'count' | 'phrase';
}): Promise<void> {
  const {
    clipKey,
    text,
    locale,
    signal,
    voicePack = DEFAULT_VOICE_COACH_PACK,
    kind = 'phrase',
  } = options;
  const pack = normalizeVoiceCoachPack(voicePack);

  if (!isKoreanLocale(locale)) {
    await speechManager.speak(text, signal);
    return;
  }

  if (clipKey) {
    const played = await playVoiceCoachClip(clipKey, signal, pack);
    if (played) return;
    const ctx = await ensureVoiceCoachAudioRunning();
    if (ctx) {
      const retried = await playVoiceCoachClip(clipKey, signal, pack);
      if (retried) return;
    }
    // Clip missing/failed — speak the number/phrase (never beep for count cues).
    if (kind === 'count' || kind === 'phrase') {
      await speechManager.speak(text, signal);
      return;
    }
  }

  // "준비" has no clip — short dual beep, then fall through to TTS if needed.
  if (kind === 'ready') {
    const ctx = await ensureVoiceCoachAudioRunning();
    if (ctx) {
      await playBeep(ctx, signal, 660, 0.09);
      await playBeep(ctx, signal, 880, 0.09);
      return;
    }
  }

  // Count / phrase without a clip key (or Web Audio down): spoken TTS.
  await speechManager.speak(text, signal);
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
      // Do NOT stopVoiceCoach() here. Rest-end / Start often abort tips and
      // immediately begin set-count; tearing down would kill the new session
      // (classic "오만 외치고 끝" / start no-op race).
      return;
    }
    throw error;
  }
}

/**
 * Warm clips / Web Audio / TTS inside a user-gesture turn.
 * Sync unlock work starts before the first await so mobile autoplay stays valid.
 * Prefer calling this directly from the Start / set-complete tap handler.
 */
export function unlockVoiceCoachAudio(voicePack?: VoiceCoachPack): Promise<void> {
  // Sync work first — must stay inside the user-gesture turn.
  // Waiting on clip decode here made the first Count Start silent on mobile
  // (set-complete had already primed audio, so only the first tap failed).
  const pack = normalizeVoiceCoachPack(voicePack);
  primeVoiceCoachAudioSync();
  speechManager.unlock();
  void speechManager.init();
  const clipsUnlock = unlockVoiceCoachClips(pack);
  const sessionUnlock = beginVoiceCoachAudioSession();

  return (async () => {
    // Resolve once the audio graph / keep-alive is up — do not await clip preload.
    await Promise.all([sessionUnlock, ensureVoiceCoachAudioRunning()]);
    void clipsUnlock;
  })();
}

/**
 * Full set coach sequence:
 * tip tip tip → 준비 → N … 1 → 시작! → 하나 둘 … → (optional) 하나더!
 * Korean count cues prefer pre-recorded clips; TTS is fallback.
 */
export async function runVoiceCoachSession(options: VoiceCoachOptions): Promise<void> {
  const {
    targetReps,
    oneMoreEnabled,
    maxOneMore = VOICE_COACH_ONE_MORE.defaultCount,
    repGapMs: repGapMsOption,
    countMode: countModeOption,
    prepCount: prepCountOption,
    voicePack: voicePackOption,
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
  const voicePack = normalizeVoiceCoachPack(voicePackOption);

  // New run owns cleanup; older aborted runs must not tear us down.
  const sessionGen = bumpVoiceCoachSessionGeneration();
  const stillOwner = () => sessionGen === voiceCoachSessionGeneration;

  await beginVoiceCoachAudioSession();
  const afterHoldSec = options.afterCountHold?.durationSec;
  void preloadVoiceCoachClips({
    reps,
    oneMoreEnabled,
    prepCount,
    pack: voicePack,
    includeHold: Boolean(afterHoldSec),
    holdDurationSec: afterHoldSec,
    signal,
  });

  const audioCtx = await ensureVoiceCoachAudioRunning();

  try {
    onPhaseChange?.('beep');
    if (audioCtx) {
      for (let i = 0; i < 3; i += 1) {
        await playBeep(audioCtx, signal, 880 + i * 40);
        if (i < 2) await sleep(VOICE_COACH_TIMING.beepGapMs, signal);
      }
    } else if (!isKoreanLocale(locale)) {
      await speechManager.speakQueue(['tick', 'tick', 'tick'], { signal, gapMs: 120 });
    }

    await sleep(VOICE_COACH_TIMING.afterBeepsMs, signal);

    // Prep countdown — fixed pacing (never AI-accel / turbo).
    await runPrepCountdownPhase({
      prepCount,
      locale,
      voicePack,
      signal,
      stillOwner,
      onPhaseChange,
    });

    // Number counts + optional one-more share one AI accel / turbo schedule
    // (voice rate/pitch unchanged; prep/rest stay fixed).
    onPhaseChange?.('counting', { rep: 0 });
    const totalCounts = oneMoreEnabled ? reps + oneMoreReps : reps;
    const pace = buildCountPaceSchedule({
      totalCounts,
      baseGapMs: repGapMs,
      mode: countMode,
      minGapMs: VOICE_COACH_REP_GAP.minMs,
    });

    for (let i = 0; i < reps; i += 1) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      if (!stillOwner()) throw new DOMException('Aborted', 'AbortError');
      const step = pace[i];
      onPhaseChange?.('counting', {
        rep: i + 1,
        turbo: step?.turbo ?? false,
        intensity: step?.intensity ?? 0,
      });
      await speakCoachCue({
        clipKey: repClipKey(i + 1),
        text: formatRepWord(i + 1, locale),
        locale,
        signal,
        voicePack,
        kind: 'count',
      });
      // Last number → one-more bridge is applied below from pace[reps - 1].
      if (i < reps - 1) {
        const gap = pace[i]?.gapAfterMs ?? repGapMs;
        if (gap > 0) await sleep(gap, signal);
      }
    }

    if (oneMoreEnabled) {
      const bridgeGap = pace[reps - 1]?.gapAfterMs ?? oneMoreGapMs;
      if (bridgeGap > 0) await sleep(bridgeGap, signal);
      onPhaseChange?.('oneMore', {
        rep: reps,
        turbo: pace[reps]?.turbo ?? false,
        intensity: pace[reps]?.intensity ?? 0,
      });
      for (let i = 0; i < oneMoreReps; i += 1) {
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        if (!stillOwner()) throw new DOMException('Aborted', 'AbortError');
        const step = pace[reps + i];
        onPhaseChange?.('oneMore', {
          rep: reps + i + 1,
          turbo: step?.turbo ?? false,
          intensity: step?.intensity ?? 0,
        });
        await speakCoachCue({
          clipKey: 'one-more',
          text: oneMorePhrase(locale),
          locale,
          signal,
          voicePack,
          kind: 'phrase',
        });
        if (i < oneMoreReps - 1) {
          const gap = pace[reps + i]?.gapAfterMs ?? oneMoreGapMs;
          if (gap > 0) await sleep(gap, signal);
        }
      }
    }

    const finalRep = oneMoreEnabled ? reps + oneMoreReps : reps;

    // Additive hold extension — count / one-more logic above is unchanged.
    // Hold uses TTS; only run if this session still owns the generation.
    if (options.afterCountHold && stillOwner()) {
      await sleep(VOICE_COACH_TIMING.afterStartMs, signal);
      await runVoiceHoldSegment({
        durationSec: options.afterCountHold.durationSec,
        locale,
        voicePack,
        signal,
        onPhaseChange: (holdPhase, detail) => {
          if (holdPhase === 'holdCue') {
            onPhaseChange?.('hold', { holdCue: true, rep: finalRep });
            return;
          }
          if (holdPhase === 'holdCountdown') {
            onPhaseChange?.('hold', {
              countdown: detail?.countdown,
              rep: finalRep,
            });
            return;
          }
          if (holdPhase === 'holdFinish') {
            onPhaseChange?.('hold', {
              countdown: 0,
              finishPhrase: detail?.finishPhrase,
              rep: finalRep,
            });
          }
        },
      });
    }

    onPhaseChange?.('done', { rep: finalRep });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (stillOwner()) {
        speechManager.cancel();
        stopVoiceCoachClips();
        onPhaseChange?.('idle');
      }
      return;
    }
    throw error;
  } finally {
    // Never end the shared audio session if a newer Start already took ownership.
    if (stillOwner()) {
      await endVoiceCoachAudioSession();
    }
  }
}

/** Standalone hold: tip beeps → prep N…1 → 시작! → 버텨!!! → countdown → finish. */
export async function runVoiceHoldOnlySession(options: {
  holdDurationSec?: number;
  prepCount?: VoiceCoachPrepCount;
  voicePack?: VoiceCoachPack;
  locale?: string;
  onPhaseChange?: (phase: VoiceCoachPhase, detail?: VoiceCoachPhaseDetail) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const locale = options.locale ?? 'ko';
  const { signal, onPhaseChange } = options;
  const durationSec = clampVoiceHoldDurationSec(
    options.holdDurationSec ?? VOICE_HOLD_DURATION.defaultSec
  );
  const prepCount = clampVoiceCoachPrepCount(
    options.prepCount ?? DEFAULT_VOICE_COACH_PREP_COUNT
  );
  const voicePack = normalizeVoiceCoachPack(options.voicePack);

  const sessionGen = bumpVoiceCoachSessionGeneration();
  const stillOwner = () => sessionGen === voiceCoachSessionGeneration;

  await beginVoiceCoachAudioSession();
  void preloadVoiceCoachClips({
    reps: 1,
    oneMoreEnabled: false,
    prepCount,
    pack: voicePack,
    includeHold: true,
    holdDurationSec: durationSec,
    signal,
  });
  const audioCtx = await ensureVoiceCoachAudioRunning();

  try {
    onPhaseChange?.('beep');
    if (audioCtx) {
      for (let i = 0; i < 3; i += 1) {
        await playBeep(audioCtx, signal, 880 + i * 40);
        if (i < 2) await sleep(VOICE_COACH_TIMING.beepGapMs, signal);
      }
    } else if (!isKoreanLocale(locale)) {
      await speechManager.speakQueue(['tick', 'tick', 'tick'], { signal, gapMs: 120 });
    }
    await sleep(VOICE_COACH_TIMING.afterBeepsMs, signal);

    await runPrepCountdownPhase({
      prepCount,
      locale,
      voicePack,
      signal,
      stillOwner,
      onPhaseChange,
    });

    await runVoiceHoldSegment({
      durationSec,
      locale,
      voicePack,
      signal,
      onPhaseChange: (holdPhase, detail) => {
        if (holdPhase === 'holdCue') {
          onPhaseChange?.('hold', { holdCue: true });
          return;
        }
        if (holdPhase === 'holdCountdown') {
          onPhaseChange?.('hold', { countdown: detail?.countdown });
          return;
        }
        if (holdPhase === 'holdFinish') {
          onPhaseChange?.('hold', {
            countdown: 0,
            finishPhrase: detail?.finishPhrase,
          });
        }
      },
    });

    onPhaseChange?.('done');
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (stillOwner()) {
        speechManager.cancel();
        stopVoiceCoachClips();
        onPhaseChange?.('idle');
      }
      return;
    }
    throw error;
  } finally {
    if (stillOwner()) {
      await endVoiceCoachAudioSession();
    }
  }
}

/**
 * Unified entry: count / count+hold / hold-only.
 * Prefer this from UI hooks so count logic stays behind a stable API.
 */
export async function runVoiceCoachFlow(options: VoiceCoachFlowOptions): Promise<void> {
  const flowMode = clampVoiceHoldFlowMode(
    options.flowMode ?? DEFAULT_VOICE_HOLD_FLOW_MODE
  );
  const holdDurationSec = clampVoiceHoldDurationSec(
    options.holdDurationSec ?? VOICE_HOLD_DURATION.defaultSec
  );

  if (flowMode === 'hold') {
    await runVoiceHoldOnlySession({
      holdDurationSec,
      prepCount: options.prepCount,
      voicePack: options.voicePack,
      locale: options.locale,
      signal: options.signal,
      onPhaseChange: options.onPhaseChange,
    });
    return;
  }

  await runVoiceCoachSession({
    ...options,
    afterCountHold:
      flowMode === 'count_hold' ? { durationSec: holdDurationSec } : null,
  });
}
