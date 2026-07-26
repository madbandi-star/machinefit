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
