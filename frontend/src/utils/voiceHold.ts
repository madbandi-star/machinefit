/**
 * Reusable "버텨!!!" (isometric hold) voice segment.
 * Designed for standalone use, post-count chaining, and future
 * supersets / dropsets / intervals without touching count pacing.
 *
 * Korean path prefers the selected voice-coach clip pack (female/male);
 * OS TTS is fallback only (and for non-Korean).
 */

import { speechManager } from '@/utils/speechManager';
import {
  countdownClipKey,
  DEFAULT_VOICE_COACH_PACK,
  normalizeVoiceCoachPack,
  playVoiceCoachClip,
  repClipKey,
  type VoiceCoachPack,
} from '@/utils/voiceCoachClips';

export const VOICE_HOLD_FLOW_MODES = ['count', 'count_hold', 'hold'] as const;
export type VoiceHoldFlowMode = (typeof VOICE_HOLD_FLOW_MODES)[number];

export const DEFAULT_VOICE_HOLD_FLOW_MODE: VoiceHoldFlowMode = 'count';

export const VOICE_HOLD_DURATION_PRESETS = [3, 5, 10, 15, 20, 30, 45, 60] as const;
export type VoiceHoldDurationPreset = (typeof VOICE_HOLD_DURATION_PRESETS)[number];

export const VOICE_HOLD_DURATION = {
  defaultSec: 10,
  minSec: 1,
  maxSec: 180,
  /** Wall-clock tick between countdown numbers. */
  tickMs: 1000,
  afterCueMs: 350,
} as const;

export const VOICE_HOLD_CLIP_KEYS = {
  cue: 'hold',
  finishDone: 'finish-done',
  finishGreat: 'finish-great',
  finishNice: 'finish-nice',
} as const;

export type VoiceHoldSegmentPhase = 'holdCue' | 'holdCountdown' | 'holdFinish';

export interface VoiceHoldSegmentDetail {
  countdown?: number;
  finishPhrase?: string;
}

export interface RunVoiceHoldSegmentOptions {
  durationSec: number;
  locale?: string;
  /** Korean clip pack — must match count voice selection. */
  voicePack?: VoiceCoachPack;
  signal?: AbortSignal;
  onPhaseChange?: (
    phase: VoiceHoldSegmentPhase,
    detail?: VoiceHoldSegmentDetail
  ) => void;
}

export function isVoiceHoldFlowMode(value: unknown): value is VoiceHoldFlowMode {
  return typeof value === 'string' && (VOICE_HOLD_FLOW_MODES as readonly string[]).includes(value);
}

export function clampVoiceHoldFlowMode(value: unknown): VoiceHoldFlowMode {
  return isVoiceHoldFlowMode(value) ? value : DEFAULT_VOICE_HOLD_FLOW_MODE;
}

export function clampVoiceHoldDurationSec(sec: number): number {
  if (!Number.isFinite(sec)) return VOICE_HOLD_DURATION.defaultSec;
  return Math.min(
    VOICE_HOLD_DURATION.maxSec,
    Math.max(VOICE_HOLD_DURATION.minSec, Math.round(sec))
  );
}

export function isVoiceHoldDurationPreset(sec: number): sec is VoiceHoldDurationPreset {
  return (VOICE_HOLD_DURATION_PRESETS as readonly number[]).includes(sec);
}

function isKoreanLocale(locale?: string): boolean {
  return (locale ?? 'ko').toLowerCase().startsWith('ko');
}

/** Strong hold cue — male pack is always English "Hold!!!". */
export function holdCuePhrase(
  locale?: string,
  voicePack?: VoiceCoachPack
): string {
  if (normalizeVoiceCoachPack(voicePack) === 'male') return 'Hold!!!';
  return isKoreanLocale(locale) ? '버텨!!!' : 'Hold!!!';
}

const FINISH_KO = [
  { phrase: '완료!', clipKey: VOICE_HOLD_CLIP_KEYS.finishDone },
  { phrase: '좋습니다!', clipKey: VOICE_HOLD_CLIP_KEYS.finishGreat },
  { phrase: '수고하셨습니다!', clipKey: VOICE_HOLD_CLIP_KEYS.finishNice },
] as const;

const FINISH_EN = [
  { phrase: 'Done!', clipKey: VOICE_HOLD_CLIP_KEYS.finishDone },
  { phrase: 'Great!', clipKey: VOICE_HOLD_CLIP_KEYS.finishGreat },
  { phrase: 'Nice work!', clipKey: VOICE_HOLD_CLIP_KEYS.finishNice },
] as const;

export function pickHoldFinishPhrase(
  locale?: string,
  rand = Math.random,
  voicePack?: VoiceCoachPack
): string {
  return pickHoldFinish(locale, rand, voicePack).phrase;
}

