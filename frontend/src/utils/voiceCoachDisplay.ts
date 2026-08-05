import { formatCountDisplay } from '@/utils/aiCountPace';
import type { VoiceCoachPhase } from '@/utils/voiceCoach';

export interface VoiceCoachDisplayState {
  displayNumber: string;
  scale: number;
  showLiveDisplay: boolean;
  turboStage: boolean;
  climaxStage: boolean;
}

export function getVoiceCoachDisplayState(
  phase: VoiceCoachPhase,
  currentRep: number,
  countdown: number | null,
  turbo: boolean,
  intensity: number,
  oneMoreShortLabel: string,
  holdCueShortLabel: string
): VoiceCoachDisplayState {
  const showCountStage = phase === 'counting' && currentRep > 0;
  const showOneMoreStage = phase === 'oneMore' && currentRep > 0;
  const showHoldStage = phase === 'hold' && (countdown != null || intensity > 0);
  const showCountdownStage = phase === 'countdown' && countdown != null;
  const showRepStage = showCountStage || showOneMoreStage;
  const scale = showRepStage
    ? 1 + intensity * (turbo ? 0.42 : 0.22) + (turbo && intensity > 0.92 ? 0.18 : 0)
    : showHoldStage
      ? 1.08 + intensity * 0.12
      : showCountdownStage
        ? 1.05
        : 1;

  const displayNumber = showCountStage
    ? formatCountDisplay(currentRep, turbo)
    : showOneMoreStage
      ? turbo
        ? `${oneMoreShortLabel}!`
        : oneMoreShortLabel
      : showHoldStage
        ? countdown != null && countdown > 0
          ? String(countdown)
          : countdown === 0
            ? '!'
            : holdCueShortLabel
        : showCountdownStage
          ? String(countdown)
          : phase === 'start'
            ? '!'
            : '';

  return {
    displayNumber,
    scale,
    showLiveDisplay: Boolean(displayNumber),
    turboStage: turbo || phase === 'hold',
    climaxStage: (showCountStage && intensity > 0.85) || phase === 'hold',
  };
}

/** Phase-based emoji for fullscreen motivational cues. */
export function getVoiceCoachCueIcon(
  phase: VoiceCoachPhase,
  displayNumber: string,
  turbo: boolean,
  climaxStage: boolean
): string {
  if (phase === 'oneMore') return '🔥';
  if (phase === 'start') return '🚀';
  if (phase === 'countdown' || phase === 'beep') return '🔥';
  if (phase === 'hold') {
    if (displayNumber === '!') return '✅';
    return '⏱️';
  }
  if (phase === 'counting') {
    if (turbo || climaxStage) return '⚡';
    return '💪';
  }
  if (displayNumber === '!') return '🚀';
  return '💪';
}

function normalizeCueText(value: string): string {
  return value
    .trim()
    .replace(/!+$/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function extractLeadingDigits(value: string): string | null {
  const match = value.trim().match(/^(\d+)/);
  return match?.[1] ?? null;
}

/**
 * True when status repeats the main cue (exact or digit-only variants like "5회" / "Rep 5").
 * Turbo/hold badges alone are not a reason to keep the status line.
 */
export function isRedundantVoiceCoachStatus(
  mainCue: string,
  status: string,
  _phase?: VoiceCoachPhase
): boolean {
  const main = mainCue.trim();
  const statusTrim = status.trim();
  if (!main || !statusTrim) return false;

  const mainNorm = normalizeCueText(main);
  const statusNorm = normalizeCueText(statusTrim);
  if (mainNorm && statusNorm && mainNorm === statusNorm) return true;

  const mainDigits = extractLeadingDigits(main.replace(/!+$/g, ''));
  if (mainDigits) {
    // "5", "5!", status "5"
    if (statusNorm === mainDigits) return true;
    // KO: "5회"
    if (statusNorm === `${mainDigits}회`) return true;
    // EN: "Rep 5"
    if (statusNorm === `rep ${mainDigits}`) return true;
  }

  // oneMore / hold: status starts with the cue ("하나더! (5)", "Hold 3" when main is hold digits handled above)
  if (mainNorm && statusNorm.startsWith(mainNorm)) return true;

  // Hold countdown status "버텨 3" / "Hold 3" when main is "3"
  if (mainDigits) {
    if (new RegExp(`^(버텨|hold)\\s*${mainDigits}$`, 'i').test(statusNorm)) return true;
  }

  return false;
}

export function voiceCoachStatusLabel(
  t: (key: string, opts?: Record<string, unknown>) => string,
  phase: VoiceCoachPhase,
  currentRep: number,
  countdown: number | null
): string {
  switch (phase) {
    case 'beep':
      return t('machines:voiceCoach.statusBeep');
    case 'countdown':
      if (countdown == null) return t('machines:voiceCoach.statusReady');
      return t('machines:voiceCoach.statusCountdown', { count: countdown });
    case 'start':
      return t('machines:voiceCoach.statusStart');
    case 'counting':
      return t('machines:voiceCoach.statusCounting', { rep: currentRep });
    case 'oneMore':
      return t('machines:voiceCoach.statusOneMore', { rep: currentRep });
    case 'hold':
      if (countdown == null) return t('machines:voiceCoach.statusHoldCue');
      if (countdown <= 0) return t('machines:voiceCoach.statusHoldFinish');
      return t('machines:voiceCoach.statusHoldCountdown', { count: countdown });
    default:
      return t('machines:voiceCoach.statusIdle');
  }
}
