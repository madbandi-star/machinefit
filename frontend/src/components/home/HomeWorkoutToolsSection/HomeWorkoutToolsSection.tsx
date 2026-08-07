import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  clampRestDurationSeconds,
  restDurationParts,
} from '@machinefit/shared';
import { Icon } from '@/components/icons/Icon';
import { VoiceCoachPickerGrid } from '@/components/recommendation/VoiceCoachPickerGrid/VoiceCoachPickerGrid';
import { ROUTES } from '@/constants/routes';
import { useVoiceCoachSession } from '@/hooks/useVoiceCoachSession';
import { useHomeVoiceToolsStore } from '@/store/homeVoiceTools.store';
import { useRestTimerStore } from '@/store/restTimer.store';
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

/** Home rest-timer +/- step (settings page keeps its own finer step). */
const HOME_REST_STEP_SEC = 30;

function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Home-only presentational tools (rest timer + rep counter).
 * Picker defaults come from Settings; once edited on Home they stay in
 * `homeVoiceTools` store across SPA navigation (independent of pin).
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

  const customized = useHomeVoiceToolsStore((s) => s.customized);
  const storedPickers = useHomeVoiceToolsStore((s) => s.pickers);
  const pickersPinned = useHomeVoiceToolsStore((s) => s.pickersPinned);
  const setPickersPinned = useHomeVoiceToolsStore((s) => s.setPickersPinned);
  const updatePickers = useHomeVoiceToolsStore((s) => s.updatePickers);
  const resetToDefaults = useHomeVoiceToolsStore((s) => s.resetToDefaults);

  const settingsDefaults = useMemo(
    () => ({
      targetReps: clampVoiceCoachTargetReps(settingsTargetReps),
      repGapMs: clampVoiceCoachRepGapMs(settingsRepGapMs),
      oneMoreCount: clampVoiceCoachOneMoreCount(settingsOneMoreCount),
      holdDurationSec: clampVoiceHoldDurationSec(settingsHoldSec),
      voiceEnabled: settingsVoiceEnabled,
    }),
    [
      settingsTargetReps,
      settingsRepGapMs,
      settingsOneMoreCount,
      settingsHoldSec,
      settingsVoiceEnabled,
    ]
  );

  const resolvedPickers = customized && storedPickers ? storedPickers : settingsDefaults;
  const {
    targetReps,
    repGapMs,
    oneMoreCount,
    holdDurationSec,
    voiceEnabled,
  } = resolvedPickers;

  const [restSeconds, setRestSeconds] = useState(() =>
    clampRestDurationSeconds(settingsRestSeconds)
  );
  const restSession = useRestTimerStore((s) => s.session);
  const startRestTimer = useRestTimerStore((s) => s.start);
  const restRunning = restSession != null;

  const [detailsOpen, setDetailsOpen] = useState(false);

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
  const pickersLocked = pickersPinned || !voiceEnabled || voiceCoach.isRunning;

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
    if (pickersPinned) return;
    const next = Math.max(
      VOICE_COACH_TARGET_REPS.minCount,
      Math.min(VOICE_COACH_TARGET_REPS.maxCount, targetReps + delta)
    );
    updatePickers(resolvedPickers, { targetReps: next });
  };

  return (
    <section className="home-section home-workout-tools" aria-label={t('pages.home.toolsTitle')}>
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
              onClick={() => nudgeRest(-HOME_REST_STEP_SEC)}
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
              onClick={() => nudgeRest(HOME_REST_STEP_SEC)}
              aria-label={t('pages.home.toolsIncrease')}
              disabled={restRunning}
            >
              +
            </button>
          </div>

          {/* GlobalRestTimerHost portals the compact rest banner here when present. */}
          <div id="mf-rest-timer-slot" className="home-rest-timer-slot" />

          <button
            type="button"
            className="home-tool-card__cta home-tool-card__cta--rest"
            onClick={() => startRestTimer(1, restSeconds)}
            disabled={restRunning}
          >
            <span className="home-tool-card__cta-emoji" aria-hidden>
              💤
            </span>
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
            {targetReps}
            <span className="home-tool-card__unit">{t('pages.home.toolsCountUnit')}</span>
          </p>

          <div className="home-tool-card__stepper home-tool-card__stepper--count">
            <button
              type="button"
              className="home-tool-card__step-btn"
              onClick={() => nudgeCount(-1)}
              aria-label={t('pages.home.toolsDecrease')}
              disabled={pickersPinned}
            >
              −
            </button>
            <button
              type="button"
              className="home-tool-card__step-btn"
              onClick={() => nudgeCount(1)}
              aria-label={t('pages.home.toolsIncrease')}
              disabled={pickersPinned}
            >
              +
            </button>
            <button
              type="button"
              className="home-tool-card__step-btn home-tool-card__step-btn--wide"
              onClick={() => resetToDefaults(settingsDefaults)}
              disabled={pickersPinned}
            >
              {t('pages.home.toolsReset')}
            </button>
          </div>

          <div id="mf-count-session-slot" className="home-count-session-slot" />

          <div className="home-tool-card__cta-row">
            <button
              type="button"
              className="home-tool-card__cta home-tool-card__cta--count home-tool-card__cta--details"
              onClick={() => setDetailsOpen((open) => !open)}
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
            <Link
              to={`${ROUTES.SETTINGS}#voice-coach`}
              className="home-tool-details__gear"
              aria-label={t('settings.voiceCoach')}
            >
              <Icon name="sliders" size={18} />
            </Link>
          </header>

          <div className="home-tool-details__body">
            <div className="home-tool-details__voice">
              <div className="home-tool-details__voice-head">
                <span className="home-tool-details__voice-title">
                  {t('pages.home.toolsVoiceCount')}
                </span>
                <label className="home-tool-details__voice-check">
                  <input
                    type="checkbox"
                    checked={voiceEnabled}
                    onChange={(e) => {
                      if (pickersPinned) return;
                      updatePickers(resolvedPickers, { voiceEnabled: e.target.checked });
                    }}
                    disabled={voiceCoach.isRunning || pickersPinned}
                  />
                  <span>{t('machines:voiceCoach.on')}</span>
                </label>
              </div>

              <label className="home-tool-details__voice-check home-tool-details__pin-check">
                <input
                  type="checkbox"
                  checked={pickersPinned}
                  onChange={(e) => setPickersPinned(e.target.checked)}
                />
                <span>{t('machines:voiceCoach.pinPickers')}</span>
              </label>

              <div
                className={`home-tool-details__pickers${
                  pickersPinned ? ' home-tool-details__pickers--pinned' : ''
                }${pickersLocked ? ' home-tool-details__pickers--readonly' : ''}`}
              >
                <VoiceCoachPickerGrid
                  flowMode="count_hold"
                  oneMoreEnabled
                  targetReps={targetReps}
                  onTargetRepsChange={(reps) => {
                    updatePickers(resolvedPickers, {
                      targetReps: clampVoiceCoachTargetReps(reps),
                    });
                  }}
                  repGapMs={repGapMs}
                  onRepGapMsChange={(ms) =>
                    updatePickers(resolvedPickers, {
                      repGapMs: clampVoiceCoachRepGapMs(ms),
                    })
                  }
                  oneMoreCount={oneMoreCount}
                  onOneMoreCountChange={(count) =>
                    updatePickers(resolvedPickers, {
                      oneMoreCount: clampVoiceCoachOneMoreCount(count),
                    })
                  }
                  holdDurationSec={holdDurationSec}
                  onHoldDurationSecChange={(sec) =>
                    updatePickers(resolvedPickers, {
                      holdDurationSec: clampVoiceHoldDurationSec(sec),
                    })
                  }
                  disabled={!voiceEnabled || voiceCoach.isRunning}
                  readOnly={pickersPinned}
                  recordsLayout
                  labels="settings"
                  compact
                />
              </div>

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
    </section>
  );
}
