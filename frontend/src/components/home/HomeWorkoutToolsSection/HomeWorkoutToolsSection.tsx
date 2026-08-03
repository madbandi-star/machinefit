import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  REST_DURATION,
  clampRestDurationSeconds,
  restDurationParts,
} from '@machinefit/shared';
import { Icon } from '@/components/icons/Icon';
import { RestTimerBanner } from '@/components/recommendation/RestTimerBanner/RestTimerBanner';
import { VoiceCoachPickerGrid } from '@/components/recommendation/VoiceCoachPickerGrid/VoiceCoachPickerGrid';
import { WorkoutDisplayOverlay } from '@/components/recommendation/WorkoutDisplayOverlay/WorkoutDisplayOverlay';
import { ROUTES } from '@/constants/routes';
import { useVoiceCoachSession } from '@/hooks/useVoiceCoachSession';
import { useSettingsStore } from '@/store/settings.store';
import {
  clampVoiceCoachOneMoreCount,
  clampVoiceCoachRepGapMs,
  clampVoiceCoachTargetReps,
  VOICE_COACH_TARGET_REPS,
} from '@/utils/voiceCoach';
import { clampVoiceHoldDurationSec } from '@/utils/voiceHold';
import '@/styles/home.css';
import '@/styles/recommendation.css';
import '@/styles/components.css';

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
  const settingsVoiceEnabled = useSettingsStore((s) => s.voiceCoachEnabled);
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

  const [voiceEnabled, setVoiceEnabled] = useState(settingsVoiceEnabled);
  const [targetReps, setTargetReps] = useState(() =>
    clampVoiceCoachTargetReps(settingsTargetReps)
  );
  const [repGapMs, setRepGapMs] = useState(() => clampVoiceCoachRepGapMs(settingsRepGapMs));
  const [oneMoreCount, setOneMoreCount] = useState(() =>
    clampVoiceCoachOneMoreCount(settingsOneMoreCount)
  );
  const [holdDurationSec, setHoldDurationSec] = useState(() =>
    clampVoiceHoldDurationSec(settingsHoldSec)
  );

  const voiceCoach = useVoiceCoachSession({
    targetReps,
    oneMoreEnabled: settingsOneMore,
    oneMoreCount,
    repGapMs,
    prepCount: settingsPrepCount,
    voicePack: settingsPack,
    countMode: settingsCountMode,
    flowMode: settingsFlowMode === 'hold' ? 'hold' : 'count_hold',
    holdDurationSec,
    locale: settingsLocale,
    enabled: voiceEnabled,
  });

  const restParts = restDurationParts(restSeconds);
  const showFullscreenCount = fullscreenDisplay && voiceCoach.isRunning;

  const startOrStopCount = () => {
    if (voiceCoach.isRunning) {
      voiceCoach.stop();
      return;
    }
    voiceCoach.start();
  };

  const nudgeRest = (deltaSec: number) => {
    setRestSeconds((prev) => clampRestDurationSeconds(prev + deltaSec));
  };

  const nudgeCount = (delta: number) => {
    setCountValue((prev) => {
      const next = Math.max(
        VOICE_COACH_TARGET_REPS.minCount,
        Math.min(VOICE_COACH_TARGET_REPS.maxCount, prev + delta)
      );
      setTargetReps(next);
      return next;
    });
  };

  const resetCount = () => {
    const next = clampVoiceCoachTargetReps(settingsTargetReps);
    setCountValue(next);
    setTargetReps(next);
  };

  const syncTargetFromCount = (nextCount: number) => {
    const next = clampVoiceCoachTargetReps(nextCount);
    setCountValue(next);
    setTargetReps(next);
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
              onClick={() => {
                const next = clampVoiceCoachTargetReps(settingsTargetReps);
                setCountValue(next);
                setTargetReps(next);
              }}
            >
              {t('pages.home.toolsReset')}
            </button>
          </div>

          <div className="home-tool-card__cta-row">
            <button
              type="button"
              className="home-tool-card__cta home-tool-card__cta--count home-tool-card__cta--details"
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
                <Icon name="chevronRight" size={16} />
              </span>
            </button>
            <button
              type="button"
              className="home-tool-card__cta home-tool-card__cta--count home-tool-card__cta--start"
              onClick={startOrStopCount}
              disabled={!voiceEnabled && !voiceCoach.isRunning}
            >
              {voiceCoach.isRunning
                ? t('pages.home.toolsCountStop')
                : t('pages.home.toolsCountStart')}
            </button>
          </div>
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
              <button
                type="button"
                className={`home-tool-switch${voiceEnabled ? ' is-on' : ''}`}
                role="switch"
                aria-checked={voiceEnabled}
                aria-label={t('pages.home.toolsVoiceCount')}
                onClick={() => setVoiceEnabled((v) => !v)}
              />
              <Link
                to={ROUTES.SETTINGS}
                className="home-tool-details__gear"
                aria-label={t('nav.settings')}
              >
                <Icon name="sliders" size={18} />
              </Link>
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
                  onClick={() => syncTargetFromCount(countValue - 1)}
                  aria-label={t('pages.home.toolsDecrease')}
                  disabled={voiceCoach.isRunning}
                >
                  −
                </button>
                <button
                  type="button"
                  className="home-tool-card__step-btn home-tool-card__step-btn--accent"
                  onClick={() => syncTargetFromCount(countValue + 1)}
                  aria-label={t('pages.home.toolsIncrease')}
                  disabled={voiceCoach.isRunning}
                >
                  +
                </button>
                <button
                  type="button"
                  className="home-tool-card__step-btn home-tool-card__step-btn--wide"
                  onClick={resetCount}
                  disabled={voiceCoach.isRunning}
                >
                  {t('pages.home.toolsReset')}
                </button>
              </div>
              <button
                type="button"
                className="home-tool-card__cta home-tool-card__cta--count"
                onClick={startOrStopCount}
                disabled={!voiceEnabled && !voiceCoach.isRunning}
              >
                {voiceCoach.isRunning
                  ? t('pages.home.toolsCountStop')
                  : t('pages.home.toolsCountStart')}
              </button>
            </div>

            <div className="home-tool-details__voice">
              <div className="home-tool-details__voice-head">
                <span className="home-tool-details__voice-title">
                  {t('pages.home.toolsVoiceCount')}
                </span>
                <label className="home-tool-details__voice-check">
                  <input
                    type="checkbox"
                    checked={voiceEnabled}
                    onChange={(e) => setVoiceEnabled(e.target.checked)}
                    disabled={voiceCoach.isRunning}
                  />
                  <span>{t('machines:voiceCoach.on')}</span>
                </label>
              </div>

              <VoiceCoachPickerGrid
                flowMode="count_hold"
                oneMoreEnabled
                targetReps={targetReps}
                onTargetRepsChange={(reps) => {
                  const next = clampVoiceCoachTargetReps(reps);
                  setTargetReps(next);
                  setCountValue(next);
                }}
                repGapMs={repGapMs}
                onRepGapMsChange={(ms) => setRepGapMs(clampVoiceCoachRepGapMs(ms))}
                oneMoreCount={oneMoreCount}
                onOneMoreCountChange={(count) =>
                  setOneMoreCount(clampVoiceCoachOneMoreCount(count))
                }
                holdDurationSec={holdDurationSec}
                onHoldDurationSecChange={(sec) =>
                  setHoldDurationSec(clampVoiceHoldDurationSec(sec))
                }
                disabled={!voiceEnabled || voiceCoach.isRunning}
                recordsLayout
                labels="settings"
                compact
              />

              <p className="home-tool-details__hint">
                <span className="home-tool-details__hint-icon" aria-hidden>
                  ♪
                </span>
                {t('pages.home.toolsVoiceHint')}
              </p>
            </div>
          </div>
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
