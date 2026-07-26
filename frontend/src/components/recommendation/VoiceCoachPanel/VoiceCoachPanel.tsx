import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollPicker } from '@/components/form/ScrollPicker/ScrollPicker';
import {
  VOICE_COUNT_MODES,
  formatCountDisplay,
  type VoiceCountMode,
} from '@/utils/aiCountPace';
import {
  clampVoiceCoachOneMoreCount,
  clampVoiceCoachPrepCount,
  clampVoiceCoachRepGapMs,
  normalizeVoiceCoachPack,
  VOICE_COACH_ONE_MORE,
  VOICE_COACH_PACKS,
  VOICE_COACH_PREP_COUNTS,
  VOICE_COACH_REP_GAP,
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
    case 'hold':
      if (countdown == null) return t('machines:voiceCoach.statusHoldCue');
      if (countdown <= 0) return t('machines:voiceCoach.statusHoldFinish');
      return t('machines:voiceCoach.statusHoldCountdown', { count: countdown });
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
}: VoiceCoachPanelProps) {
  const { t } = useTranslation(['machines', 'common']);
  const gapSec = clampVoiceCoachRepGapMs(repGapMs) / 1000;
  const duration = clampVoiceHoldDurationSec(holdDurationSec);
  const showCountControls = flowMode !== 'hold';
  const showHoldDuration = flowMode === 'count_hold' || flowMode === 'hold';
  const holdAfterCount = flowMode === 'count_hold';

  const [durationCustom, setDurationCustom] = useState(!isVoiceHoldDurationPreset(duration));
  const [customDraft, setCustomDraft] = useState(String(duration));

  useEffect(() => {
    if (!durationCustom) {
      setCustomDraft(String(duration));
    }
  }, [duration, durationCustom]);

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
        ? `${t('machines:voiceCoach.oneMoreShort', { defaultValue: '하나더' })}!`
        : t('machines:voiceCoach.oneMoreShort', { defaultValue: '하나더' })
      : showHoldStage
        ? countdown != null && countdown > 0
          ? String(countdown)
          : countdown === 0
            ? '!'
            : t('machines:voiceCoach.holdCueShort')
        : showCountdownStage
          ? String(countdown)
          : phase === 'start'
            ? '!'
            : '';

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

                <div
                  className={`body-metrics-inline voice-coach-panel__pickers${
                    isRunning ? ' body-metrics-inline--disabled' : ''
                  }`}
                  role="group"
                  aria-label={t('machines:voiceCoach.title')}
                >
                  <div className="body-metrics-inline__grid">
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
                    {showOneMoreAndHoldSelectors ? (
                      <div className="body-metrics-inline__cell">
                        <span className="body-metrics-inline__label">
                          {t('machines:voiceCoach.oneMoreCount')}
                          <span className="body-metrics-inline__unit">
                            {t('machines:voiceCoach.oneMoreCountUnit')}
                          </span>
                        </span>
                        <ScrollPicker
                          value={clampVoiceCoachOneMoreCount(oneMoreCount)}
                          onChange={onOneMoreCountChange}
                          min={VOICE_COACH_ONE_MORE.minCount}
                          max={VOICE_COACH_ONE_MORE.maxCount}
                          step={VOICE_COACH_ONE_MORE.step}
                          size={compact ? 'compact' : 'default'}
                          defaultValue={VOICE_COACH_ONE_MORE.defaultCount}
                          ariaLabel={t('machines:voiceCoach.oneMoreCount')}
                          formatValue={(value) => String(value)}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

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

            {showHoldDuration ? (
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
                  disabled={isRunning}
                  onChange={(e) => {
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
                    disabled={isRunning}
                    aria-label={t('machines:voiceCoach.holdDurationCustom')}
                    onChange={(e) => setCustomDraft(e.target.value)}
                    onBlur={() => {
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

          {displayNumber ? (
            <div
              className={`voice-coach-panel__count-stage${
                turbo || phase === 'hold' ? ' voice-coach-panel__count-stage--turbo' : ''
              }${
                (showCountStage && intensity > 0.85) || phase === 'hold'
                  ? ' voice-coach-panel__count-stage--climax'
                  : ''
              }`}
              aria-hidden="true"
            >
              <span
                key={`${phase}-${displayNumber}`}
                className="voice-coach-panel__count-num"
                style={{
                  transform: `scale(${scale})`,
                  ['--count-shake' as string]: `${
                    turbo || phase === 'hold' ? 1.2 + intensity : intensity * 0.6
                  }px`,
                }}
              >
                {displayNumber}
              </span>
            </div>
          ) : null}

          <p className="voice-coach-panel__status" role="status" aria-live="polite">
            {statusLabel(t, phase, currentRep, countdown)}
            {turbo ? ` · ${t('machines:voiceCoach.turboBadge')}` : ''}
            {phase === 'hold' ? ` · ${t('machines:voiceCoach.holdBadge')}` : ''}
          </p>
        </>
      ) : null}
    </section>
  );
}
