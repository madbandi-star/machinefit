/**
 * Push rest-timer / voice-count status onto the OS lock-screen Now Playing UI
 * via Media Session metadata (title = primary glance value).
 *
 * Callers pass live values — this module does not import Zustand stores
 * (avoids circular deps with rest/count stores).
 */

import i18n from '@/i18n';
import type { VoiceCoachPhase } from '@/utils/voiceCoach';
import {
  acquireWorkoutMediaSession,
  releaseWorkoutMediaSession,
  setWorkoutLockScreenMetadata,
} from '@/utils/voiceCoachAudioSession';
import {
  getVoiceCoachDisplayState,
  voiceCoachStatusLabel,
} from '@/utils/voiceCoachDisplay';

const REST_OWNER = 'rest';
const COUNT_OWNER = 'count-ui';

function tMachines(key: string, opts?: Record<string, unknown>): string {
  return String(i18n.t(key, { ns: 'machines', ...(opts ?? {}) }));
}

export function formatRestLockClock(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function publishRestLockScreen(options: {
  setNumber: number;
  remainingSec: number;
  paused: boolean;
}): void {
  const title = formatRestLockClock(options.remainingSec);
  const label = tMachines('restTimer.label', { setNumber: options.setNumber });
  const artist = options.paused
    ? `${label} · ${tMachines('restTimer.paused')}`
    : label;

  setWorkoutLockScreenMetadata({
    title,
    artist,
    album: 'MachineFit',
  });
}

export function publishCountLockScreen(options: {
  phase: VoiceCoachPhase;
  currentRep: number;
  countdown: number | null;
  turbo: boolean;
  intensity: number;
  isPaused: boolean;
}): void {
  const oneMoreShort = tMachines('voiceCoach.oneMoreShort');
  const holdCueShort = tMachines('voiceCoach.holdCueShort');
  const display = getVoiceCoachDisplayState(
    options.phase,
    options.currentRep,
    options.countdown,
    options.turbo,
    options.intensity,
    oneMoreShort,
    holdCueShort
  );
  const status = voiceCoachStatusLabel(
    (key, opts) => String(i18n.t(key, opts)),
    options.phase,
    options.currentRep,
    options.countdown
  );
  const title = display.displayNumber || status || tMachines('voiceCoach.title');
  const baseArtist = status || tMachines('voiceCoach.title');
  const artist = options.isPaused
    ? `${baseArtist} · ${tMachines('voiceCoach.paused')}`
    : baseArtist;

  setWorkoutLockScreenMetadata({
    title,
    artist,
    album: 'MachineFit',
  });
}

export function clearWorkoutLockScreenMetadata(): void {
  setWorkoutLockScreenMetadata(null);
}

/** Keep Media Session alive for rest-only lock-screen display. */
export async function acquireRestLockScreenSession(): Promise<void> {
  await acquireWorkoutMediaSession(REST_OWNER);
}

export async function releaseRestLockScreenSession(): Promise<void> {
  await releaseWorkoutMediaSession(REST_OWNER);
}

export async function acquireCountLockScreenSession(): Promise<void> {
  await acquireWorkoutMediaSession(COUNT_OWNER);
}

export async function releaseCountLockScreenSession(): Promise<void> {
  await releaseWorkoutMediaSession(COUNT_OWNER);
}
