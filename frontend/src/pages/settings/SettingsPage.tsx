import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ExperienceLevel, Gender, LocationVisibility, WorkoutGoal } from '@machinefit/shared';
import {
  REST_DURATION,
  restDurationFromParts,
  restDurationParts,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { BodyMetricsFields } from '@/components/settings/BodyMetricsFields/BodyMetricsFields';
import { ExperienceSelector } from '@/components/settings/ExperienceSelector/ExperienceSelector';
import { GenderPicker } from '@/components/settings/GenderPicker/GenderPicker';
import { HomeGymField, type HomeGymValue } from '@/components/settings/HomeGymField/HomeGymField';
import { ProfileSummaryCard } from '@/components/settings/ProfileSummaryCard/ProfileSummaryCard';
import { UnitSelector } from '@/components/settings/UnitSelector/UnitSelector';
import { WorkoutGoalSelector } from '@/components/settings/WorkoutGoalSelector/WorkoutGoalSelector';
import { WeightDifficultySlider } from '@/components/settings/WeightDifficultySlider/WeightDifficultySlider';
import {
  emptyLocationValue,
  LocationPicker,
  type LocationPickerValue,
} from '@/components/location/LocationPicker/LocationPicker';
import { ProUpgradeCard } from '@/components/pro/ProUpgradeCard/ProUpgradeCard';
import { ScrollPicker } from '@/components/form/ScrollPicker/ScrollPicker';
import { DEFAULT_AGE, DEFAULT_HEIGHT_CM, DEFAULT_WEIGHT_KG } from '@/constants/body-metrics-defaults';
import { locationApi, userApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { SETTINGS_DEFAULTS, useSettingsStore } from '@/store/settings.store';
import { useUIStore } from '@/store/ui.store';
import { useActiveGym } from '@/hooks/useActiveGym';
import { syncUserSettings } from '@/utils/syncUserSettings';
import { resolveHomeGymName } from '@/utils/resolveHomeGymName';
import {
  clampVoiceCoachOneMoreCount,
  clampVoiceCoachRepGapMs,
  VOICE_COACH_ONE_MORE,
  VOICE_COACH_REP_GAP,
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
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const showToast = useUIStore((s) => s.showToast);
  const { activeGym, gyms } = useActiveGym();
  const unitHeight = useSettingsStore((s) => s.unitHeight);
  const unitWeight = useSettingsStore((s) => s.unitWeight);
  const setUnitHeight = useSettingsStore((s) => s.setUnitHeight);
  const setUnitWeight = useSettingsStore((s) => s.setUnitWeight);
  const voiceCoachEnabled = useSettingsStore((s) => s.voiceCoachEnabled);
  const voiceCoachTargetReps = useSettingsStore((s) => s.voiceCoachTargetReps);
  const voiceCoachOneMore = useSettingsStore((s) => s.voiceCoachOneMore);
  const voiceCoachOneMoreCount = useSettingsStore((s) => s.voiceCoachOneMoreCount);
  const voiceCoachAutoAfterRest = useSettingsStore((s) => s.voiceCoachAutoAfterRest);
  const voiceRestTipsEnabled = useSettingsStore((s) => s.voiceRestTipsEnabled);
  const voiceCoachRepGapMs = useSettingsStore((s) => s.voiceCoachRepGapMs);
  const restDurationSeconds = useSettingsStore((s) => s.restDurationSeconds);
  const setVoiceCoachEnabled = useSettingsStore((s) => s.setVoiceCoachEnabled);
  const setVoiceCoachTargetReps = useSettingsStore((s) => s.setVoiceCoachTargetReps);
  const setVoiceCoachOneMore = useSettingsStore((s) => s.setVoiceCoachOneMore);
  const setVoiceCoachOneMoreCount = useSettingsStore((s) => s.setVoiceCoachOneMoreCount);
  const setVoiceCoachAutoAfterRest = useSettingsStore((s) => s.setVoiceCoachAutoAfterRest);
  const setVoiceRestTipsEnabled = useSettingsStore((s) => s.setVoiceRestTipsEnabled);
  const setVoiceCoachRepGapMs = useSettingsStore((s) => s.setVoiceCoachRepGapMs);
  const setRestDurationSeconds = useSettingsStore((s) => s.setRestDurationSeconds);
  const resetSettings = useSettingsStore((s) => s.resetSettings);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

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
  const [locationDraft, setLocationDraft] = useState<LocationPickerValue>(emptyLocationValue());

  const meQuery = useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: async () => (await userApi.getMe()).data.data,
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!meQuery.data) return;
    updateUser(meQuery.data);
  }, [meQuery.data, updateUser]);

  const locationQuery = useQuery({
    queryKey: QUERY_KEYS.userLocation,
    queryFn: async () => (await locationApi.getMine()).data.data,
    enabled: Boolean(user),
  });

  useEffect(() => {
    const loc = locationQuery.data;
    if (!loc) return;
    setLocationDraft({
      countryCode: loc.countryCode,
      stateId: loc.stateId,
      cityId: loc.cityId,
      districtId: loc.districtId,
      districtName: loc.districtName ?? '',
      postalCode: loc.postalCode ?? '',
      latitude: loc.latitude ?? null,
      longitude: loc.longitude ?? null,
      visibility: loc.visibility ?? 'gym',
    });
  }, [locationQuery.data]);

  useEffect(() => {
    if (location.hash !== '#location-settings') return;
    const el = document.getElementById('location-settings');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, locationQuery.isFetched]);

  const locationGymSaveMutation = useMutation({
    mutationFn: async () => {
      if (locationDraft.countryCode) {
        await locationApi.upsertMine({
          countryCode: locationDraft.countryCode,
          stateId: locationDraft.stateId,
          cityId: locationDraft.cityId,
          districtId: locationDraft.districtId,
          districtName: locationDraft.districtName || null,
          postalCode: locationDraft.postalCode || null,
          latitude: locationDraft.latitude,
          longitude: locationDraft.longitude,
          visibility: locationDraft.visibility ?? 'gym',
        });
      } else {
        await locationApi.clearMine();
      }
      return userApi.updateMe({
        homeGymId: homeGym.homeGymId ?? null,
        homeGymName: homeGym.homeGymName?.trim() || null,
      });
    },
    onSuccess: async (res) => {
      const updatedUser = res.data.data as User;
      updateUser(updatedUser);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userLocation });
      showToast(t('location.locationGymSaved'), 'success');
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  const locationClearMutation = useMutation({
    mutationFn: async () => {
      await locationApi.clearMine();
      return userApi.updateMe({ homeGymId: null, homeGymName: null });
    },
    onSuccess: async (res) => {
      setLocationDraft(emptyLocationValue());
      setHomeGym({});
      const updatedUser = res.data.data as User;
      updateUser(updatedUser);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userLocation });
      showToast(t('location.cleared'), 'success');
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  useEffect(() => {
    if (user?.heightCm != null) setHeightCm(user.heightCm);
    else setHeightCm(DEFAULT_HEIGHT_CM);
    setWeightKg(user?.weightKg ?? DEFAULT_WEIGHT_KG);
    setAge(user?.age ?? DEFAULT_AGE);
    setGender(user?.gender);
    if (user?.experienceLevel) setExperienceLevel(user.experienceLevel);
    setWorkoutGoal(user?.workoutGoal);
    const resolvedName = resolveHomeGymName(user, activeGym, gyms);
    setHomeGym({
      homeGymId: user?.homeGymId,
      homeGymName: user?.homeGymName?.trim() || resolvedName || undefined,
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
    activeGym?.id,
    activeGym?.name,
    gyms,
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
          <p className="form-section__desc">{t('auth.profileExtrasGoalOnly')}</p>
          <div className="form-stack">
            <WorkoutGoalSelector value={workoutGoal} onChange={setWorkoutGoal} />
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

        <section className="form-section" id="location-settings">
          <h3 className="form-section__title">{t('location.locationGymTitle')}</h3>
          <p className="form-section__desc">{t('location.locationGymDesc')}</p>
          {!locationDraft.countryCode && (
            <p className="form-section__desc">{t('location.nudge')}</p>
          )}
          <LocationPicker
            value={locationDraft}
            onChange={setLocationDraft}
            showDistrict
            showGps
            required={false}
          />
          <div className="form-stack" style={{ marginTop: 'var(--space-md)' }}>
            <HomeGymField
              value={homeGym}
              onChange={setHomeGym}
              locationFilter={{
                countryCode: locationDraft.countryCode,
                stateId: locationDraft.stateId,
                cityId: locationDraft.cityId,
                districtId: locationDraft.districtId,
              }}
            />
          </div>
          <label className="location-picker__field" style={{ marginTop: 'var(--space-md)' }}>
            <span>{t('location.visibility')}</span>
            <select
              className="input"
              value={locationDraft.visibility ?? 'gym'}
              onChange={(e) =>
                setLocationDraft({
                  ...locationDraft,
                  visibility: e.target.value as LocationVisibility,
                })
              }
            >
              <option value="hidden">{t('location.visibilityHidden')}</option>
              <option value="country">{t('location.visibilityCountry')}</option>
              <option value="city">{t('location.visibilityCity')}</option>
              <option value="gym">{t('location.visibilityGym')}</option>
            </select>
          </label>
          <div className="form-stack" style={{ marginTop: 'var(--space-md)' }}>
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={() => locationGymSaveMutation.mutate()}
              disabled={
                locationGymSaveMutation.isPending ||
                (!locationDraft.countryCode && !homeGym.homeGymId && !homeGym.homeGymName)
              }
            >
              {locationGymSaveMutation.isPending
                ? t('actions.save')
                : t('location.locationGymSave')}
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--block"
              onClick={() => locationClearMutation.mutate()}
              disabled={
                locationClearMutation.isPending ||
                (!locationQuery.data?.isSet && !homeGym.homeGymId && !homeGym.homeGymName)
              }
            >
              {t('location.clear')}
            </button>
          </div>
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
          <h3 className="form-section__title">{t('settings.restDuration')}</h3>
          <p className="form-section__desc">{t('settings.restDurationDesc')}</p>
          <div
            className="body-metrics-inline"
            role="group"
            aria-label={t('settings.restDuration')}
          >
            <div className="body-metrics-inline__grid body-metrics-inline__grid--2">
              <div className="body-metrics-inline__cell">
                <span className="body-metrics-inline__label">
                  {t('settings.restDurationMinutesLabel')}
                  <span className="body-metrics-inline__unit">
                    {t('settings.restDurationMinutes')}
                  </span>
                </span>
                <ScrollPicker
                  value={restParts.minutes}
                  onChange={(next) =>
                    setRestDurationSeconds(restDurationFromParts(next, restParts.seconds))
                  }
                  min={0}
                  max={REST_DURATION.maxMinutes}
                  step={REST_DURATION.minuteStep}
                  defaultValue={Math.floor(REST_DURATION.defaultSeconds / 60)}
                  ariaLabel={t('settings.restDurationMinutes')}
                  formatValue={(value) => String(value).padStart(2, '0')}
                />
              </div>
              <div className="body-metrics-inline__cell">
                <span className="body-metrics-inline__label">
                  {t('settings.restDurationSecondsLabel')}
                  <span className="body-metrics-inline__unit">
                    {t('settings.restDurationSeconds')}
                  </span>
                </span>
                <ScrollPicker
                  value={restParts.seconds}
                  onChange={(next) =>
                    setRestDurationSeconds(restDurationFromParts(restParts.minutes, next))
                  }
                  min={0}
                  max={60 - REST_DURATION.secondStep}
                  step={REST_DURATION.secondStep}
                  defaultValue={REST_DURATION.defaultSeconds % 60}
                  ariaLabel={t('settings.restDurationSeconds')}
                  formatValue={(value) => String(value).padStart(2, '0')}
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
              className={`body-metrics-inline${
                !voiceCoachEnabled ? ' body-metrics-inline--disabled' : ''
              }`}
              role="group"
              aria-label={t('settings.voiceCoach')}
            >
              <div className="body-metrics-inline__grid">
                <div className="body-metrics-inline__cell">
                  <span className="body-metrics-inline__label">
                    {t('settings.voiceCoachTargetReps')}
                    <span className="body-metrics-inline__unit">
                      {t('settings.voiceCoachTargetRepsUnit')}
                    </span>
                  </span>
                  <ScrollPicker
                    value={voiceCoachTargetReps}
                    onChange={setVoiceCoachTargetReps}
                    min={1}
                    max={30}
                    step={1}
                    defaultValue={12}
                    ariaLabel={t('settings.voiceCoachTargetReps')}
                    formatValue={(value) => String(value)}
                  />
                </div>
                <div className="body-metrics-inline__cell">
                  <span className="body-metrics-inline__label">
                    {t('settings.voiceCoachCountInterval')}
                    <span className="body-metrics-inline__unit">
                      {t('settings.voiceCoachCountIntervalUnit')}
                    </span>
                  </span>
                  <ScrollPicker
                    value={clampVoiceCoachRepGapMs(voiceCoachRepGapMs) / 1000}
                    onChange={(sec) =>
                      setVoiceCoachRepGapMs(clampVoiceCoachRepGapMs(sec * 1000))
                    }
                    min={VOICE_COACH_REP_GAP.minMs / 1000}
                    max={VOICE_COACH_REP_GAP.maxMs / 1000}
                    step={VOICE_COACH_REP_GAP.stepMs / 1000}
                    defaultValue={VOICE_COACH_REP_GAP.defaultMs / 1000}
                    ariaLabel={t('settings.voiceCoachCountInterval')}
                    formatValue={(value) => value.toFixed(1)}
                  />
                </div>
                <div className="body-metrics-inline__cell">
                  <span className="body-metrics-inline__label">
                    {t('settings.voiceCoachOneMoreCount')}
                    <span className="body-metrics-inline__unit">
                      {t('settings.voiceCoachOneMoreCountUnit')}
                    </span>
                  </span>
                  <ScrollPicker
                    value={clampVoiceCoachOneMoreCount(voiceCoachOneMoreCount)}
                    onChange={setVoiceCoachOneMoreCount}
                    min={VOICE_COACH_ONE_MORE.minCount}
                    max={VOICE_COACH_ONE_MORE.maxCount}
                    step={VOICE_COACH_ONE_MORE.step}
                    defaultValue={VOICE_COACH_ONE_MORE.defaultCount}
                    ariaLabel={t('settings.voiceCoachOneMoreCount')}
                    formatValue={(value) => String(value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3 className="form-section__title">{t('settings.reset')}</h3>
          <p className="form-section__desc">{t('settings.resetDesc')}</p>
          <button
            type="button"
            className="btn btn--danger btn--block"
            onClick={() => setResetConfirmOpen(true)}
          >
            {t('settings.reset')}
          </button>
        </section>

        <ProUpgradeCard />
      </div>

      <ConfirmDialog
        open={resetConfirmOpen}
        title={t('settings.resetConfirmTitle')}
        message={t('settings.resetConfirmMessage')}
        confirmLabel={t('settings.resetConfirm')}
        confirmVariant="danger"
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={() => {
          resetSettings();
          setDraftUnitHeight(SETTINGS_DEFAULTS.unitHeight);
          setDraftUnitWeight(SETTINGS_DEFAULTS.unitWeight);
          setResetConfirmOpen(false);
          showToast(t('settings.resetDone'), 'success');
        }}
      />
    </PageShell>
  );
}
