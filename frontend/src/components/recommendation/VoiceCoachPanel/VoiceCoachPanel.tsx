import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VoiceCoachPickerGrid } from '@/components/recommendation/VoiceCoachPickerGrid/VoiceCoachPickerGrid';
import {
  VOICE_COUNT_MODES,
  type VoiceCountMode,
} from '@/utils/aiCountPace';
import {
  clampVoiceCoachPrepCount,
  normalizeVoiceCoachPack,
  VOICE_COACH_PACKS,
  VOICE_COACH_PREP_COUNTS,
  type VoiceCoachPack,
  type VoiceCoachPhase,
  type VoiceCoachPrepCount,
} from '@/utils/voiceCoach';
import {
  clampVoiceHoldDurationSec,
  isVoiceHoldDurationPreset,
  VOICE_HOLD_DURATION,
  VOICE_HOLD_DURATION_PRESETS,
  VOICE_HOLD_FLOW_MODES,
  type VoiceHoldFlowMode,
} from '@/utils/voiceHold';
import {
  getVoiceCoachDisplayState,
  voiceCoachStatusLabel,
} from '@/utils/voiceCoachDisplay';
import '@/styles/components.css';
import '@/styles/recommendation.css';

interface VoiceCoachPanelProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  targetReps: number;
  onTargetRepsChange: (reps: number) => void;
  repGapMs: number;
  onRepGapMsChange: (ms: number) => void;
  prepCount: VoiceCoachPrepCount;
  onPrepCountChange: (count: VoiceCoachPrepCount) => void;
  voicePack: VoiceCoachPack;
  onVoicePackChange: (pack: VoiceCoachPack) => void;
  countMode: VoiceCountMode;
  onCountModeChange: (mode: VoiceCountMode) => void;
  flowMode: VoiceHoldFlowMode;
  onFlowModeChange: (mode: VoiceHoldFlowMode) => void;
  holdDurationSec: number;
  onHoldDurationSecChange: (sec: number) => void;
  oneMoreEnabled: boolean;
  onOneMoreChange: (enabled: boolean) => void;
  oneMoreCount: number;
  onOneMoreCountChange: (count: number) => void;
  autoStartAfterRest: boolean;
  onAutoStartAfterRestChange: (enabled: boolean) => void;
  restTipsEnabled: boolean;
  onRestTipsEnabledChange: (enabled: boolean) => void;
  phase: VoiceCoachPhase;
  currentRep: number;
  countdown: number | null;
  turbo: boolean;
  intensity: number;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  idPrefix?: string;
  compact?: boolean;
  /** When false, hide female/male pack radios (e.g. records page — use My Page settings). */
  showVoicePackSelector?: boolean;
  /** When false, hide auto-after-rest and rest-tips checkboxes (e.g. records page). */
  showRestOptionSelectors?: boolean;
  /** When false, hide one-more / hold-after-count toggles and one-more count (e.g. records page). */
  showOneMoreAndHoldSelectors?: boolean;
  /** When false, hide prep count, session mode, and count mode (e.g. records page). */
  showSessionConfigSelectors?: boolean;
  /** When false, hide live count number (e.g. fullscreen overlay is showing it). */
  hideLiveDisplay?: boolean;
  /** When true, picker scroll is disabled (display-only). */
  pickersReadOnly?: boolean;
  /** Notify parent when 「세부 피커 고정」 toggles (blocks external value sync). */
  onPickersPinnedChange?: (pinned: boolean) => void;
}

