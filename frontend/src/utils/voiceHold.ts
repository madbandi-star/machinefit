/**
 * Reusable "버텨!!!" (isometric hold) voice segment.
 * Designed for standalone use, post-count chaining, and future
 * supersets / dropsets / intervals without touching count pacing.
 *
 * Hold cue/finish follow voice pack (female Korean / male English).
 * Hold **second** ticks are always male Korean TTS (Sino-Korean 십구…일).
 */

import { IOS_MALE_COUNT_RATE, toSinoKoreanCount } from '@/utils/iosMaleCountSpeech';
import { speechManager } from '@/utils/speechManager';
import {
  isMaleEnglishPack,
  resolveVoiceCoachSpeechLocale,
  voiceCoachCue,
  voiceCoachSpeechLangTag,
} from '@/utils/voiceCoachLanguage';
import {
  DEFAULT_VOICE_COACH_PACK,
  normalizeVoiceCoachPack,
  playVoiceCoachClip,
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
  /** Voice pack — female Korean / male English (must match count selection). */
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

/** Strong hold cue — language follows voice pack (female KO / male EN). */
export function holdCuePhrase(
  _locale?: string,
  voicePack?: VoiceCoachPack
): string {
  return voiceCoachCue('hold', voicePack);
}

const FINISH_KO = [
  { phraseKey: 'finishDone' as const, clipKey: VOICE_HOLD_CLIP_KEYS.finishDone },
  { phraseKey: 'finishGreat' as const, clipKey: VOICE_HOLD_CLIP_KEYS.finishGreat },
  { phraseKey: 'finishNice' as const, clipKey: VOICE_HOLD_CLIP_KEYS.finishNice },
] as const;

const FINISH_EN = FINISH_KO;

export function pickHoldFinishPhrase(
  locale?: string,
  rand = Math.random,
  voicePack?: VoiceCoachPack
): string {
  return pickHoldFinish(locale, rand, voicePack).phrase;
}

export function pickHoldFinish(
  _locale?: string,
  rand = Math.random,
  voicePack?: VoiceCoachPack
): { phrase: string; clipKey: string | null } {
  const pool =
    resolveVoiceCoachSpeechLocale(voicePack) === 'en' ? FINISH_EN : FINISH_KO;
  const idx = Math.min(pool.length - 1, Math.floor(rand() * pool.length));
  const item = pool[idx];
  return {
    phrase: voiceCoachCue(item.phraseKey, voicePack),
    clipKey: item.clipKey,
  };
}

/**
 * Hold second ticks — always Sino-Korean (십구…일), any voice pack.
 */
export function formatHoldCountdownWord(
  n: number,
  _locale?: string,
  _voicePack?: VoiceCoachPack
): string {
  return toSinoKoreanCount(Math.max(0, Math.round(n)));
}

/** Hold seconds always use male Korean TTS — no pack clips. */
export function holdCountdownClipKey(_n: number, _voicePack?: VoiceCoachPack): string | null {
  return null;
}

async function speakHoldCountdownTick(n: number, signal?: AbortSignal): Promise<void> {
  await speechManager.speak(formatHoldCountdownWord(n), {
    signal,
    lang: 'ko-KR',
    preferMaleVoice: true,
    rate: IOS_MALE_COUNT_RATE,
  });
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

async function speakHoldCue(options: {
  clipKey: string | null;
  text: string;
  locale?: string;
  voicePack: VoiceCoachPack;
  signal?: AbortSignal;
  /** When set, routes to male-Korean hold-second TTS (deprecated path — use speakHoldCountdownTick). */
  countValue?: number;
}): Promise<void> {
  const { clipKey, text, locale, voicePack, signal, countValue } = options;

  if (typeof countValue === 'number') {
    await speakHoldCountdownTick(countValue, signal);
    return;
  }

  const maleEnglish = isMaleEnglishPack(voicePack);
  const speechLocale = resolveVoiceCoachSpeechLocale(voicePack);
  // Clips always match pack language (female KO / male EN).
  if (clipKey) {
    const played = await playVoiceCoachClip(clipKey, signal, voicePack);
    if (played) return;
  }
  await speechManager.speak(text, {
    signal,
    lang: voiceCoachSpeechLangTag(speechLocale),
    preferMaleVoice: maleEnglish ? true : undefined,
    preferFemaleVoice: !maleEnglish ? true : undefined,
    rate: maleEnglish ? 0.92 : undefined,
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
      clipKey: null,
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
