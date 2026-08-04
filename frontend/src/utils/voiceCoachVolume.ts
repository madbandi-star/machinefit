/** Runtime voice-coach output level (clips, beeps, TTS). Avoids store ↔ audio cycles. */

export const VOICE_COACH_VOLUME = {
  min: 0,
  max: 1,
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

/** Current coach output level 0–1 (read by clip / beep / TTS players). */
export function getVoiceCoachVolume(): number {
  return runtimeVolume;
}

/** Keep audio players in sync when settings change or rehydrate. */
export function setVoiceCoachVolumeRuntime(value: unknown): void {
  runtimeVolume = clampVoiceCoachVolume(value);
}
