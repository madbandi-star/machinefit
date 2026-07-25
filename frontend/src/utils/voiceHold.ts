/**
 * Reusable "버텨!!!" (isometric hold) voice segment.
 * Designed for standalone use, post-count chaining, and future
 * supersets / dropsets / intervals without touching count pacing.
 */

import { speechManager } from '@/utils/speechManager';

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

export type VoiceHoldSegmentPhase = 'holdCue' | 'holdCountdown' | 'holdFinish';

export interface VoiceHoldSegmentDetail {
  countdown?: number;
  finishPhrase?: string;
}

export interface RunVoiceHoldSegmentOptions {
  durationSec: number;
  locale?: string;
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

const FINISH_PHRASES_KO = ['완료!', '좋습니다!', '수고하셨습니다!'] as const;
const FINISH_PHRASES_EN = ['Done!', 'Great!', 'Nice work!'] as const;

export function pickHoldFinishPhrase(locale?: string, rand = Math.random): string {
  const pool = isKoreanLocale(locale) ? FINISH_PHRASES_KO : FINISH_PHRASES_EN;
  const idx = Math.min(pool.length - 1, Math.floor(rand() * pool.length));
  return pool[idx];
}

/** Spoken countdown word for hold timer (digits read naturally by TTS). */
export function formatHoldCountdownWord(n: number, locale?: string): string {
  void locale;
  return String(Math.max(0, Math.round(n)));
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

/**
 * Speak "버텨!!!" then count durationSec → 1 on ~1s ticks, then a random finish phrase.
 * Abort-safe; does not cancel speechManager except via signal → caller stopVoiceCoach.
 */
export async function runVoiceHoldSegment(
  options: RunVoiceHoldSegmentOptions
): Promise<void> {
  const durationSec = clampVoiceHoldDurationSec(options.durationSec);
  const locale = options.locale ?? 'ko';
  const { signal, onPhaseChange } = options;

  await speechManager.init();

  onPhaseChange?.('holdCue');
  await speechManager.speak(holdCuePhrase(locale), signal);
  await sleep(VOICE_HOLD_DURATION.afterCueMs, signal);

  const tickMs = VOICE_HOLD_DURATION.tickMs;
  const segmentStart = performance.now();

  for (let i = 0; i < durationSec; i += 1) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    const n = durationSec - i;
    onPhaseChange?.('holdCountdown', { countdown: n });
    // speak() cancels prior queue — one number at a time keeps ticks clean
    await speechManager.speak(formatHoldCountdownWord(n, locale), signal);

    const target = segmentStart + (i + 1) * tickMs;
    const waitMs = Math.max(0, Math.round(target - performance.now()));
    if (waitMs > 0) await sleep(waitMs, signal);
  }

  const finishPhrase = pickHoldFinishPhrase(locale);
  onPhaseChange?.('holdFinish', { finishPhrase, countdown: 0 });
  await speechManager.speak(finishPhrase, signal);
}
