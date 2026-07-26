/**
 * Voice-pack language policy:
 * - female → Korean (ko) for every coach cue / TTS fallback
 * - male   → English (en) for every coach cue / TTS fallback
 *
 * UI locale (settings language) does not override this for voice coach audio.
 */

import {
  DEFAULT_VOICE_COACH_PACK,
  normalizeVoiceCoachPack,
  type VoiceCoachPack,
} from '@/utils/voiceCoachClips';

export type VoiceCoachSpeechLocale = 'ko' | 'en';

export function resolveVoiceCoachSpeechLocale(
  voicePack?: VoiceCoachPack | unknown
): VoiceCoachSpeechLocale {
  return normalizeVoiceCoachPack(voicePack) === 'male' ? 'en' : 'ko';
}

export function voiceCoachSpeechLangTag(speechLocale: VoiceCoachSpeechLocale): string {
  return speechLocale === 'en' ? 'en-US' : 'ko-KR';
}

export function isMaleEnglishPack(voicePack?: VoiceCoachPack | unknown): boolean {
  return normalizeVoiceCoachPack(voicePack ?? DEFAULT_VOICE_COACH_PACK) === 'male';
}

/** Fixed system cues (not machine tip body text from the API). */
export const VOICE_COACH_CUES = {
  ko: {
    ready: '준비',
    start: '시작합니다.',
    oneMore: '하나더!',
    hold: '버텨!!!',
    restStart: '휴식 시작',
    cautions: '주의사항.',
    workoutTips: '운동 팁.',
    workoutComplete: '운동 종료',
    finishDone: '운동 종료',
    finishGreat: '완료!',
    finishNice: '수고하셨습니다!',
  },
  en: {
    ready: 'Ready',
    start: 'Start',
    oneMore: 'One more!',
    hold: 'Hold!',
    restStart: 'Rest',
    cautions: 'Cautions.',
    workoutTips: 'Workout tips.',
    workoutComplete: 'Workout Complete',
    finishDone: 'Workout Complete',
    finishGreat: 'Done!',
    finishNice: 'Nice work!',
  },
} as const;

export function voiceCoachCue(
  key: keyof (typeof VOICE_COACH_CUES)['ko'],
  voicePack?: VoiceCoachPack | unknown
): string {
  const loc = resolveVoiceCoachSpeechLocale(voicePack);
  return VOICE_COACH_CUES[loc][key];
}
