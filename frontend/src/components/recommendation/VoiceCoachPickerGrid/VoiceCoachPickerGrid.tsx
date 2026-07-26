import { useTranslation } from 'react-i18next';
import { ScrollPicker } from '@/components/form/ScrollPicker/ScrollPicker';
import {
  clampVoiceCoachOneMoreCount,
  clampVoiceCoachRepGapMs,
  VOICE_COACH_ONE_MORE,
  VOICE_COACH_REP_GAP,
} from '@/utils/voiceCoach';
import {
  clampVoiceHoldDurationSec,
  VOICE_HOLD_DURATION,
  type VoiceHoldFlowMode,
} from '@/utils/voiceHold';

const MIN_REPS = 1;
const MAX_REPS = 30;
const DEFAULT_REPS = 12;

export type VoiceCoachPickerGridLabels = 'settings' | 'machines';

interface VoiceCoachPickerGridProps {
  flowMode: VoiceHoldFlowMode;
  oneMoreEnabled: boolean;
  targetReps: number;
  onTargetRepsChange: (reps: number) => void;
  repGapMs: number;
  onRepGapMsChange: (ms: number) => void;
  oneMoreCount: number;
  onOneMoreCountChange: (count: number) => void;
  holdDurationSec: number;
  onHoldDurationSecChange: (sec: number) => void;
  disabled?: boolean;
  /** records card layout: inline hold + conditional one-more column */
  recordsLayout?: boolean;
  labels?: VoiceCoachPickerGridLabels;
  compact?: boolean;
  className?: string;
}

function pickerGridColumnClass(columnCount: number): string {
  if (columnCount <= 1) return ' body-metrics-inline__grid--1';
  if (columnCount === 2) return ' body-metrics-inline__grid--2';
  if (columnCount === 3) return ' body-metrics-inline__grid--3';
  return ' body-metrics-inline__grid--4';
}

function usePickerLabels(source: VoiceCoachPickerGridLabels) {
  const { t } = useTranslation(source === 'settings' ? 'common' : 'machines');

  if (source === 'settings') {
    return {
      group: t('settings.voiceCoach'),
      targetReps: t('settings.voiceCoachTargetReps'),
      targetRepsUnit: t('settings.voiceCoachTargetRepsUnit'),
      countInterval: t('settings.voiceCoachCountInterval'),
      countIntervalUnit: t('settings.voiceCoachCountIntervalUnit'),
      oneMoreCount: t('settings.voiceCoachOneMoreCount'),
      oneMoreCountUnit: t('settings.voiceCoachOneMoreCountUnit'),
      holdDuration: t('settings.voiceHoldDuration'),
      holdDurationUnit: t('settings.voiceHoldDurationUnit'),
    };
  }

  return {
    group: t('voiceCoach.title'),
    targetReps: t('voiceCoach.targetReps'),
    targetRepsUnit: t('voiceCoach.targetRepsUnit'),
    countInterval: t('voiceCoach.countInterval'),
    countIntervalUnit: t('voiceCoach.countIntervalUnit'),
    oneMoreCount: t('voiceCoach.oneMoreCount'),
    oneMoreCountUnit: t('voiceCoach.oneMoreCountUnit'),
    holdDuration: t('voiceCoach.holdDuration'),
    holdDurationUnit: t('voiceCoach.holdDurationUnit'),
  };
}