export function VoiceCoachPanel({
  enabled,
  onEnabledChange,
  targetReps,
  onTargetRepsChange,
  repGapMs,
  onRepGapMsChange,
  prepCount,
  onPrepCountChange,
  voicePack,
  onVoicePackChange,
  countMode,
  onCountModeChange,
  flowMode,
  onFlowModeChange,
  holdDurationSec,
  onHoldDurationSecChange,
  oneMoreEnabled,
  onOneMoreChange,
  oneMoreCount,
  onOneMoreCountChange,
  autoStartAfterRest,
  onAutoStartAfterRestChange,
  restTipsEnabled,
  onRestTipsEnabledChange,
  phase,
  currentRep,
  countdown,
  turbo,
  intensity,
  isRunning,
  onStart,
  onStop,
  compact = false,
  showVoicePackSelector = true,
  showRestOptionSelectors = true,
  showOneMoreAndHoldSelectors = true,
  showSessionConfigSelectors = true,
  hideLiveDisplay = false,
  pickersReadOnly = false,
  onPickersPinnedChange,
}: VoiceCoachPanelProps) {
  const { t } = useTranslation(['machines', 'common']);
  const duration = clampVoiceHoldDurationSec(holdDurationSec);
  const showCountControls = flowMode !== 'hold';
  const showHoldDuration = flowMode === 'count_hold' || flowMode === 'hold';
  const holdAfterCount = flowMode === 'count_hold';
  const inlineHoldInPickers = !showOneMoreAndHoldSelectors;
  const showHoldDurationSeparate = showHoldDuration && !inlineHoldInPickers;

  const [durationCustom, setDurationCustom] = useState(!isVoiceHoldDurationPreset(duration));
  const [customDraft, setCustomDraft] = useState(String(duration));
  const [pickersPinned, setPickersPinned] = useState(false);
  const pickersLocked = pickersPinned || pickersReadOnly;

  const setPickersPinnedAndNotify = (next: boolean) => {
    setPickersPinned(next);
    onPickersPinnedChange?.(next);
  };

  useEffect(() => {
    if (!durationCustom) {
      setCustomDraft(String(duration));
    }
  }, [duration, durationCustom]);

  const display = getVoiceCoachDisplayState(
    phase,
    currentRep,
    countdown,
    turbo,
    intensity,
    t('machines:voiceCoach.oneMoreShort', { defaultValue: '하나더' }),
    t('machines:voiceCoach.holdCueShort')
  );

  return (
    <section
      className={`voice-coach-panel${compact ? ' voice-coach-panel--compact' : ''}${
        isRunning ? ' voice-coach-panel--running' : ''
      }${turbo || phase === 'hold' ? ' voice-coach-panel--turbo' : ''}`}
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
            {showVoicePackSelector ? (
              <fieldset
                className={`voice-coach-panel__mode${isRunning ? ' voice-coach-panel__mode--disabled' : ''}`}
                disabled={isRunning}
              >
                <legend className="voice-coach-panel__mode-legend">
                  {t('machines:voiceCoach.voicePack')}
                </legend>
                <div className="voice-coach-panel__mode-options" role="radiogroup">
                  {VOICE_COACH_PACKS.map((pack) => (
                    <label key={pack} className="voice-coach-panel__mode-option">
                      <input
                        type="radio"
                        name="voice-coach-pack"
                        value={pack}
                        checked={normalizeVoiceCoachPack(voicePack) === pack}
                        onChange={() => onVoicePackChange(pack)}
                      />
                      <span>{t(`machines:voiceCoach.voicePack_${pack}`)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {showSessionConfigSelectors ? (
              <fieldset
                className={`voice-coach-panel__mode${isRunning ? ' voice-coach-panel__mode--disabled' : ''}`}
                disabled={isRunning}
              >
                <legend className="voice-coach-panel__mode-legend">
                  {t('machines:voiceCoach.prepCount')}
                </legend>
                <div className="voice-coach-panel__mode-options" role="radiogroup">
                  {VOICE_COACH_PREP_COUNTS.map((count) => (
                    <label key={count} className="voice-coach-panel__mode-option">
                      <input
                        type="radio"
                        name="voice-prep-count"
                        value={count}
                        checked={clampVoiceCoachPrepCount(prepCount) === count}
                        onChange={() => onPrepCountChange(count)}
                      />
                      <span>{t(`machines:voiceCoach.prepCount_${count}`)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {showSessionConfigSelectors ? (
              <fieldset
                className={`voice-coach-panel__mode${isRunning ? ' voice-coach-panel__mode--disabled' : ''}`}
                disabled={isRunning}
              >
                <legend className="voice-coach-panel__mode-legend">
                  {t('machines:voiceCoach.flowMode')}
                </legend>
                <div className="voice-coach-panel__mode-options" role="radiogroup">
                  {VOICE_HOLD_FLOW_MODES.map((mode) => (
                    <label key={mode} className="voice-coach-panel__mode-option">
                      <input
                        type="radio"
                        name="voice-flow-mode"
                        value={mode}
                        checked={flowMode === mode}
                        onChange={() => onFlowModeChange(mode)}
                      />
                      <span>{t(`machines:voiceCoach.flowMode_${mode}`)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {showCountControls ? (
              <>
                {showSessionConfigSelectors ? (
                  <fieldset
                    className={`voice-coach-panel__mode${
                      isRunning ? ' voice-coach-panel__mode--disabled' : ''
                    }`}
                    disabled={isRunning}
                  >
                    <legend className="voice-coach-panel__mode-legend">
                      {t('machines:voiceCoach.countMode')}
                    </legend>
                    <div className="voice-coach-panel__mode-options" role="radiogroup">
                      {VOICE_COUNT_MODES.map((mode) => (
                        <label key={mode} className="voice-coach-panel__mode-option">
                          <input
                            type="radio"
                            name="voice-count-mode"
                            value={mode}
                            checked={countMode === mode}
                            onChange={() => onCountModeChange(mode)}
                          />
                          <span>{t(`machines:voiceCoach.countMode_${mode}`)}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ) : null}

                {showOneMoreAndHoldSelectors ? (
                  <>
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
                        checked={holdAfterCount}
                        onChange={(e) =>
                          onFlowModeChange(e.target.checked ? 'count_hold' : 'count')
                        }
                        disabled={isRunning}
                      />
                      <span>{t('machines:voiceCoach.holdAfterCount')}</span>
                    </label>
                  </>
                ) : null}
              </>
            ) : null}

            <label className="voice-coach-panel__check">
              <input
                type="checkbox"
                checked={pickersPinned}
                onChange={(e) => setPickersPinnedAndNotify(e.target.checked)}
              />
              <span>{t('machines:voiceCoach.pinPickers')}</span>
            </label>

            <div
              className={`voice-coach-panel__pickers${
                pickersPinned ? ' voice-coach-panel__pickers--pinned' : ''
              }${pickersLocked ? ' voice-coach-panel__pickers--readonly' : ''}`}
            >
              <VoiceCoachPickerGrid
                flowMode={flowMode}
                oneMoreEnabled={oneMoreEnabled}
                targetReps={targetReps}
                onTargetRepsChange={onTargetRepsChange}
                repGapMs={repGapMs}
                onRepGapMsChange={onRepGapMsChange}
                oneMoreCount={oneMoreCount}
                onOneMoreCountChange={onOneMoreCountChange}
                holdDurationSec={holdDurationSec}
                onHoldDurationSecChange={onHoldDurationSecChange}
                disabled={isRunning}
                readOnly={pickersLocked}
                recordsLayout={inlineHoldInPickers}
                labels="machines"
                compact={compact}
              />
            </div>

            {showHoldDurationSeparate ? (
              <div className="voice-coach-panel__hold-duration">
                <label className="body-metrics-inline__label" htmlFor="voice-hold-duration">
                  {t('machines:voiceCoach.holdDuration')}
                  <span className="body-metrics-inline__unit">
                    {t('machines:voiceCoach.holdDurationUnit')}
                  </span>
                </label>
                <select
                  id="voice-hold-duration"
                  value={durationCustom ? 'custom' : String(duration)}
                  disabled={isRunning || pickersLocked}
                  onChange={(e) => {
                    if (pickersLocked) return;
                    const v = e.target.value;
                    if (v === 'custom') {
                      setDurationCustom(true);
                      setCustomDraft(String(duration));
                      return;
                    }
                    setDurationCustom(false);
                    onHoldDurationSecChange(clampVoiceHoldDurationSec(Number(v)));
                  }}
                >
                  {VOICE_HOLD_DURATION_PRESETS.map((sec) => (
                    <option key={sec} value={sec}>
                      {t('machines:voiceCoach.holdDurationOption', { sec })}
                    </option>
                  ))}
                  <option value="custom">{t('machines:voiceCoach.holdDurationCustom')}</option>
                </select>
                {durationCustom ? (
                  <input
                    type="number"
                    inputMode="numeric"
                    min={VOICE_HOLD_DURATION.minSec}
                    max={VOICE_HOLD_DURATION.maxSec}
                    value={customDraft}
                    disabled={isRunning || pickersLocked}
                    aria-label={t('machines:voiceCoach.holdDurationCustom')}
                    onChange={(e) => {
                      if (pickersLocked) return;
                      setCustomDraft(e.target.value);
                    }}
                    onBlur={() => {
                      if (pickersLocked) return;
                      const next = clampVoiceHoldDurationSec(Number(customDraft));
                      setCustomDraft(String(next));
                      onHoldDurationSecChange(next);
                    }}
                  />
                ) : null}
              </div>
            ) : null}

            {showRestOptionSelectors ? (
              <>
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
              </>
            ) : null}
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

          {!hideLiveDisplay && display.showLiveDisplay ? (
            <div
              className={`voice-coach-panel__count-stage${
                display.turboStage ? ' voice-coach-panel__count-stage--turbo' : ''
              }${display.climaxStage ? ' voice-coach-panel__count-stage--climax' : ''}`}
              aria-hidden="true"
            >
              <span
                key={`${phase}-${display.displayNumber}`}
                className="voice-coach-panel__count-num"
                style={{
                  transform: `scale(${display.scale})`,
                  ['--count-shake' as string]: `${
                    display.turboStage ? 1.2 + intensity : intensity * 0.6
                  }px`,
                }}
              >
                {display.displayNumber}
              </span>
            </div>
          ) : null}

          <p className="voice-coach-panel__status" role="status" aria-live="polite">
            {voiceCoachStatusLabel(t, phase, currentRep, countdown)}
            {turbo ? ` · ${t('machines:voiceCoach.turboBadge')}` : ''}
            {phase === 'hold' ? ` · ${t('machines:voiceCoach.holdBadge')}` : ''}
          </p>
        </>
      ) : null}
    </section>
  );
}
