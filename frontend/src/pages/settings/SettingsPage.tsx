import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import type { ExperienceLevel, Gender, WorkoutGoal } from '@machinefit/shared';
import {
  REST_DURATION,
  restDurationFromParts,
  restDurationParts,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { BodyMetricsFields } from '@/components/settings/BodyMetricsFields/BodyMetricsFields';
import { ExperienceSelector } from '@/components/settings/ExperienceSelector/ExperienceSelector';
import { GenderPicker } from '@/components/settings/GenderPicker/GenderPicker';
import { HomeGymField, type HomeGymValue } from '@/components/settings/HomeGymField/HomeGymField';
import { ProfileSummaryCard } from '@/components/settings/ProfileSummaryCard/ProfileSummaryCard';
import { UnitSelector } from '@/components/settings/UnitSelector/UnitSelector';
import { WorkoutGoalSelector } from '@/components/settings/WorkoutGoalSelector/WorkoutGoalSelector';
import { WeightDifficultySlider } from '@/components/settings/WeightDifficultySlider/WeightDifficultySlider';
import { ThemeSwitch } from '@/components/settings/ThemeSwitch/ThemeSwitch';
import { ProUpgradeCard } from '@/components/pro/ProUpgradeCard/ProUpgradeCard';
import { NumericStepper } from '@/components/form/NumericStepper/NumericStepper';
import { DEFAULT_AGE, DEFAULT_HEIGHT_CM, DEFAULT_WEIGHT_KG } from '@/constants/body-metrics-defaults';
import { userApi } from '@/api';
import { useAuthStore } from '@/store/auth.store';
import { useSettingsStore } from '@/store/settings.store';
import { useUIStore } from '@/store/ui.store';
import { syncUserSettings } from '@/utils/syncUserSettings';
import {
  clampVoiceCoachRepGapMs,
  DEFAULT_VOICE_COACH_VOICE,
  voiceCoachPreviewSampleUrl,
  VOICE_COACH_REP_GAP,
  type VoiceCoachVoice,
} from '@/utils/voiceCoach';
import type { User } from '@machinefit/shared';
import '@/styles/components.css';
import '@/styles/home.css';
import '@/styles/phase4.css';

interface SettingsLocationState {
  returnTo?: string;
}

export function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as SettingsLocationState | null)?.returnTo;
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const showToast = useUIStore((s) => s.showToast);
  const unitHeight = useSettingsStore((s) => s.unitHeight);
  const unitWeight = useSettingsStore((s) => s.unitWeight);
  const setUnitHeight = useSettingsStore((s) => s.setUnitHeight);
  const setUnitWeight = useSettingsStore((s) => s.setUnitWeight);
  const voiceCoachEnabled = useSettingsStore((s) => s.voiceCoachEnabled);
  const voiceCoachTargetReps = useSettingsStore((s) => s.voiceCoachTargetReps);
  const voiceCoachOneMore = useSettingsStore((s) => s.voiceCoachOneMore);
  const voiceCoachAutoAfterRest = useSettingsStore((s) => s.voiceCoachAutoAfterRest);
  const voiceRestTipsEnabled = useSettingsStore((s) => s.voiceRestTipsEnabled);
  const voiceCoachRepGapMs = useSettingsStore((s) => s.voiceCoachRepGapMs);
  const voiceCoachVoice = useSettingsStore((s) => s.voiceCoachVoice);
  const restDurationSeconds = useSettingsStore((s) => s.restDurationSeconds);
  const setVoiceCoachEnabled = useSettingsStore((s) => s.setVoiceCoachEnabled);
  const setVoiceCoachTargetReps = useSettingsStore((s) => s.setVoiceCoachTargetReps);
  const setVoiceCoachOneMore = useSettingsStore((s) => s.setVoiceCoachOneMore);
  const setVoiceCoachAutoAfterRest = useSettingsStore((s) => s.setVoiceCoachAutoAfterRest);
  const setVoiceRestTipsEnabled = useSettingsStore((s) => s.setVoiceRestTipsEnabled);
  const setVoiceCoachRepGapMs = useSettingsStore((s) => s.setVoiceCoachRepGapMs);
  const setVoiceCoachVoice = useSettingsStore((s) => s.setVoiceCoachVoice);
  const setRestDurationSeconds = useSettingsStore((s) => s.setRestDurationSeconds);

  const [heightCm, setHeightCm] = useState(user?.heightCm ?? DEFAULT_HEIGHT_CM);
  const [weightKg, setWeightKg] = useState(user?.weightKg ?? DEFAULT_WEIGHT_KG);
  const [age, setAge] = useState(user?.age ?? DEFAULT_AGE);
  const [gender, setGender] = useState<Gender | undefined>(user?.gender);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    user?.experienceLevel ?? 'intermediate'
  );
  const [workoutGoal, setWorkoutGoal] = useState<WorkoutGoal | undefined>(user?.workoutGoal);
  const [homeGym, setHomeGym] = useState<HomeGymValue>({
    homeGymId: user?.homeGymId,
    homeGymName: user?.homeGymName,
  });
  const [draftUnitHeight, setDraftUnitHeight] = useState(unitHeight);
  const [draftUnitWeight, setDraftUnitWeight] = useState(unitWeight);

  useEffect(() => {
    if (user?.heightCm != null) setHeightCm(user.heightCm);
    else setHeightCm(DEFAULT_HEIGHT_CM);
    setWeightKg(user?.weightKg ?? DEFAULT_WEIGHT_KG);
    setAge(user?.age ?? DEFAULT_AGE);
    setGender(user?.gender);
    if (user?.experienceLevel) setExperienceLevel(user.experienceLevel);
    setWorkoutGoal(user?.workoutGoal);
    setHomeGym({
      homeGymId: user?.homeGymId,
      homeGymName: user?.homeGymName,
    });
    setDraftUnitHeight(unitHeight);
    setDraftUnitWeight(unitWeight);
  }, [
    user?.heightCm,
    user?.weightKg,
    user?.age,
    user?.gender,
    user?.experienceLevel,
    user?.workoutGoal,
    user?.homeGymId,
    user?.homeGymName,
    unitHeight,
    unitWeight,
  ]);

  const mutation = useMutation({
    mutationFn: () =>
      userApi.updateMe({
        heightCm,
        weightKg,
        age,
        gender,
        unitHeight: draftUnitHeight,
        unitWeight: draftUnitWeight,
        experienceLevel,
        workoutGoal,
        homeGymId: homeGym.homeGymId ?? null,
        homeGymName: homeGym.homeGymName?.trim() || null,
      }),
    onSuccess: (res) => {
      const updatedUser = res.data.data as User;
      updateUser(updatedUser);
      setUnitHeight(draftUnitHeight);
      setUnitWeight(draftUnitWeight);
      syncUserSettings(updatedUser);
      showToast(t('auth.profileSaved'), 'success');
      if (returnTo) {
        navigate(returnTo, { replace: true });
      }
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  const restParts = restDurationParts(restDurationSeconds);

  return (
    <PageShell title={t('nav.settings')}>
      <ProfileSummaryCard user={user} />
      <div className="settings-stack">
        <section className="form-section">
          <h3 className="form-section__title">{t('auth.bodyMetrics')}</h3>
          <p className="form-section__desc">{t('auth.bodyMetricsDesc')}</p>
          <div className="form-stack">
            <GenderPicker value={gender} onChange={setGender} />
            <BodyMetricsFields
              unitHeight={draftUnitHeight}
              unitWeight={draftUnitWeight}
              heightCm={heightCm}
              weightKg={weightKg}
              age={age}
              onHeightCmChange={(value) => {
                if (value != null) setHeightCm(value);
              }}
              onWeightKgChange={(value) => {
                if (value != null) setWeightKg(value);
              }}
              onAgeChange={setAge}
              pickerSize="default"
            />
            <ExperienceSelector
              value={experienceLevel}
              onChange={(value) => {
                if (value != null) setExperienceLevel(value);
              }}
            />
          </div>
        </section>

        <section className="form-section">
          <h3 className="form-section__title">{t('auth.profileExtras')}</h3>
          <p className="form-section__desc">{t('auth.profileExtrasDesc')}</p>
          <div className="form-stack">
            <WorkoutGoalSelector value={workoutGoal} onChange={setWorkoutGoal} />
            <HomeGymField value={homeGym} onChange={setHomeGym} />
          </div>
          <button
            type="button"
            className="btn btn--primary btn--block"
            style={{ marginTop: 'var(--space-md)' }}
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <span className="btn__spinner" aria-hidden /> : t('actions.save')}
          </button>
        </section>

        <section className="form-section">
          <h3 className="form-section__title">{t('settings.weightDifficulty')}</h3>
          <p className="form-section__desc">{t('settings.weightDifficultyDesc')}</p>
          <WeightDifficultySlider />
        </section>

        <section className="form-section">
          <h3 className="form-section__title">{t('auth.unitSettings')}</h3>
          <UnitSelector
            unitHeight={draftUnitHeight}
            unitWeight={draftUnitWeight}
            onUnitHeightChange={setDraftUnitHeight}
            onUnitWeightChange={setDraftUnitWeight}
          />
          <button
            type="button"
            className="btn btn--primary btn--block"
            style={{ marginTop: 'var(--space-md)' }}
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <span className="btn__spinner" aria-hidden /> : t('actions.save')}
          </button>
        </section>
        <section className="form-section">
          <h3 className="form-section__title">{t('settings.theme')}</h3>
          <ThemeSwitch />
        </section>

        <section className="form-section">
          <h3 className="form-section__title">{t('settings.restDuration')}</h3>
          <p className="form-section__desc">{t('settings.restDurationDesc')}</p>
          <div className="settings-rest-duration">
            <div
              className="settings-rest-duration__controls"
              role="group"
              aria-label={t('settings.restDuration')}
            >
              <div className="settings-rest-duration__unit">
                <NumericStepper
                  id="settings-rest-minutes"
                  value={restParts.minutes}
                  onChange={(next) => {
                    if (next == null) return;
                    setRestDurationSeconds(
                      restDurationFromParts(next, restParts.seconds)
                    );
                  }}
                  min={0}
                  max={REST_DURATION.maxMinutes}
                  step={REST_DURATION.minuteStep}
                  size="compact"
                  unit={t('settings.restDurationMinutes')}
                  ariaLabel={t('settings.restDurationMinutes')}
                  allowManualInput
                />
              </div>
              <div className="settings-rest-duration__unit">
                <NumericStepper
                  id="settings-rest-seconds"
                  value={restParts.seconds}
                  onChange={(next) => {
                    if (next == null) return;
                    setRestDurationSeconds(
                      restDurationFromParts(restParts.minutes, next)
                    );
                  }}
                  min={0}
                  max={60 - REST_DURATION.secondStep}
                  step={REST_DURATION.secondStep}
                  size="compact"
                  unit={t('settings.restDurationSeconds')}
                  ariaLabel={t('settings.restDurationSeconds')}
                  allowManualInput
                />
              </div>
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3 className="form-section__title">{t('settings.voiceCoach')}</h3>
          <p className="form-section__desc">{t('settings.voiceCoachDesc')}</p>
          <div className="settings-voice-coach">
            <label className="settings-voice-coach__row">
              <input
                type="checkbox"
                checked={voiceCoachEnabled}
                onChange={(e) => setVoiceCoachEnabled(e.target.checked)}
              />
              <span>{t('settings.voiceCoachEnable')}</span>
            </label>
            <label className="settings-voice-coach__row">
              <input
                type="checkbox"
                checked={voiceCoachOneMore}
                onChange={(e) => setVoiceCoachOneMore(e.target.checked)}
                disabled={!voiceCoachEnabled}
              />
              <span>{t('settings.voiceCoachOneMore')}</span>
            </label>
            <label className="settings-voice-coach__row">
              <input
                type="checkbox"
                checked={voiceCoachAutoAfterRest}
                onChange={(e) => setVoiceCoachAutoAfterRest(e.target.checked)}
                disabled={!voiceCoachEnabled}
              />
              <span>{t('settings.voiceCoachAutoAfterRest')}</span>
            </label>
            <label className="settings-voice-coach__row">
              <input
                type="checkbox"
                checked={voiceRestTipsEnabled}
                onChange={(e) => setVoiceRestTipsEnabled(e.target.checked)}
                disabled={!voiceCoachEnabled}
              />
              <span>{t('settings.voiceRestTips')}</span>
            </label>

            <div
              className="settings-voice-coach__voice"
              role="radiogroup"
              aria-label={t('settings.voiceCoachVoice')}
            >
              <span className="settings-voice-coach__reps-label">{t('settings.voiceCoachVoice')}</span>
              <p className="settings-voice-coach__voice-desc">{t('settings.voiceCoachVoiceDesc')}</p>
              {([
                { value: 'male' as VoiceCoachVoice, labelKey: 'settings.voiceCoachVoiceMale' },
                { value: 'female' as VoiceCoachVoice, labelKey: 'settings.voiceCoachVoiceFemale' },
              ]).map((option) => {
                const selected =
                  (voiceCoachVoice ?? DEFAULT_VOICE_COACH_VOICE) === option.value;
                return (
                  <div key={option.value} className="settings-voice-coach__voice-option">
                    <label className="settings-voice-coach__row">
                      <input
                        type="radio"
                        name="voice-coach-voice"
                        value={option.value}
                        checked={selected}
                        disabled={!voiceCoachEnabled}
                        onChange={() => setVoiceCoachVoice(option.value)}
                      />
                      <span>{t(option.labelKey)}</span>
                    </label>
                    <button
                      type="button"
                      className="btn btn--secondary settings-voice-coach__preview"
                      disabled={!voiceCoachEnabled}
                      onClick={() => {
                        const audio = new Audio(voiceCoachPreviewSampleUrl(option.value));
                        void audio.play().catch(() => undefined);
                      }}
                    >
                      {t('settings.voiceCoachVoicePreview')}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="settings-voice-coach__reps">
              <span className="settings-voice-coach__reps-label">{t('settings.voiceCoachTargetReps')}</span>
              <div className="settings-voice-coach__reps-controls" role="group" aria-label={t('settings.voiceCoachTargetReps')}>
                <button
                  type="button"
                  className="btn btn--secondary"
                  disabled={!voiceCoachEnabled || voiceCoachTargetReps <= 1}
                  onClick={() => setVoiceCoachTargetReps(Math.max(1, voiceCoachTargetReps - 1))}
                >
                  −
                </button>
                <strong>{voiceCoachTargetReps}</strong>
                <button
                  type="button"
                  className="btn btn--secondary"
                  disabled={!voiceCoachEnabled || voiceCoachTargetReps >= 30}
                  onClick={() => setVoiceCoachTargetReps(Math.min(30, voiceCoachTargetReps + 1))}
                >
                  +
                </button>
              </div>
            </div>
            <div className="settings-voice-coach__reps">
              <span className="settings-voice-coach__reps-label">{t('settings.voiceCoachCountInterval')}</span>
              <div
                className="settings-voice-coach__reps-controls"
                role="group"
                aria-label={t('settings.voiceCoachCountInterval')}
              >
                <button
                  type="button"
                  className="btn btn--secondary"
                  disabled={!voiceCoachEnabled || voiceCoachRepGapMs <= VOICE_COACH_REP_GAP.minMs}
                  onClick={() =>
                    setVoiceCoachRepGapMs(
                      clampVoiceCoachRepGapMs(voiceCoachRepGapMs - VOICE_COACH_REP_GAP.stepMs)
                    )
                  }
                >
                  −
                </button>
                <strong>
                  {(clampVoiceCoachRepGapMs(voiceCoachRepGapMs) / 1000).toFixed(1)}
                  {t('settings.voiceCoachCountIntervalUnit')}
                </strong>
                <button
                  type="button"
                  className="btn btn--secondary"
                  disabled={!voiceCoachEnabled || voiceCoachRepGapMs >= VOICE_COACH_REP_GAP.maxMs}
                  onClick={() =>
                    setVoiceCoachRepGapMs(
                      clampVoiceCoachRepGapMs(voiceCoachRepGapMs + VOICE_COACH_REP_GAP.stepMs)
                    )
                  }
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </section>

        <ProUpgradeCard />
      </div>
    </PageShell>
  );
}
