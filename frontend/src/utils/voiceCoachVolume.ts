/** Runtime voice-coach output level (clips, beeps, TTS). Avoids store ↔ audio cycles. */

export const VOICE_COACH_VOLUME = {
  min: 0,
  /** 200% — Web Audio GainNode can boost above 1; HTML/TTS APIs cap at 1. */
  max: 2,
  /** Default 100%. */
  default: 1,
  /** UI / storage step (5%). */
  step: 0.05,
} as const;

export function clampVoiceCoachVolume(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return VOICE_COACH_VOLUME.default;
  return Math.min(VOICE_COACH_VOLUME.max, Math.max(VOICE_COACH_VOLUME.min, n));
}

let runtimeVolume: number = VOICE_COACH_VOLUME.default;

/** Current coach output level 0–2 (read by Web Audio gain / beep). */
export function getVoiceCoachVolume(): number {
  return runtimeVolume;
}

/**
 * Level for HTMLAudioElement / SpeechSynthesis (browser APIs only accept 0–1).
 * Values above 100% are capped here; clip playback uses GainNode for boost.
 */
export function getVoiceCoachElementVolume(): number {
  return Math.min(1, runtimeVolume);
}

/** Keep audio players in sync when settings change or rehydrate. */
export function setVoiceCoachVolumeRuntime(value: unknown): void {
  runtimeVolume = clampVoiceCoachVolume(value);
}
