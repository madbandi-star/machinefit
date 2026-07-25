/**
 * iOS + male voice-pack count TTS helpers.
 *
 * On iOS, AVSpeechSynthesizer (via speechSynthesis) often mumbles Arabic digits
 * and short vowels in male voices for "5"/"2". For male pack only we skip clips
 * and speak Sino-Korean count words (오/사/삼/이/일 …) as one utterance each.
 * Female pack and Android keep the existing clip path unchanged.
 */

import type { VoiceCoachPack } from '@/utils/voiceCoachClips';
import { normalizeVoiceCoachPack } from '@/utils/voiceCoachClips';

/** Slightly slower than default 1.0 for clearer male AVSpeech syllables. */
export const IOS_MALE_COUNT_RATE = 0.88;

/** Short gap after each count utterance (50–150ms band). */
export const IOS_MALE_COUNT_PAUSE_MS = 100;

const SINO_ONES = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'] as const;

/** True for iPhone / iPod / iPad (including iPadOS desktop UA). */
export function isIOSWebKit(userAgent?: string, platform?: string, maxTouchPoints?: number): boolean {
  if (typeof navigator === 'undefined' && userAgent == null) return false;
  const ua = userAgent ?? navigator.userAgent;
  const plat = platform ?? (typeof navigator !== 'undefined' ? navigator.platform : '');
  const touches =
    maxTouchPoints ?? (typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0);
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ may report as MacIntel with touch.
  if (plat === 'MacIntel' && touches > 1) return true;
  return false;
}

function isKoreanLocale(locale?: string): boolean {
  return (locale ?? 'ko').toLowerCase().startsWith('ko');
}

/**
 * Sino-Korean readings used for clear male iOS count TTS.
 * 1→일 … 5→오 … 10→십 … 15→십오 (never Arabic digits).
 */
export function toSinoKoreanCount(n: number): string {
  const v = Math.round(n);
  if (!Number.isFinite(v) || v <= 0) return String(n);
  if (v < 10) return SINO_ONES[v];
  if (v === 10) return '십';
  if (v < 20) return `십${SINO_ONES[v - 10]}`;
  if (v < 100) {
    const tens = Math.floor(v / 10);
    const ones = v % 10;
    const tensWord = tens === 1 ? '십' : `${SINO_ONES[tens]}십`;
    return ones === 0 ? tensWord : `${tensWord}${SINO_ONES[ones]}`;
  }
  return String(v);
}

/** Prep countdown sample sequence used in QA. */
export const IOS_MALE_PREP_COUNT_WORDS = ['오', '사', '삼', '이', '일'] as const;

export function shouldUseIosMaleCountTts(
  voicePack: VoiceCoachPack | undefined,
  locale?: string,
  env?: { userAgent?: string; platform?: string; maxTouchPoints?: number }
): boolean {
  if (!isKoreanLocale(locale)) return false;
  if (normalizeVoiceCoachPack(voicePack) !== 'male') return false;
  return isIOSWebKit(env?.userAgent, env?.platform, env?.maxTouchPoints);
}
