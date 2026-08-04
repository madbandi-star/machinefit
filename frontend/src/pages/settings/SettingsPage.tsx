import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ExperienceLevel, Gender, LocationVisibility, WorkoutGoal } from '@machinefit/shared';
import {
  REST_DURATION,
  restDurationFromParts,
  restDurationParts,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Icon } from '@/components/icons/Icon';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { BodyMetricsFields } from '@/components/settings/BodyMetricsFields/BodyMetricsFields';
import { ExperienceSelector } from '@/components/settings/ExperienceSelector/ExperienceSelector';
import { GenderPicker } from '@/components/settings/GenderPicker/GenderPicker';
import { HomeGymField, type HomeGymValue } from '@/components/settings/HomeGymField/HomeGymField';
import { SettingsCollapsibleSection } from '@/components/settings/SettingsCollapsibleSection/SettingsCollapsibleSection';
import { UnitSelector } from '@/components/settings/UnitSelector/UnitSelector';
import { WorkoutGoalSelector } from '@/components/settings/WorkoutGoalSelector/WorkoutGoalSelector';
import { WeightDifficultySlider } from '@/components/settings/WeightDifficultySlider/WeightDifficultySlider';
import {
  emptyLocationValue,
  LocationPicker,
  type LocationPickerValue,
} from '@/components/location/LocationPicker/LocationPicker';
import { ScrollPicker } from '@/components/form/ScrollPicker/ScrollPicker';
import { VoiceCoachPickerGrid } from '@/components/recommendation/VoiceCoachPickerGrid/VoiceCoachPickerGrid';
import { DEFAULT_AGE, DEFAULT_HEIGHT_CM, DEFAULT_WEIGHT_KG } from '@/constants/body-metrics-defaults';
import { authApi, locationApi, userApi, userGymApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useGymStore } from '@/store/gym.store';
import { SETTINGS_DEFAULTS, useSettingsStore } from '@/store/settings.store';
import { useUIStore } from '@/store/ui.store';
import { useActiveGym } from '@/hooks/useActiveGym';
import { syncUserSettings } from '@/utils/syncUserSettings';
import { clearGymScope } from '@/utils/syncGymScope';
import { resolveHomeGymName } from '@/utils/resolveHomeGymName';
import { fetchDefaultMemberId } from '@/utils/gymMemberDefault';
import { VOICE_COACH_VOLUME } from '@/utils/voiceCoachVolume';
import { VOICE_COUNT_MODES } from '@/utils/aiCountPace';
import {
  clampVoiceCoachPrepCount,
  normalizeVoiceCoachPack,
  VOICE_COACH_PACKS,
  VOICE_COACH_PREP_COUNTS,
} from '@/utils/voiceCoach';
import {
  VOICE_HOLD_FLOW_MODES,
} from '@/utils/voiceHold';
import type { User } from '@machinefit/shared';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';
import '@/styles/home.css';
import '@/styles/phase4.css';
import '@/styles/recommendation.css';
import '@/styles/legal.css';

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
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const showToast = useUIStore((s) => s.showToast);
  const { activeGym, gyms } = useActiveGym();
  const setActiveGymId = useGymStore((s) => s.setActiveGymId);
  const setActiveMemberId = useGymStore((s) => s.setActiveMemberId);
  const unitHeight = useSettingsStore((s) => s.unitHeight);
  const unitWeight = useSettingsStore((s) => s.unitWeight);
  const setUnitHeight = useSettingsStore((s) => s.setUnitHeight);
  const setUnitWeight = useSettingsStore((s) => s.setUnitWeight);
  const voiceCoachEnabled = useSettingsStore((s) => s.voiceCoachEnabled);
  const voiceCoachVolume = useSettingsStore((s) => s.voiceCoachVolume);
  const voiceCoachTargetReps = useSettingsStore((s) => s.voiceCoachTargetReps);
  const voiceCoachOneMore = useSettingsStore((s) => s.voiceCoachOneMore);
  const voiceCoachOneMoreCount = useSettingsStore((s) => s.voiceCoachOneMoreCount);
  const voiceCoachAutoAfterRest = useSettingsStore((s) => s.voiceCoachAutoAfterRest);
  const voiceRestTipsEnabled = useSettingsStore((s) => s.voiceRestTipsEnabled);
  const voiceCoachRepGapMs = useSettingsStore((s) => s.voiceCoachRepGapMs);
  const voiceCoachPrepCount = useSettingsStore((s) => s.voiceCoachPrepCount);
  const voiceCoachPack = useSettingsStore((s) => s.voiceCoachPack);
  const voiceCountMode = useSettingsStore((s) => s.voiceCountMode);
  const voiceCoachFlowMode = useSettingsStore((s) => s.voiceCoachFlowMode);
  const voiceHoldDurationSec = useSettingsStore((s) => s.voiceHoldDurationSec);
  const restDurationSeconds = useSettingsStore((s) => s.restDurationSeconds);
  const restTimerAfterAllSetsComplete = useSettingsStore(
    (s) => s.restTimerAfterAllSetsComplete
  );
  const workoutFullscreenDisplay = useSettingsStore((s) => s.workoutFullscreenDisplay);
  const setWorkoutFullscreenDisplay = useSettingsStore((s) => s.setWorkoutFullscreenDisplay);
  const setVoiceCoachEnabled = useSettingsStore((s) => s.setVoiceCoachEnabled);
  const setVoiceCoachVolume = useSettingsStore((s) => s.setVoiceCoachVolume);
  const setVoiceCoachTargetReps = useSettingsStore((s) => s.setVoiceCoachTargetReps);
  const setVoiceCoachOneMore = useSettingsStore((s) => s.setVoiceCoachOneMore);
  const setVoiceCoachOneMoreCount = useSettingsStore((s) => s.setVoiceCoachOneMoreCount);
  const setVoiceCoachAutoAfterRest = useSettingsStore((s) => s.setVoiceCoachAutoAfterRest);
  const setVoiceRestTipsEnabled = useSettingsStore((s) => s.setVoiceRestTipsEnabled);
  const setVoiceCoachRepGapMs = useSettingsStore((s) => s.setVoiceCoachRepGapMs);
  const setVoiceCoachPrepCount = useSettingsStore((s) => s.setVoiceCoachPrepCount);
  const setVoiceCoachPack = useSettingsStore((s) => s.setVoiceCoachPack);
  const setVoiceCountMode = useSettingsStore((s) => s.setVoiceCountMode);
  const setVoiceCoachFlowMode = useSettingsStore((s) => s.setVoiceCoachFlowMode);
  const setVoiceHoldDurationSec = useSettingsStore((s) => s.setVoiceHoldDurationSec);
  const setRestDurationSeconds = useSettingsStore((s) => s.setRestDurationSeconds);
  const setRestTimerAfterAllSetsComplete = useSettingsStore(
    (s) => s.setRestTimerAfterAllSetsComplete
  );
  const resetSettings = useSettingsStore((s) => s.resetSettings);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(Boolean(user?.marketingOptIn));

  useEffect(() => {
    if (user?.marketingOptIn != null) {
      setMarketingOptIn(Boolean(user.marketingOptIn));
    }
  }, [user?.marketingOptIn]);

  const marketingMutation = useMutation({
    mutationFn: (optIn: boolean) => authApi.updateMarketingPref(optIn),
    onSuccess: (res) => {
      const next = Boolean(res.data.data?.marketingOptIn);
      setMarketingOptIn(next);
      updateUser({ marketingOptIn: next });
      showToast(t('settings.marketingSaved'), 'success');
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  const locationConsentMutation = useMutation({
    mutationFn: (optIn: boolean) =>
      import('@/api/compliance.api').then(({ complianceApi }) =>
        complianceApi.updateConsents({ locationOptIn: optIn })
      ),
    onSuccess: (res) => {
      const next = Boolean(res.data.data?.locationOptIn);
      updateUser({ locationOptIn: next });
      showToast(t('compliance.rights.saved'), 'success');
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => authApi.deactivateAccount(),
    onSuccess: () => {
      clearAuth();
      clearGymScope();
      showToast(t('settings.accountDeleted'), 'success');
      navigate(ROUTES.HOME, { replace: true });
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  const [heightCm, setHeightCm] = useState(user?.heightCm ?? DEFAULT_HEIGHT_CM);
  const [weightKg, setWeightKg] = useState(user?.weightKg ?? DEFAULT_WEIGHT_KG);
  const [age, setAge] = useState(user?.age ?? DEFAULT_AGE);
  const [gender, setGender] = useState<Gender | undefined>(user?.gender);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    user?.experienceLevel ?? 'intermediate'
  );
  const [workoutGoal, setWorkoutGoal] = useState<WorkoutGoal | undefined>(user?.workoutGoal);
  const [workoutGoalInvalid, setWorkoutGoalInvalid] = useState(false);
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
    const hash = location.hash;
    if (hash !== '#location-settings' && hash !== '#body-metrics') return;
    const id = hash.slice(1);
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    return () => window.clearTimeout(timer);
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
          // GPS coords require location_opt_in; otherwise save region hierarchy only.
          latitude: user?.locationOptIn ? locationDraft.latitude : null,
          longitude: user?.locationOptIn ? locationDraft.longitude : null,
          visibility: locationDraft.visibility ?? 'gym',
        });
      } else {
        await locationApi.clearMine();
      }
      const res = await userApi.updateMe({
        homeGymId: homeGym.homeGymId ?? null,
        homeGymName: homeGym.homeGymName?.trim() || null,
      });

      // Home header reads active user_gyms.name — keep it in sync with settings home gym.
      const nextName = homeGym.homeGymName?.trim() || '';
      if (nextName && activeGym) {
        const match = gyms.find((g) => g.name.trim() === nextName);
        if (match && match.id !== activeGym.id) {
          await userGymApi.select(match.id);
          setActiveGymId(match.id);
          const defaultMemberId = await fetchDefaultMemberId(match.id);
          setActiveMemberId(defaultMemberId);
        } else if (activeGym.name.trim() !== nextName) {
          await userGymApi.update(activeGym.id, { name: nextName });
        }
      }

      return res;
    },
    onSuccess: async (res) => {
      const updatedUser = res.data.data as User;
      updateUser(updatedUser);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userLocation });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userGyms });
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
    setWorkoutGoalInvalid(false);
    const resolvedName = resolveHomeGymName(user, activeGym, gyms);
    setHomeGym({
      // Prefer currently selected gym over stale signup profile name.
      homeGymId: activeGym ? undefined : user?.homeGymId,
      homeGymName: resolvedName || undefined,
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
      <div className="settings-stack">
        <SettingsCollapsibleSection
          id="body-metrics"
          title={t('auth.bodyMetrics')}
          description={t('auth.bodyMetricsDesc')}
        >
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
            <WorkoutGoalSelector
              value={workoutGoal}
              allowEmpty
              invalid={workoutGoalInvalid}
              onChange={(value) => {
                setWorkoutGoal(value);
                if (value) setWorkoutGoalInvalid(false);
              }}
            />
          </div>
          <button
            type="button"
            className="btn btn--primary btn--block"
            style={{ marginTop: 'var(--space-md)' }}
            onClick={() => {
              if (!workoutGoal) {
                setWorkoutGoalInvalid(true);
                showToast(t('auth.workoutGoalRequired'), 'error');
                return;
              }
              mutation.mutate();
            }}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <span className="btn__spinner" aria-hidden /> : t('actions.save')}
          </button>
        </SettingsCollapsibleSection>

        <SettingsCollapsibleSection id="location-settings" title={t('location.locationGymTitle')}>
          <p className="form-section__desc">{t('location.locationGymDesc')}</p>
          {!locationDraft.countryCode && (
            <p className="form-section__desc">{t('location.nudge')}</p>
          )}
          <LocationPicker
            value={locationDraft}
            onChange={setLocationDraft}
            showDistrict
            showGps
            locationOptIn={Boolean(user?.locationOptIn)}
            onNeedLocationConsent={() =>
              showToast(t('compliance.rights.locationConsentRequired'), 'error')
            }
            beforeGps={
              <label className="checkbox-label location-picker__consent">
                <input
                  type="checkbox"
                  checked={Boolean(user?.locationOptIn)}
                  disabled={locationConsentMutation.isPending}
                  onChange={(e) => locationConsentMutation.mutate(e.target.checked)}
                />
                <span>
                  {t('compliance.rights.locationOptIn')} (
                  <a
                    href={`#${ROUTES.LEGAL_LOCATION}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(ROUTES.LEGAL_LOCATION);
                    }}
                  >
                    {t('legal.locationTitle')}
                  </a>
                  )
                </span>
              </label>
            }
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
                latitude: locationDraft.latitude,
                longitude: locationDraft.longitude,
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
        </SettingsCollapsibleSection>

        <SettingsCollapsibleSection id="voice-coach" title={t('settings.voiceCoach')}>
          <div className="settings-voice-coach">
            <label className="settings-voice-coach__row">
              <input
                type="checkbox"
                checked={voiceCoachEnabled}
                onChange={(e) => setVoiceCoachEnabled(e.target.checked)}
              />
              <span>{t('settings.voiceCoachEnable')}</span>
            </label>

            <div
              className={`settings-voice-coach__volume${
                !voiceCoachEnabled ? ' settings-voice-coach__volume--disabled' : ''
              }`}
            >
              <div className="settings-voice-coach__volume-header">
                <span id="settings-voice-coach-volume-label">
                  {t('settings.voiceCoachVolume')}
                </span>
                <span className="settings-voice-coach__volume-value" aria-live="polite">
                  {Math.round(voiceCoachVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                className="settings-voice-coach__volume-input"
                min={VOICE_COACH_VOLUME.min}
                max={VOICE_COACH_VOLUME.max}
                step={VOICE_COACH_VOLUME.step}
                value={voiceCoachVolume}
                disabled={!voiceCoachEnabled}
                onChange={(e) => setVoiceCoachVolume(parseFloat(e.target.value))}
                aria-labelledby="settings-voice-coach-volume-label"
                aria-valuemin={VOICE_COACH_VOLUME.min}
                aria-valuemax={VOICE_COACH_VOLUME.max}
                aria-valuenow={voiceCoachVolume}
                aria-valuetext={`${Math.round(voiceCoachVolume * 100)}%`}
              />
            </div>

            <fieldset
              className={`voice-coach-panel__mode${
                !voiceCoachEnabled ? ' voice-coach-panel__mode--disabled' : ''
              }`}
              disabled={!voiceCoachEnabled}
            >
              <legend className="voice-coach-panel__mode-legend">
                {t('settings.voiceCoachFlowMode')}
              </legend>
              <div className="voice-coach-panel__mode-options" role="radiogroup">
                {VOICE_HOLD_FLOW_MODES.map((mode) => (
                  <label key={mode} className="voice-coach-panel__mode-option">
                    <input
                      type="radio"
                      name="settings-voice-flow-mode"
                      value={mode}
                      checked={voiceCoachFlowMode === mode}
                      onChange={() => setVoiceCoachFlowMode(mode)}
                    />
                    <span>{t(`settings.voiceCoachFlowMode_${mode}`)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="settings-voice-coach__row">
              <input
                type="checkbox"
                checked={voiceCoachOneMore}
                onChange={(e) => setVoiceCoachOneMore(e.target.checked)}
                disabled={!voiceCoachEnabled || voiceCoachFlowMode === 'hold'}
              />
              <span>{t('settings.voiceCoachOneMore')}</span>
            </label>
            <label className="settings-voice-coach__row">
              <input
                type="checkbox"
                checked={voiceCoachFlowMode === 'count_hold'}
                onChange={(e) =>
                  setVoiceCoachFlowMode(e.target.checked ? 'count_hold' : 'count')
                }
                disabled={!voiceCoachEnabled || voiceCoachFlowMode === 'hold'}
              />
              <span>{t('settings.voiceCoachHoldAfterCount')}</span>
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

            <VoiceCoachPickerGrid
              flowMode={voiceCoachFlowMode}
              oneMoreEnabled={voiceCoachOneMore}
              targetReps={voiceCoachTargetReps}
              onTargetRepsChange={setVoiceCoachTargetReps}
              repGapMs={voiceCoachRepGapMs}
              onRepGapMsChange={setVoiceCoachRepGapMs}
              oneMoreCount={voiceCoachOneMoreCount}
              onOneMoreCountChange={setVoiceCoachOneMoreCount}
              holdDurationSec={voiceHoldDurationSec}
              onHoldDurationSecChange={setVoiceHoldDurationSec}
              disabled={!voiceCoachEnabled}
              recordsLayout
              labels="settings"
            />

            <fieldset
              className={`voice-coach-panel__mode${
                !voiceCoachEnabled ? ' voice-coach-panel__mode--disabled' : ''
              }`}
              disabled={!voiceCoachEnabled}
            >
              <legend className="voice-coach-panel__mode-legend">
                {t('settings.voiceCoachPack')}
              </legend>
              <div className="voice-coach-panel__mode-options" role="radiogroup">
                {VOICE_COACH_PACKS.map((pack) => (
                  <label key={pack} className="voice-coach-panel__mode-option">
                    <input
                      type="radio"
                      name="settings-voice-coach-pack"
                      value={pack}
                      checked={normalizeVoiceCoachPack(voiceCoachPack) === pack}
                      onChange={() => setVoiceCoachPack(pack)}
                    />
                    <span>{t(`settings.voiceCoachPack_${pack}`)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset
              className={`voice-coach-panel__mode${
                !voiceCoachEnabled ? ' voice-coach-panel__mode--disabled' : ''
              }`}
              disabled={!voiceCoachEnabled}
            >
              <legend className="voice-coach-panel__mode-legend">
                {t('settings.voiceCoachPrepCount')}
              </legend>
              <div className="voice-coach-panel__mode-options" role="radiogroup">
                {VOICE_COACH_PREP_COUNTS.map((count) => (
                  <label key={count} className="voice-coach-panel__mode-option">
                    <input
                      type="radio"
                      name="settings-voice-prep-count"
                      value={count}
                      checked={clampVoiceCoachPrepCount(voiceCoachPrepCount) === count}
                      onChange={() => setVoiceCoachPrepCount(count)}
                    />
                    <span>{t(`settings.voiceCoachPrepCount_${count}`)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {voiceCoachFlowMode !== 'hold' ? (
              <fieldset
                className={`voice-coach-panel__mode${
                  !voiceCoachEnabled ? ' voice-coach-panel__mode--disabled' : ''
                }`}
                disabled={!voiceCoachEnabled}
              >
                <legend className="voice-coach-panel__mode-legend">
                  {t('settings.voiceCountMode')}
                </legend>
                <div className="voice-coach-panel__mode-options" role="radiogroup">
                  {VOICE_COUNT_MODES.map((mode) => (
                    <label key={mode} className="voice-coach-panel__mode-option">
                      <input
                        type="radio"
                        name="settings-voice-count-mode"
                        value={mode}
                        checked={voiceCountMode === mode}
                        onChange={() => setVoiceCountMode(mode)}
                      />
                      <span>{t(`settings.voiceCountMode_${mode}`)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

          </div>
        </SettingsCollapsibleSection>

        <SettingsCollapsibleSection
          title={t('settings.restDuration')}
          description={t('settings.restDurationDesc')}
        >
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
          <label className="settings-voice-coach__row" style={{ marginTop: '0.85rem' }}>
            <input
              type="checkbox"
              checked={restTimerAfterAllSetsComplete}
              onChange={(e) => setRestTimerAfterAllSetsComplete(e.target.checked)}
            />
            <span>{t('settings.restTimerAfterAllSetsComplete')}</span>
          </label>
          <p className="form-section__desc" style={{ marginTop: '0.35rem' }}>
            {t('settings.restTimerAfterAllSetsCompleteDesc')}
          </p>
          <label className="settings-voice-coach__row" style={{ marginTop: '0.85rem' }}>
            <input
              type="checkbox"
              checked={workoutFullscreenDisplay}
              onChange={(e) => setWorkoutFullscreenDisplay(e.target.checked)}
            />
            <span>{t('settings.workoutFullscreenDisplay')}</span>
          </label>
          <p className="form-section__desc" style={{ marginTop: '0.35rem' }}>
            {t('settings.workoutFullscreenDisplayDesc')}
          </p>
        </SettingsCollapsibleSection>

        <SettingsCollapsibleSection
          title={t('settings.weightDifficulty')}
          description={t('settings.weightDifficultyDesc')}
        >
          <WeightDifficultySlider />
        </SettingsCollapsibleSection>

        <SettingsCollapsibleSection title={t('auth.unitSettings')}>
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
        </SettingsCollapsibleSection>

        <section className="my-page-section" style={{ marginTop: 0 }}>
          <h3 className="my-page-section__title">{t('settings.accountSection')}</h3>
          <nav className="list-nav" aria-label={t('settings.accountSection')}>
            <Link to={ROUTES.LINKED_LOGINS} className="list-nav__item">
              <Icon name="shield" size={22} className="list-nav__icon" aria-hidden />
              <span className="list-nav__label">{t('settings.linkedLogins')}</span>
              <Icon name="chevronRight" size={18} className="list-nav__chevron" aria-hidden />
            </Link>
          </nav>
        </section>

        <SettingsCollapsibleSection
          title={t('settings.privacyLegal')}
          description={t('settings.privacyLegalDesc')}
          defaultExpanded
        >
          <label className="checkbox-label" style={{ marginBottom: '0.75rem' }}>
            <input
              type="checkbox"
              checked={marketingOptIn}
              disabled={marketingMutation.isPending}
              onChange={(e) => marketingMutation.mutate(e.target.checked)}
            />
            <span>{t('settings.marketingOptIn')}</span>
          </label>
          <p className="form-section__desc">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => navigate(ROUTES.PRIVACY_RIGHTS)}
            >
              {t('compliance.rights.title')}
            </button>
          </p>
          <p className="form-section__desc">
            <a href={`#${ROUTES.TERMS}`} onClick={(e) => { e.preventDefault(); navigate(ROUTES.TERMS); }}>
              {t('legal.termsTitle')}
            </a>
            {' · '}
            <a href={`#${ROUTES.PRIVACY}`} onClick={(e) => { e.preventDefault(); navigate(ROUTES.PRIVACY); }}>
              {t('legal.privacyTitle')}
            </a>
            {' · '}
            <a
              href={`#${ROUTES.LEGAL_LOCATION}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(ROUTES.LEGAL_LOCATION);
              }}
            >
              {t('legal.locationTitle')}
            </a>
            {' · '}
            <a
              href={`#${ROUTES.SUPPORT}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(ROUTES.SUPPORT);
              }}
            >
              {t('support.title')}
            </a>
          </p>
        </SettingsCollapsibleSection>

        <SettingsCollapsibleSection title={t('settings.reset')} description={t('settings.resetDesc')}>
          <button
            type="button"
            className="btn btn--danger btn--block"
            onClick={() => setResetConfirmOpen(true)}
          >
            {t('settings.reset')}
          </button>
        </SettingsCollapsibleSection>

        <SettingsCollapsibleSection
          title={t('settings.deleteAccount')}
          description={t('settings.deleteAccountDesc')}
        >
          <button
            type="button"
            className="btn btn--danger btn--block"
            disabled={deleteAccountMutation.isPending}
            onClick={() => setDeleteConfirmOpen(true)}
          >
            {t('settings.deleteAccount')}
          </button>
        </SettingsCollapsibleSection>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('settings.deleteAccountConfirmTitle')}
        message={t('settings.deleteAccountConfirmMessage')}
        confirmLabel={t('settings.deleteAccountConfirm')}
        confirmVariant="danger"
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false);
          deleteAccountMutation.mutate();
        }}
      />

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
