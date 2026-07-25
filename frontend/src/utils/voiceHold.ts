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

/** Strong hold cue — same TTS voice/prosody as the rest of the coach. */
export function holdCuePhrase(locale?: string): string {
  return isKoreanLocale(locale) ? '버텨!!!' : 'Hold!!!';
}

const FINISH_KO = [
  { phrase: '완료!', clipKey: VOICE_HOLD_CLIP_KEYS.finishDone },
  { phrase: '좋습니다!', clipKey: VOICE_HOLD_CLIP_KEYS.finishGreat },
  { phrase: '수고하셨습니다!', clipKey: VOICE_HOLD_CLIP_KEYS.finishNice },
] as const;

const FINISH_EN = [
  { phrase: 'Done!', clipKey: null },
  { phrase: 'Great!', clipKey: null },
  { phrase: 'Nice work!', clipKey: null },
] as const;

export function pickHoldFinishPhrase(locale?: string, rand = Math.random): string {
  return pickHoldFinish(locale, rand).phrase;
}

export function pickHoldFinish(
  locale?: string,
  rand = Math.random
): { phrase: string; clipKey: string | null } {
  const pool = isKoreanLocale(locale) ? FINISH_KO : FINISH_EN;
  const idx = Math.min(pool.length - 1, Math.floor(rand() * pool.length));
  return pool[idx];
}

/** Spoken countdown word for hold timer (digits read naturally by TTS). */
export function formatHoldCountdownWord(n: number, locale?: string): string {
  void locale;
  return String(Math.max(0, Math.round(n)));
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
}): Promise<void> {
  const { clipKey, text, locale, voicePack, signal } = options;
  if (isKoreanLocale(locale) && clipKey) {
    const played = await playVoiceCoachClip(clipKey, signal, voicePack);
    if (played) return;
  }
  await speakHoldLine(text, signal);
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
    text: holdCuePhrase(locale),
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
      text: formatHoldCountdownWord(n, locale),
      locale,
      voicePack,
      signal,
    });

    const target = segmentStart + (i + 1) * tickMs;
    const waitMs = Math.max(0, Math.round(target - performance.now()));
    if (waitMs > 0) await sleep(waitMs, signal);
  }

  const finish = pickHoldFinish(locale);
  onPhaseChange?.('holdFinish', { finishPhrase: finish.phrase, countdown: 0 });
  await speakHoldCue({
    clipKey: finish.clipKey,
    text: finish.phrase,
    locale,
    voicePack,
    signal,
  });
}