export function VoiceCoachPickerGrid({
  flowMode,
  oneMoreEnabled,
  targetReps,
  onTargetRepsChange,
  repGapMs,
  onRepGapMsChange,
  oneMoreCount,
  onOneMoreCountChange,
  holdDurationSec,
  onHoldDurationSecChange,
  disabled = false,
  recordsLayout = false,
  labels = 'machines',
  compact = false,
  className = '',
}: VoiceCoachPickerGridProps) {
  const copy = usePickerLabels(labels);
  const gapSec = clampVoiceCoachRepGapMs(repGapMs) / 1000;
  const duration = clampVoiceHoldDurationSec(holdDurationSec);
  const showCountControls = flowMode !== 'hold';
  const showHoldDuration = flowMode === 'count_hold' || flowMode === 'hold';
  const inlineHoldInPickers = recordsLayout;
  const showHoldDurationInGrid = inlineHoldInPickers && showHoldDuration;
  const showOneMoreCountPicker = recordsLayout ? oneMoreEnabled : true;
  const showPickerGrid = showCountControls || showHoldDurationInGrid;

  const pickerColumnCount = showCountControls
    ? 2 + (showOneMoreCountPicker ? 1 : 0) + (showHoldDurationInGrid ? 1 : 0)
    : showHoldDurationInGrid
      ? 1
      : 0;

  if (!showPickerGrid) {
    return null;
  }

  return (
    <div
      className={`body-metrics-inline voice-coach-panel__pickers${
        disabled ? ' body-metrics-inline--disabled' : ''
      }${className ? ` ${className}` : ''}`}
      role="group"
      aria-label={copy.group}
    >
      <div className={`body-metrics-inline__grid${pickerGridColumnClass(pickerColumnCount)}`}>
        {showCountControls ? (
          <>
            <div className="body-metrics-inline__cell">
              <span className="body-metrics-inline__label">
                {copy.targetReps}
                <span className="body-metrics-inline__unit">{copy.targetRepsUnit}</span>
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
                ariaLabel={copy.targetReps}
                formatValue={(value) => String(value)}
              />
            </div>
            <div className="body-metrics-inline__cell">
              <span className="body-metrics-inline__label">
                {copy.countInterval}
                <span className="body-metrics-inline__unit">{copy.countIntervalUnit}</span>
              </span>
              <ScrollPicker
                value={gapSec}
                onChange={(sec) => onRepGapMsChange(clampVoiceCoachRepGapMs(sec * 1000))}
                min={VOICE_COACH_REP_GAP.minMs / 1000}
                max={VOICE_COACH_REP_GAP.maxMs / 1000}
                step={VOICE_COACH_REP_GAP.stepMs / 1000}
                size={compact ? 'compact' : 'default'}
                defaultValue={VOICE_COACH_REP_GAP.defaultMs / 1000}
                ariaLabel={copy.countInterval}
                formatValue={(value) => value.toFixed(1)}
              />
            </div>
            {showOneMoreCountPicker ? (
              <div className="body-metrics-inline__cell">
                <span className="body-metrics-inline__label">
                  {copy.oneMoreCount}
                  <span className="body-metrics-inline__unit">{copy.oneMoreCountUnit}</span>
                </span>
                <ScrollPicker
                  value={clampVoiceCoachOneMoreCount(oneMoreCount)}
                  onChange={onOneMoreCountChange}
                  min={VOICE_COACH_ONE_MORE.minCount}
                  max={VOICE_COACH_ONE_MORE.maxCount}
                  step={VOICE_COACH_ONE_MORE.step}
                  size={compact ? 'compact' : 'default'}
                  defaultValue={VOICE_COACH_ONE_MORE.defaultCount}
                  ariaLabel={copy.oneMoreCount}
                  formatValue={(value) => String(value)}
                />
              </div>
            ) : null}
          </>
        ) : null}
        {showHoldDurationInGrid ? (
          <div className="body-metrics-inline__cell">
            <span className="body-metrics-inline__label">
              {copy.holdDuration}
              <span className="body-metrics-inline__unit">{copy.holdDurationUnit}</span>
            </span>
            <ScrollPicker
              value={duration}
              onChange={(sec) => onHoldDurationSecChange(clampVoiceHoldDurationSec(sec))}
              min={VOICE_HOLD_DURATION.minSec}
              max={VOICE_HOLD_DURATION.maxSec}
              step={1}
              size={compact ? 'compact' : 'default'}
              defaultValue={VOICE_HOLD_DURATION.defaultSec}
              ariaLabel={copy.holdDuration}
              formatValue={(value) => String(value)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
