import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  REST_DURATION,
  clampRestDurationSeconds,
  restDurationParts,
} from '@machinefit/shared';
import { Icon } from '@/components/icons/Icon';
import { RestTimerBanner } from '@/components/recommendation/RestTimerBanner/RestTimerBanner';
import { VoiceCoachPanel } from '@/components/recommendation/VoiceCoachPanel/VoiceCoachPanel';
import { WorkoutDisplayOverlay } from '@/components/recommendation/WorkoutDisplayOverlay/WorkoutDisplayOverlay';
import { useVoiceCoachSession } from '@/hooks/useVoiceCoachSession';
import { useSettingsStore } from '@/store/settings.store';
import {
  clampVoiceCoachOneMoreCount,
  clampVoiceCoachRepGapMs,
  clampVoiceCoachTargetReps,
  VOICE_COACH_ONE_MORE,
  VOICE_COACH_REP_GAP,
  VOICE_COACH_TARGET_REPS,
} from '@/utils/voiceCoach';
import { clampVoiceHoldDurationSec, VOICE_HOLD_DURATION } from '@/utils/voiceHold';
import '@/styles/home.css';
import '@/styles/recommendation.css';

function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Home-only presentational tools (rest timer + rep counter).
 * Local UI state only — does not change workout / recommendation business flows.
 */
