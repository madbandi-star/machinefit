import { useTranslation } from 'react-i18next';
import { ScrollPicker } from '@/components/form/ScrollPicker/ScrollPicker';
import {
  clampVoiceCoachRepGapMs,
  VOICE_COACH_REP_GAP,
  type VoiceCoachPhase,
} from '@/utils/voiceCoach';
import '@/styles/components.css';
import '@/styles/recommendation.css';

const MIN_REPS = 1;
const MAX_REPS = 30;
const DEFAULT_REPS = 12;

interface VoiceCoachPanelProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  targetReps: number;
  onTargetRepsChange: (reps: number) => void;
  repGapMs: number;
  onRepGapMsChange: (ms: number) => void;
  oneMoreEnabled: boolean;
  onOneMoreChange: (enabled: boolean) => void;
  autoStartAfterRest: boolean;
  onAutoStartAfterRestChange: (enabled: boolean) => void;
  restTipsEnabled: boolean;
  onRestTipsEnabledChange: (enabled: boolean) => void;
  phase: VoiceCoachPhase;
  currentRep: number;
  countdown: number | null;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  idPrefix?: string;
  compact?: boolean;
}

function statusLabel(
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
    default:
      return t('machines:voiceCoach.statusIdle');
  }
}

export function VoiceCoachPanel({
  enabled,
  onEnabledChange,
  targetReps,
  onTargetRepsChange,
  repGapMs,
  onRepGapMsChange,
  oneMoreEnabled,
  onOneMoreChange,
  autoStartAfterRest,
  onAutoStartAfterRestChange,
  restTipsEnabled,
  onRestTipsEnabledChange,
  phase,
  currentRep,
  countdown,
  isRunning,
  onStart,
  onStop,
  compact = false,
}: VoiceCoachPanelProps) {
  const { t } = useTranslation(['machines', 'common']);
  const gapSec = clampVoiceCoachRepGapMs(repGapMs) / 1000;

  return (
    <section
      className={`voice-coach-panel${compact ? ' voice-coach-panel--compact' : ''}${
        isRunning ? ' voice-coach-panel--running' : ''
      }`}
      aria-label={t('machines:voiceCoach.title')}
    >
      <div className="voice-coach-panel__header">
        <div className="voice-coach-panel__heading">
          <span className="voice-coach-panel__title">{t('machines:voiceCoach.title')}</span>
          <p className="voice-coach-panel__desc">{t('machines:voiceCoach.desc')}</p>
        </div>
        <label className="voice-coach-panel__switch">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            disabled={isRunning}
            aria-label={t('machines:voiceCoach.enable')}
          />
          <span>{enabled ? t('machines:voiceCoach.on') : t('machines:voiceCoach.off')}</span>
        </label>
      </div>

      {enabled ? (
        <>
          <div className="voice-coach-panel__controls">
            <div
              className={`body-metrics-inline voice-coach-panel__pickers${
                isRunning ? ' body-metrics-inline--disabled' : ''
              }`}
              role="group"
              aria-label={t('machines:voiceCoach.title')}
            >
              <div className="body-metrics-inline__grid body-metrics-inline__grid--2">
                <div className="body-metrics-inline__cell">
                  <span className="body-metrics-inline__label">
                    {t('machines:voiceCoach.targetReps')}
                    <span className="body-metrics-inline__unit">
                      {t('machines:voiceCoach.targetRepsUnit')}
                    </span>
                  </span>
                  <ScrollPicker
                    value={targetReps}
                    onChange={(next) =>
                      onTargetRepsChange(Math.max(MIN_REPS, Math.min(MAX_REPS, next)))
                    }
                    min={MIN_REPS}
                    max={MAX_REPS}
                    step={1}
                    size={compact ? 'compact' : 'default'}
                    defaultValue={DEFAULT_REPS}
                    ariaLabel={t('machines:voiceCoach.targetReps')}
                    formatValue={(value) => String(value)}
                  />
                </div>
                <div className="body-metrics-inline__cell">
                  <span className="body-metrics-inline__label">
                    {t('machines:voiceCoach.countInterval')}
                    <span className="body-metrics-inline__unit">
                      {t('machines:voiceCoach.countIntervalUnit')}
                    </span>
                  </span>
                  <ScrollPicker
                    value={gapSec}
                    onChange={(sec) => onRepGapMsChange(clampVoiceCoachRepGapMs(sec * 1000))}
                    min={VOICE_COACH_REP_GAP.minMs / 1000}
                    max={VOICE_COACH_REP_GAP.maxMs / 1000}
                    step={VOICE_COACH_REP_GAP.stepMs / 1000}
                    size={compact ? 'compact' : 'default'}
                    defaultValue={VOICE_COACH_REP_GAP.defaultMs / 1000}
                    ariaLabel={t('machines:voiceCoach.countInterval')}
                    formatValue={(value) => value.toFixed(1)}
                  />
                </div>
              </div>
            </div>

            <label className="voice-coach-panel__check">
              <input
                type="checkbox"
                checked={oneMoreEnabled}
                onChange={(e) => onOneMoreChange(e.target.checked)}
                disabled={isRunning}
              />
              <span>{t('machines:voiceCoach.oneMore')}</span>
            </label>

            <label className="voice-coach-panel__check">
              <input
                type="checkbox"
                checked={autoStartAfterRest}
                onChange={(e) => onAutoStartAfterRestChange(e.target.checked)}
                disabled={isRunning}
              />
              <span>{t('machines:voiceCoach.autoAfterRest')}</span>
            </label>

            <label className="voice-coach-panel__check">
              <input
                type="checkbox"
                checked={restTipsEnabled}
                onChange={(e) => onRestTipsEnabledChange(e.target.checked)}
                disabled={isRunning}
              />
              <span>{t('machines:voiceCoach.restTips')}</span>
            </label>
          </div>

          <div className="voice-coach-panel__actions">
            {isRunning ? (
              <button type="button" className="btn btn--secondary btn--block" onClick={onStop}>
                {t('machines:voiceCoach.stop')}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => {
                  onStart();
                }}
              >
                {t('machines:voiceCoach.start')}
              </button>
            )}
          </div>

          <p className="voice-coach-panel__status" role="status" aria-live="polite">
            {statusLabel(t, phase, currentRep, countdown)}
          </p>
        </>
      ) : null}
    </section>
  );
}