export function pickHoldFinish(
  locale?: string,
  rand = Math.random,
  voicePack?: VoiceCoachPack
): { phrase: string; clipKey: string | null } {
  const useEnglish =
    normalizeVoiceCoachPack(voicePack) === 'male' || !isKoreanLocale(locale);
  const pool = useEnglish ? FINISH_EN : FINISH_KO;
  const idx = Math.min(pool.length - 1, Math.floor(rand() * pool.length));
  return pool[idx];
}

const EN_HOLD_ONES = [
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

const EN_HOLD_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty'] as const;

/** Spoken countdown word for hold timer. */
export function formatHoldCountdownWord(
  n: number,
  locale?: string,
  voicePack?: VoiceCoachPack
): string {
  const v = Math.max(0, Math.round(n));
  if (normalizeVoiceCoachPack(voicePack) === 'male' || !isKoreanLocale(locale)) {
    if (v < 20) return EN_HOLD_ONES[v] || String(v);
    if (v < 70) {
      const tens = Math.floor(v / 10);
      const ones = v % 10;
      return ones === 0
        ? EN_HOLD_TENS[tens]
        : `${EN_HOLD_TENS[tens]} ${EN_HOLD_ONES[ones]}`;
    }
    return String(v);
  }
  return String(v);
}

/** Prefer prep-style cd clips, then rep clips, for hold number ticks. */
export function holdCountdownClipKey(n: number): string | null {
  const rounded = Math.round(n);
  return countdownClipKey(rounded) ?? repClipKey(rounded);
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

async function speakHoldLine(
  text: string,
  signal?: AbortSignal,
  retries = 2
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.resume();
        } catch {
          // ignore
        }
      }
      await speechManager.speak(text, signal);
      return;
    } catch (error) {
      lastError = error;
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      await sleep(120 + attempt * 80, signal);
    }
  }
  if (lastError) throw lastError;
}

async function speakHoldCue(options: {
  clipKey: string | null;
  text: string;
  locale?: string;
  voicePack: VoiceCoachPack;
  signal?: AbortSignal;
  /** When set, used for Sino-Korean TTS fallback if the pack clip fails. */
  countValue?: number;
}): Promise<void> {
  const { clipKey, text, locale, voicePack, signal, countValue } = options;

  const maleEnglish = normalizeVoiceCoachPack(voicePack) === 'male';
  // Male pack = English clips; female Korean clips when locale is ko.
  const useClips = maleEnglish || isKoreanLocale(locale);
  if (useClips && clipKey) {
    const played = await playVoiceCoachClip(clipKey, signal, voicePack);
    if (played) return;
  }
  const fallback =
    typeof countValue === 'number'
      ? formatHoldCountdownWord(countValue, locale, voicePack)
      : text;
  if (maleEnglish) {
    await speechManager.speak(fallback, {
      signal,
      preferMaleVoice: true,
      rate: 0.92,
    });
    return;
  }
  await speakHoldLine(fallback, signal);
}

/**
 * Speak "버텨!!!" then count durationSec → 1 on ~1s ticks, then a random finish phrase.
 * Abort-safe; does not cancel speechManager except via signal → caller stopVoiceCoach.
 */
export async function runVoiceHoldSegment(
  options: RunVoiceHoldSegmentOptions
): Promise<void> {
  const durationSec = clampVoiceHoldDurationSec(options.durationSec);
  const locale = options.locale ?? 'ko';
  const voicePack = normalizeVoiceCoachPack(options.voicePack ?? DEFAULT_VOICE_COACH_PACK);
  const { signal, onPhaseChange } = options;

  await speechManager.init();
  // Do not speechSynthesis.cancel() here — that undoes the Start-gesture TTS unlock.
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.resume();
    } catch {
      // ignore
    }
  }

  onPhaseChange?.('holdCue');
  await speakHoldCue({
    clipKey: VOICE_HOLD_CLIP_KEYS.cue,
    text: holdCuePhrase(locale, voicePack),
    locale,
    voicePack,
    signal,
  });
  await sleep(VOICE_HOLD_DURATION.afterCueMs, signal);

  const tickMs = VOICE_HOLD_DURATION.tickMs;
  const segmentStart = performance.now();

  for (let i = 0; i < durationSec; i += 1) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    const n = durationSec - i;
    onPhaseChange?.('holdCountdown', { countdown: n });
    await speakHoldCue({
      clipKey: holdCountdownClipKey(n),
      text: formatHoldCountdownWord(n, locale, voicePack),
      locale,
      voicePack,
      signal,
      countValue: n,
    });

    const target = segmentStart + (i + 1) * tickMs;
    const waitMs = Math.max(0, Math.round(target - performance.now()));
    if (waitMs > 0) await sleep(waitMs, signal);
  }

  const finish = pickHoldFinish(locale, Math.random, voicePack);
  onPhaseChange?.('holdFinish', { finishPhrase: finish.phrase, countdown: 0 });
  await speakHoldCue({
    clipKey: finish.clipKey,
    text: finish.phrase,
    locale,
    voicePack,
    signal,
  });
}