export function HomeWorkoutToolsSection() {
  const { t } = useTranslation(['common', 'machines']);

  const settingsRestSeconds = useSettingsStore((s) => s.restDurationSeconds);
  const settingsTargetReps = useSettingsStore((s) => s.voiceCoachTargetReps);
  const settingsRepGapMs = useSettingsStore((s) => s.voiceCoachRepGapMs);
  const settingsOneMore = useSettingsStore((s) => s.voiceCoachOneMore);
  const settingsOneMoreCount = useSettingsStore((s) => s.voiceCoachOneMoreCount);
  const settingsPrepCount = useSettingsStore((s) => s.voiceCoachPrepCount);
  const settingsPack = useSettingsStore((s) => s.voiceCoachPack);
  const settingsCountMode = useSettingsStore((s) => s.voiceCountMode);
  const settingsFlowMode = useSettingsStore((s) => s.voiceCoachFlowMode);
  const settingsHoldSec = useSettingsStore((s) => s.voiceHoldDurationSec);
  const settingsAutoAfterRest = useSettingsStore((s) => s.voiceCoachAutoAfterRest);
  const settingsRestTips = useSettingsStore((s) => s.voiceRestTipsEnabled);
  const settingsLocale = useSettingsStore((s) => s.locale);
  const fullscreenDisplay = useSettingsStore((s) => s.workoutFullscreenDisplay);

  const [restSeconds, setRestSeconds] = useState(() =>
    clampRestDurationSeconds(settingsRestSeconds)
  );
  const [restRunning, setRestRunning] = useState(false);

  const [countValue, setCountValue] = useState(() =>
    clampVoiceCoachTargetReps(settingsTargetReps)
  );
  const [detailsOpen, setDetailsOpen] = useState(false);

  const settingsVoiceEnabled = useSettingsStore((s) => s.voiceCoachEnabled);
  const [voiceEnabled, setVoiceEnabled] = useState(settingsVoiceEnabled);
  const [targetReps, setTargetReps] = useState(() =>
    clampVoiceCoachTargetReps(settingsTargetReps)
  );
  const [repGapMs, setRepGapMs] = useState(() => clampVoiceCoachRepGapMs(settingsRepGapMs));
  const [oneMoreEnabled, setOneMoreEnabled] = useState(settingsOneMore);
  const [oneMoreCount, setOneMoreCount] = useState(() =>
    clampVoiceCoachOneMoreCount(settingsOneMoreCount)
  );
  const [prepCount, setPrepCount] = useState(settingsPrepCount);
  const [voicePack, setVoicePack] = useState(settingsPack);
  const [countMode, setCountMode] = useState(settingsCountMode);
  const [flowMode, setFlowMode] = useState(settingsFlowMode);
  const [holdDurationSec, setHoldDurationSec] = useState(() =>
    clampVoiceHoldDurationSec(settingsHoldSec)
  );
  const [autoAfterRest, setAutoAfterRest] = useState(settingsAutoAfterRest);
  const [restTipsEnabled, setRestTipsEnabled] = useState(settingsRestTips);

  const voiceCoach = useVoiceCoachSession({
    targetReps,
    oneMoreEnabled,
    oneMoreCount,
    repGapMs,
    prepCount,
    voicePack,
    countMode,
    flowMode,
    holdDurationSec,
    locale: settingsLocale,
    enabled: voiceEnabled,
  });

  useEffect(() => {
    if (!detailsOpen) return;
    setCountValue(targetReps);
  }, [detailsOpen, targetReps]);

  const restParts = restDurationParts(restSeconds);
  const showFullscreenCount =
    fullscreenDisplay && detailsOpen && voiceCoach.isRunning;

  const nudgeRest = (deltaSec: number) => {
    setRestSeconds((prev) => clampRestDurationSeconds(prev + deltaSec));
  };

  const nudgeCount = (delta: number) => {
    setCountValue((prev) =>
      Math.max(
        VOICE_COACH_TARGET_REPS.minCount,
        Math.min(VOICE_COACH_TARGET_REPS.maxCount, prev + delta)
      )
    );
  };

  return (
    <section className="home-section home-workout-tools" aria-label={t('pages.home.toolsTitle')}>
      {restRunning ? (
        <RestTimerBanner
          seconds={restSeconds}
          setNumber={1}
          onDismiss={() => setRestRunning(false)}
          onReadyForNextSet={() => setRestRunning(false)}
        />
      ) : null}

      <div className="home-workout-tools__grid">
        <article className="home-tool-card home-tool-card--rest">
          <div className="home-tool-card__header">
            <span className="home-tool-card__icon home-tool-card__icon--rest" aria-hidden>
              <Icon name="clock" size={22} />
            </span>
            <div className="home-tool-card__heading">
              <h3 className="home-tool-card__title">{t('pages.home.toolsRestTitle')}</h3>
              <p className="home-tool-card__desc">{t('pages.home.toolsRestDesc')}</p>
            </div>
          </div>

          <p className="home-tool-card__hero home-tool-card__hero--rest" aria-live="polite">
            {formatClock(restSeconds)}
          </p>

          <div className="home-tool-card__stepper" role="group" aria-label={t('pages.home.toolsRestTitle')}>
            <button
              type="button"
              className="home-tool-card__step-btn"
              onClick={() => nudgeRest(-REST_DURATION.secondStep)}
              aria-label={t('pages.home.toolsDecrease')}
              disabled={restRunning}
            >
              −
            </button>
            <span className="home-tool-card__step-value">
              {String(restParts.minutes).padStart(2, '0')}:
              {String(restParts.seconds).padStart(2, '0')}
            </span>
            <button
              type="button"
              className="home-tool-card__step-btn"
              onClick={() => nudgeRest(REST_DURATION.secondStep)}
              aria-label={t('pages.home.toolsIncrease')}
              disabled={restRunning}
            >
              +
            </button>
          </div>

          <button
            type="button"
            className="home-tool-card__cta home-tool-card__cta--rest"
            onClick={() => setRestRunning(true)}
            disabled={restRunning}
          >
            {t('pages.home.toolsRestStart')}
          </button>
        </article>

        <article className="home-tool-card home-tool-card--count">
          <div className="home-tool-card__header">
            <span className="home-tool-card__icon home-tool-card__icon--count" aria-hidden>
              123
            </span>
            <div className="home-tool-card__heading">
              <h3 className="home-tool-card__title">{t('pages.home.toolsCountTitle')}</h3>
              <p className="home-tool-card__desc">{t('pages.home.toolsCountDesc')}</p>
            </div>
          </div>

          <p className="home-tool-card__hero home-tool-card__hero--count" aria-live="polite">
            {countValue}
            <span className="home-tool-card__unit">{t('pages.home.toolsCountUnit')}</span>
          </p>

          <div className="home-tool-card__stepper home-tool-card__stepper--count">
            <button
              type="button"
              className="home-tool-card__step-btn"
              onClick={() => nudgeCount(-1)}
              aria-label={t('pages.home.toolsDecrease')}
            >
              −
            </button>
            <button
              type="button"
              className="home-tool-card__step-btn"
              onClick={() => nudgeCount(1)}
              aria-label={t('pages.home.toolsIncrease')}
            >
              +
            </button>
            <button
              type="button"
              className="home-tool-card__step-btn home-tool-card__step-btn--wide"
              onClick={() => setCountValue(clampVoiceCoachTargetReps(settingsTargetReps))}
            >
              {t('pages.home.toolsReset')}
            </button>
          </div>

          <button
            type="button"
            className="home-tool-card__cta home-tool-card__cta--count"
            onClick={() => {
              setDetailsOpen((open) => !open);
              if (!detailsOpen) setTargetReps(countValue);
            }}
            aria-expanded={detailsOpen}
          >
            {detailsOpen
              ? t('pages.home.toolsCountCloseDetails')
              : t('pages.home.toolsCountOpenDetails')}
            <span
              className={`home-tool-card__cta-chevron${detailsOpen ? ' is-open' : ''}`}
              aria-hidden
            >
              <Icon name="chevronRight" size={18} />
            </span>
          </button>
        </article>
      </div>

      {detailsOpen ? (
        <article className="home-tool-details" aria-label={t('pages.home.toolsCountDetailsTitle')}>
          <header className="home-tool-details__header">
            <div className="home-tool-details__heading">
              <span className="home-tool-card__icon home-tool-card__icon--count" aria-hidden>
                123
              </span>
              <h3 className="home-tool-details__title">{t('pages.home.toolsCountDetailsTitle')}</h3>
            </div>
            <div className="home-tool-details__voice-flag">
              <span>{t('pages.home.toolsVoiceCount')}</span>
              <span
                className={`home-tool-switch${voiceEnabled ? ' is-on' : ''}`}
                aria-hidden
              />
            </div>
          </header>

          <div className="home-tool-details__body">
            <div className="home-tool-details__current">
              <span className="home-tool-details__label">{t('pages.home.toolsCurrentCount')}</span>
              <p className="home-tool-card__hero home-tool-card__hero--count">
                {countValue}
                <span className="home-tool-card__unit">{t('pages.home.toolsCountUnit')}</span>
              </p>
              <div className="home-tool-card__stepper home-tool-card__stepper--count">
                <button
                  type="button"
                  className="home-tool-card__step-btn"
                  onClick={() => {
                    nudgeCount(-1);
                    setTargetReps((prev) =>
                      Math.max(VOICE_COACH_TARGET_REPS.minCount, prev - 1)
                    );
                  }}
                  aria-label={t('pages.home.toolsDecrease')}
                >
                  −
                </button>
                <button
                  type="button"
                  className="home-tool-card__step-btn"
                  onClick={() => {
                    nudgeCount(1);
                    setTargetReps((prev) =>
                      Math.min(VOICE_COACH_TARGET_REPS.maxCount, prev + 1)
                    );
                  }}
                  aria-label={t('pages.home.toolsIncrease')}
                >
                  +
                </button>
                <button
                  type="button"
                  className="home-tool-card__step-btn home-tool-card__step-btn--wide"
                  onClick={() => {
                    const next = clampVoiceCoachTargetReps(settingsTargetReps);
                    setCountValue(next);
                    setTargetReps(next);
                  }}
                >
                  {t('pages.home.toolsReset')}
                </button>
              </div>
              <button
                type="button"
                className="home-tool-card__cta home-tool-card__cta--count"
                onClick={voiceCoach.isRunning ? voiceCoach.stop : voiceCoach.start}
                disabled={!voiceEnabled && !voiceCoach.isRunning}
              >
                {voiceCoach.isRunning
                  ? t('pages.home.toolsCountStop')
                  : t('pages.home.toolsCountStart')}
              </button>
            </div>

            <div className="home-tool-details__voice">
              <VoiceCoachPanel
                enabled={voiceEnabled}
                onEnabledChange={setVoiceEnabled}
                targetReps={targetReps}
                onTargetRepsChange={(reps) => {
                  const next = clampVoiceCoachTargetReps(reps);
                  setTargetReps(next);
                  setCountValue(next);
                }}
                repGapMs={repGapMs}
                onRepGapMsChange={(ms) => setRepGapMs(clampVoiceCoachRepGapMs(ms))}
                prepCount={prepCount}
                onPrepCountChange={setPrepCount}
                voicePack={voicePack}
                onVoicePackChange={setVoicePack}
                countMode={countMode}
                onCountModeChange={setCountMode}
                flowMode={flowMode}
                onFlowModeChange={setFlowMode}
                holdDurationSec={holdDurationSec}
                onHoldDurationSecChange={(sec) =>
                  setHoldDurationSec(clampVoiceHoldDurationSec(sec))
                }
                oneMoreEnabled={oneMoreEnabled}
                onOneMoreChange={setOneMoreEnabled}
                oneMoreCount={oneMoreCount}
                onOneMoreCountChange={(count) =>
                  setOneMoreCount(clampVoiceCoachOneMoreCount(count))
                }
                autoStartAfterRest={autoAfterRest}
                onAutoStartAfterRestChange={setAutoAfterRest}
                restTipsEnabled={restTipsEnabled}
                onRestTipsEnabledChange={setRestTipsEnabled}
                phase={voiceCoach.phase}
                currentRep={voiceCoach.currentRep}
                countdown={voiceCoach.countdown}
                turbo={voiceCoach.turbo}
                intensity={voiceCoach.intensity}
                isRunning={voiceCoach.isRunning}
                onStart={voiceCoach.start}
                onStop={voiceCoach.stop}
                compact
                showRestOptionSelectors={false}
                idPrefix="home-voice-coach"
              />
            </div>
          </div>

          <p className="home-tool-details__hint">
            {t('pages.home.toolsVoiceHint', {
              gap: (repGapMs / 1000).toFixed(1),
              oneMore: oneMoreCount,
              hold: holdDurationSec,
              defaultGap: VOICE_COACH_REP_GAP.defaultMs / 1000,
              defaultOneMore: VOICE_COACH_ONE_MORE.defaultCount,
              defaultHold: VOICE_HOLD_DURATION.defaultSec,
            })}
          </p>
        </article>
      ) : null}

      {showFullscreenCount ? (
        <WorkoutDisplayOverlay
          mode="count"
          restSeconds={0}
          restSetNumber={1}
          onRestDismiss={() => undefined}
          phase={voiceCoach.phase}
          currentRep={voiceCoach.currentRep}
          countdown={voiceCoach.countdown}
          turbo={voiceCoach.turbo}
          intensity={voiceCoach.intensity}
          isCountPaused={voiceCoach.isPaused}
          onPauseCount={voiceCoach.pause}
          onResumeCount={voiceCoach.resume}
          onStopCount={voiceCoach.stop}
        />
      ) : null}
    </section>
  );
}
