/** Voice set coach: beeps → 준비 → N–1 → 시작 → reps → optional "하나더" → optional hold. */

import {
  buildCountPaceSchedule,
  clampVoiceCountMode,
  DEFAULT_VOICE_COUNT_MODE,
  type VoiceCountMode,
} from '@/utils/aiCountPace';
import { toSinoKoreanCount } from '@/utils/iosMaleCountSpeech';
import { speechManager } from '@/utils/speechManager';
import {
  isMaleEnglishPack,
  resolveVoiceCoachSpeechLocale,
  voiceCoachCue,
  voiceCoachSpeechLangTag,
} from '@/utils/voiceCoachLanguage';
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
  voiceCoachClipUrl,
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
import {
  getActiveVoiceCoachPause,
  sleepWithVoiceCoachPause,
} from '@/utils/voiceCoachPause';

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

/** Default target reps for voice count (Settings + records pickers). */
export const DEFAULT_VOICE_COACH_REPS = 12;
export const VOICE_COACH_TARGET_REPS = {
  defaultCount: DEFAULT_VOICE_COACH_REPS,
  minCount: 1,
  maxCount: 30,
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

/**
 * Normalize target reps from settings / seeds.
 * Invalid, non-positive, or non-finite → default (not range min).
 */
export function clampVoiceCoachTargetReps(reps: number): number {
  if (!Number.isFinite(reps) || reps <= 0) return VOICE_COACH_TARGET_REPS.defaultCount;
  return Math.min(
    VOICE_COACH_TARGET_REPS.maxCount,
    Math.max(VOICE_COACH_TARGET_REPS.minCount, Math.round(reps))
  );
}

export function clampVoiceCoachRepGapMs(ms: number): number {
  // 0 / negative are invalid persisted values — restore default, not min (800ms).
  if (!Number.isFinite(ms) || ms <= 0) return VOICE_COACH_REP_GAP.defaultMs;
  const stepped = Math.round(ms / VOICE_COACH_REP_GAP.stepMs) * VOICE_COACH_REP_GAP.stepMs;
  return Math.min(VOICE_COACH_REP_GAP.maxMs, Math.max(VOICE_COACH_REP_GAP.minMs, stepped));
}

export function clampVoiceCoachOneMoreCount(count: number): number {
  // Non-positive → default (3), not min (1).
  if (!Number.isFinite(count) || count <= 0) return VOICE_COACH_ONE_MORE.defaultCount;
  const stepped =
    Math.round(count / VOICE_COACH_ONE_MORE.step) * VOICE_COACH_ONE_MORE.step;
  return Math.min(
    VOICE_COACH_ONE_MORE.maxCount,
    Math.max(VOICE_COACH_ONE_MORE.minCount, stepped)
  );
}

/** True when all pickers sit at range mins — classic ScrollPicker mount corruption. */
export function isVoicePickerAllMins(snapshot: {
  targetReps?: number;
  repGapMs?: number;
  oneMoreCount?: number;
  holdDurationSec?: number;
}): boolean {
  return (
    snapshot.targetReps === VOICE_COACH_TARGET_REPS.minCount &&
    snapshot.repGapMs === VOICE_COACH_REP_GAP.minMs &&
    snapshot.oneMoreCount === VOICE_COACH_ONE_MORE.minCount &&
    snapshot.holdDurationSec === VOICE_HOLD_DURATION.minSec
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

export function formatRepWord(
  n: number,
  _locale?: string,
  voicePack?: VoiceCoachPack
): string {
  // Language follows voice pack (female KO / male EN), not UI locale.
  if (normalizeVoiceCoachPack(voicePack) === 'male') return toEnglishRep(n);
  return toNativeKoreanRep(n);
}

function formatCountdownWord(
  n: number,
  _locale?: string,
  _voicePack?: VoiceCoachPack
): string {
  // Prep countdown clips are English for both packs (female Jenny / male Guy).
  return toEnglishRep(n);
}

function readyPhrase(_locale?: string, voicePack?: VoiceCoachPack): string {
  return voiceCoachCue('ready', voicePack);
}

function startPhrase(_locale?: string, voicePack?: VoiceCoachPack): string {
  return voiceCoachCue('start', voicePack);
}

function oneMorePhrase(_locale?: string, voicePack?: VoiceCoachPack): string {
  return voiceCoachCue('oneMore', voicePack);
}

/** TTS options that follow female=ko / male=en pack policy. */
function packSpeakOptions(
  voicePack: VoiceCoachPack,
  signal?: AbortSignal
): {
  signal?: AbortSignal;
  lang: string;
  preferMaleVoice?: boolean;
  preferFemaleVoice?: boolean;
} {
  const speechLocale = resolveVoiceCoachSpeechLocale(voicePack);
  return {
    signal,
    lang: voiceCoachSpeechLangTag(speechLocale),
    preferMaleVoice: speechLocale === 'en' ? true : undefined,
    preferFemaleVoice: speechLocale === 'ko' ? true : undefined,
  };
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return sleepWithVoiceCoachPause(ms, signal);
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
    text: readyPhrase(locale, voicePack),
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
      text: formatCountdownWord(n, locale, voicePack),
      locale,
      signal,
      voicePack,
      kind: 'count',
      countValue: n,
    });
    if (n > 1) await sleep(VOICE_COACH_TIMING.countdownGapMs, signal);
  }

  await sleep(VOICE_COACH_TIMING.afterCountdownMs, signal);
  onPhaseChange?.('start');
  await speakCoachCue({
    clipKey: 'start',
    text: startPhrase(locale, voicePack),
    locale,
    signal,
    voicePack,
    kind: 'phrase',
  });
  await sleep(VOICE_COACH_TIMING.afterStartMs, signal);
}

/**
 * Clip packs:
 * - female: Korean drill clips / TTS
 * - male: English drill clips / TTS
 *
 * Mixing TTS + clips on the same beat often dies after the first cue on mobile.
 */
async function speakCoachCue(options: {
  clipKey: string | null;
  text: string;
  locale?: string;
  signal?: AbortSignal;
  voicePack?: VoiceCoachPack;
  /** ready = 준비 cue without a clip file */
  kind?: 'ready' | 'count' | 'phrase';
  /** Numeric value for count cues (TTS fallback wording). */
  countValue?: number;
}): Promise<void> {
  await getActiveVoiceCoachPause()?.waitWhilePaused(options.signal);

  const {
    clipKey,
    text,
    signal,
    voicePack = DEFAULT_VOICE_COACH_PACK,
    kind = 'phrase',
    countValue,
  } = options;
  const pack = normalizeVoiceCoachPack(voicePack);
  const maleEnglish = isMaleEnglishPack(pack);

  if (clipKey) {
    // Male pack must never play female (Korean) clip URLs — language is pack-locked.
    const clipUrl = voiceCoachClipUrl(clipKey, pack);
    if (maleEnglish && !clipUrl.includes('/voice-coach/male/')) {
      await speechManager.speak(
        kind === 'count' && typeof countValue === 'number'
          ? toEnglishRep(countValue)
          : text || voiceCoachCue('ready', pack),
        { ...packSpeakOptions(pack, signal), rate: 0.92 }
      );
      return;
    }
    const played = await playVoiceCoachClip(clipKey, signal, pack);
    if (played) return;
    const ctx = await ensureVoiceCoachAudioRunning();
    if (ctx) {
      const retried = await playVoiceCoachClip(clipKey, signal, pack);
      if (retried) return;
    }
    // Clip missing/failed — speak the number/phrase (never beep for count cues).
    if (kind === 'count' || kind === 'phrase') {
      let fallbackText = text;
      const prepCountdown = kind === 'count' && !!clipKey?.startsWith('cd-');
      if (kind === 'count' && typeof countValue === 'number') {
        // Female prep countdown is English; female exercise reps stay Korean.
        fallbackText =
          maleEnglish || prepCountdown
            ? toEnglishRep(countValue)
            : toSinoKoreanCount(countValue);
      }
      const speakOpts = packSpeakOptions(pack, signal);
      if (prepCountdown && !maleEnglish) {
        speakOpts.lang = 'en-US';
        speakOpts.preferFemaleVoice = true;
        speakOpts.preferMaleVoice = undefined;
      }
      await speechManager.speak(fallbackText, {
        ...speakOpts,
        rate: maleEnglish || prepCountdown ? 0.92 : undefined,
      });
      return;
    }
  }

  // Ready cue (both packs): dual beep — same as female prep; no spoken "Ready"/"준비".
  if (kind === 'ready') {
    const ctx = await ensureVoiceCoachAudioRunning();
    if (ctx) {
      await playBeep(ctx, signal, 660, 0.09);
      await playBeep(ctx, signal, 880, 0.09);
      return;
    }
  }

  // Count / phrase without a clip key (or Web Audio down): spoken TTS.
  await speechManager.speak(text, packSpeakOptions(pack, signal));
}

export interface RestVoiceCoachingOptions {
  warnings?: string[];
  tips?: string[];
  /** @deprecated Prefer voicePack — speech language follows female=ko / male=en. */
  locale?: string;
  voicePack?: VoiceCoachPack;
  signal?: AbortSignal;
  /** Speak the rest-start cue even when there are no tips/warnings. */
  announceRestStart?: boolean;
  /** Max warning lines to speak (default 3). */
  maxWarnings?: number;
  /** Max tip lines to speak (default 3). */
  maxTips?: number;
}

/**
 * During rest: rest-start cue, then cautions, then workout tips.
 * Language follows voice pack (female Korean / male English).
 */
export async function speakRestTipsAndWarnings(
  options: RestVoiceCoachingOptions
): Promise<void> {
  const {
    warnings = [],
    tips = [],
    voicePack,
    signal,
    announceRestStart = true,
    maxWarnings = 3,
    maxTips = 3,
  } = options;

  const pack = normalizeVoiceCoachPack(voicePack);
  const warningLines = warnings.map((w) => w.trim()).filter(Boolean).slice(0, maxWarnings);
  const tipLines = tips.map((t) => t.trim()).filter(Boolean).slice(0, maxTips);
  if (!announceRestStart && warningLines.length === 0 && tipLines.length === 0) return;

  const queue: string[] = [];
  // Male set-complete "Rest" must match Start / One more clip voice (GuyNeural),
  // not OS TTS. Female rest-start stays spoken TTS.
  if (announceRestStart) {
    if (pack === 'male') {
      let played = false;
      try {
        played = await playVoiceCoachClip('rest', signal, pack);
      } catch {
        played = false;
      }
      if (!played) queue.push(voiceCoachCue('restStart', pack));
    } else {
      queue.push(voiceCoachCue('restStart', pack));
    }
  }
  if (warningLines.length > 0) {
    queue.push(voiceCoachCue('cautions', pack));
    queue.push(...warningLines);
  }
  if (tipLines.length > 0) {
    queue.push(voiceCoachCue('workoutTips', pack));
    queue.push(...tipLines);
  }

  if (queue.length === 0) return;

  try {
    await speechManager.speakQueue(queue, {
      ...packSpeakOptions(pack, signal),
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
    // Resolve once AudioContext is running + keep-alive started.
    // Do not await clip preload or wake lock (those made first Start silent).
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
    } else if (isMaleEnglishPack(voicePack)) {
      await speechManager.speakQueue(['tick', 'tick', 'tick'], {
        ...packSpeakOptions(voicePack, signal),
        gapMs: 120,
      });
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
        text: formatRepWord(i + 1, locale, voicePack),
        locale,
        signal,
        voicePack,
        kind: 'count',
        countValue: i + 1,
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
          text: oneMorePhrase(locale, voicePack),
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
    } else if (isMaleEnglishPack(voicePack)) {
      await speechManager.speakQueue(['tick', 'tick', 'tick'], {
        ...packSpeakOptions(voicePack, signal),
        gapMs: 120,
      });
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
