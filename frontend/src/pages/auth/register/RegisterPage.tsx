import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import type { ExperienceLevel, Gender, UnitHeight, UnitWeight, WorkoutGoal } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { RegisterEmailField, type EmailDomainPreset } from '@/components/auth/RegisterEmailField/RegisterEmailField';
import {
  emptyLocationValue,
  LocationPicker,
  type LocationPickerValue,
} from '@/components/location/LocationPicker/LocationPicker';
import { BodyMetricsFields } from '@/components/settings/BodyMetricsFields/BodyMetricsFields';
import { ExperienceSelector } from '@/components/settings/ExperienceSelector/ExperienceSelector';
import { GenderPicker } from '@/components/settings/GenderPicker/GenderPicker';
import { HomeGymField, type HomeGymValue } from '@/components/settings/HomeGymField/HomeGymField';
import { WorkoutGoalSelector } from '@/components/settings/WorkoutGoalSelector/WorkoutGoalSelector';
import {
  HEIGHT_UNIT_OPTIONS,
  UnitPicker,
  WEIGHT_UNIT_OPTIONS,
} from '@/components/settings/UnitPicker/UnitPicker';
import { authApi, locationApi } from '@/api';
import { friendsApi } from '@/api/friends.api';
import { AlertDialog } from '@/components/feedback/AlertDialog/AlertDialog';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { syncUserSettings } from '@/utils/syncUserSettings';
import { syncGymScopeAfterAuth } from '@/utils/syncGymScope';
import { resolveRegisterErrorMessage } from '@/utils/getApiErrorMessage';
import {
  buildDemoEmail,
  DEMO_HOME_GYM_NAME,
  DEMO_REGISTER_PASSWORD,
  getDemoRegisterSlot,
  markDemoRegisterSlotUsed,
  normalizeEmailDomain,
} from '@/utils/demoRegisterDefaults';
import { isDemoAuthEnabled } from '@/utils/demoAuthMode';
import {
  getMissingRegisterFields,
  type RegisterFormField,
} from '@/utils/validateRegisterForm';
import { ROUTES } from '@/constants/routes';
import { LEGAL_DOC_VERSION, type User, type AuthTokens } from '@machinefit/shared';
import '@/styles/components.css';
import '@/styles/legal.css';

const REFERRAL_STORAGE_KEY = 'mf_referral_code';

function formatMissingFieldLabels(
  fields: RegisterFormField[],
  t: (key: string) => string
): string {
  return fields.map((field) => t(`auth.registerFieldLabels.${field}`)).join(', ');
}

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const showToast = useUIStore((s) => s.showToast);

  const referralFromUrl = (searchParams.get('ref') || '').trim();
  useEffect(() => {
    if (referralFromUrl) {
      try {
        sessionStorage.setItem(REFERRAL_STORAGE_KEY, referralFromUrl);
      } catch {
        /* ignore */
      }
    }
  }, [referralFromUrl]);

  const demoAuth = isDemoAuthEnabled();
  const demoSlot = useMemo(() => getDemoRegisterSlot(), []);

  const [emailLocal, setEmailLocal] = useState(demoSlot.emailLocal);
  const [emailDomainPreset, setEmailDomainPreset] = useState<EmailDomainPreset>('gmail.com');
  const [emailCustomDomain, setEmailCustomDomain] = useState('');
  const [password, setPassword] = useState(demoAuth ? DEMO_REGISTER_PASSWORD : '');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeLocation, setAgreeLocation] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [displayName, setDisplayName] = useState(demoSlot.displayName);
  const [unitHeight, setUnitHeight] = useState<UnitHeight>('cm');
  const [unitWeight, setUnitWeight] = useState<UnitWeight>('kg');
  const [heightCm, setHeightCm] = useState<number | undefined>(undefined);
  const [weightKg, setWeightKg] = useState<number | undefined>(undefined);
  const [age, setAge] = useState<number | undefined>(undefined);
  const [gender, setGender] = useState<Gender>('male');
  const [workoutGoal, setWorkoutGoal] = useState<WorkoutGoal>('hypertrophy');
  const [locationDraft, setLocationDraft] = useState<LocationPickerValue>(emptyLocationValue());
  const [homeGym, setHomeGym] = useState<HomeGymValue>({ homeGymName: DEMO_HOME_GYM_NAME });
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('beginner');
  const [missingFields, setMissingFields] = useState<RegisterFormField[]>([]);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  const resolvedEmailDomain =
    emailDomainPreset === 'custom'
      ? normalizeEmailDomain(emailCustomDomain)
      : emailDomainPreset;
  const email = buildDemoEmail(emailLocal, resolvedEmailDomain);

  const mutation = useMutation({
    mutationFn: () =>
      authApi.register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        gender: gender!,
        unitHeight,
        unitWeight,
        heightCm: heightCm!,
        weightKg: weightKg!,
        age: age!,
        workoutGoal: workoutGoal!,
        homeGymId: homeGym.homeGymId,
        homeGymName: homeGym.homeGymName?.trim(),
        experienceLevel: experienceLevel!,
        agreeTerms: true,
        agreePrivacy: true,
        agreeMarketing,
        agreeLocation,
        legalVersion: LEGAL_DOC_VERSION,
      }),
    onSuccess: async (res) => {
      markDemoRegisterSlotUsed();
      const { user, tokens } = res.data.data as { user: User; tokens: AuthTokens };
      setAuth(user, tokens);
      syncUserSettings(user);
      syncGymScopeAfterAuth(user);

          if (locationDraft.countryCode) {
        try {
          await locationApi.upsertMine({
            countryCode: locationDraft.countryCode,
            stateId: locationDraft.stateId,
            cityId: locationDraft.cityId,
            districtId: locationDraft.districtId,
            districtName: locationDraft.districtName || null,
            postalCode: locationDraft.postalCode || null,
            latitude: agreeLocation ? locationDraft.latitude : null,
            longitude: agreeLocation ? locationDraft.longitude : null,
            visibility: locationDraft.visibility ?? 'gym',
          });
        } catch {
          showToast(t('location.saveFailed'), 'error');
        }
      }

      let referralCode = referralFromUrl;
      if (!referralCode) {
        try {
          referralCode = (sessionStorage.getItem(REFERRAL_STORAGE_KEY) || '').trim();
        } catch {
          referralCode = '';
        }
      }
      if (referralCode) {
        try {
          await friendsApi.applyInvite(referralCode);
          try {
            sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
          } catch {
            /* ignore */
          }
        } catch {
          /* invite apply is best-effort after signup */
        }
      }

      showToast(t('auth.accountCreated'), 'success');
      navigate(ROUTES.HOME, { replace: true });
    },
    onError: (error) => {
      setErrorDialog({
        open: true,
        message: resolveRegisterErrorMessage(error, t),
      });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const missing = getMissingRegisterFields({
      displayName,
      email,
      password,
      gender,
      heightCm,
      weightKg,
      age,
      workoutGoal,
      location: locationDraft,
      homeGym,
      experienceLevel,
    });

    if (missing.length > 0) {
      setMissingFields(missing);
      const fieldLabels = formatMissingFieldLabels(missing, t);
      showToast(t('auth.registerMissingFields', { fields: fieldLabels }), 'error');
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      showToast(t('auth.consentRequired'), 'error');
      return;
    }

    setMissingFields([]);
    mutation.mutate();
  };

  const hasError = (field: RegisterFormField) => missingFields.includes(field);

  return (
    <PageShell title={t('nav.register')}>
      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        {missingFields.length > 0 && (
          <div className="form-error-summary" role="alert">
            {t('auth.registerMissingFields', {
              fields: formatMissingFieldLabels(missingFields, t),
            })}
          </div>
        )}

        <input
          className={`input${hasError('displayName') ? ' input--invalid' : ''}`}
          type="text"
          placeholder={t('auth.displayNamePlaceholder')}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          minLength={2}
          autoComplete="name"
        />
        <RegisterEmailField
          localPart={emailLocal}
          domainPreset={emailDomainPreset}
          customDomain={emailCustomDomain}
          onLocalPartChange={setEmailLocal}
          onDomainPresetChange={setEmailDomainPreset}
          onCustomDomainChange={setEmailCustomDomain}
          invalid={hasError('email')}
        />
        {demoAuth ? (
          <input
            className={`input${hasError('password') ? ' input--invalid' : ''}`}
            type="text"
            placeholder={t('auth.passwordDemoFixedPlaceholder')}
            value={password}
            readOnly
            aria-readonly="true"
            autoComplete="off"
            title={t('auth.passwordDemoFixedHint')}
          />
        ) : (
          <input
            className={`input${hasError('password') ? ' input--invalid' : ''}`}
            type="password"
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        )}

        <section className="form-section">
          <h3 className="form-section__title">{t('auth.bodyMetrics')}</h3>
          <p className="form-section__desc">{t('auth.bodyMetricsDesc')}</p>
          <div className="register-unit-settings" aria-label={t('auth.unitSettings')}>
            <UnitPicker
              compact
              label={t('auth.heightLabel')}
              value={unitHeight}
              options={HEIGHT_UNIT_OPTIONS}
              onChange={setUnitHeight}
            />
            <UnitPicker
              compact
              label={t('auth.weightLabel')}
              value={unitWeight}
              options={WEIGHT_UNIT_OPTIONS}
              onChange={setUnitWeight}
            />
            <GenderPicker
              compact
              value={gender}
              onChange={setGender}
              invalid={hasError('gender')}
            />
          </div>
          <BodyMetricsFields
            unitHeight={unitHeight}
            unitWeight={unitWeight}
            heightCm={heightCm}
            weightKg={weightKg}
            age={age}
            onHeightCmChange={setHeightCm}
            onWeightKgChange={setWeightKg}
            onAgeChange={setAge}
            weightOptional={false}
            heightInvalid={hasError('heightCm')}
            weightInvalid={hasError('weightKg')}
            ageInvalid={hasError('age')}
            initializeOnMount
            pickerSize="default"
          />
          <ExperienceSelector
            value={experienceLevel}
            onChange={(value) => {
              if (value != null) setExperienceLevel(value);
            }}
            invalid={hasError('experienceLevel')}
          />
        </section>

        <section className="form-section">
          <h3 className="form-section__title">{t('auth.profileExtras')}</h3>
          <p className="form-section__desc">{t('auth.profileExtrasGoalOnly')}</p>
          <WorkoutGoalSelector
            value={workoutGoal}
            onChange={(value) => {
              if (value != null) setWorkoutGoal(value);
            }}
            invalid={hasError('workoutGoal')}
          />
        </section>

        <section className="form-section">
          <h3 className="form-section__title">{t('location.locationGymTitle')}</h3>
          <p className="form-section__desc">{t('location.locationGymDesc')}</p>
          <div className={hasError('location') ? 'input--invalid-wrap' : undefined}>
            <LocationPicker
              value={locationDraft}
              onChange={setLocationDraft}
              showDistrict
              showGps
              required
            />
          </div>
          <div className="form-stack" style={{ marginTop: 'var(--space-md)' }}>
            <HomeGymField
              value={homeGym}
              onChange={setHomeGym}
              invalid={hasError('homeGym')}
              showDesc
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
        </section>

        <div className="consent-stack" role="group" aria-label={t('auth.consentGroup')}>
          <label>
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              required
            />
            <span>
              <Link to={ROUTES.TERMS} target="_blank" rel="noreferrer">
                {t('legal.termsTitle')}
              </Link>
              {t('auth.agreeTermsSuffix')}
            </span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={agreePrivacy}
              onChange={(e) => setAgreePrivacy(e.target.checked)}
              required
            />
            <span>
              <Link to={ROUTES.PRIVACY} target="_blank" rel="noreferrer">
                {t('legal.privacyTitle')}
              </Link>
              {t('auth.agreePrivacySuffix')}
            </span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={agreeMarketing}
              onChange={(e) => setAgreeMarketing(e.target.checked)}
            />
            <span>{t('auth.agreeMarketing')}</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={agreeLocation}
              onChange={(e) => setAgreeLocation(e.target.checked)}
            />
            <span>
              <Link to={ROUTES.LEGAL_LOCATION} target="_blank" rel="noreferrer">
                {t('legal.locationTitle')}
              </Link>
              {t('auth.agreeLocationSuffix')}
            </span>
          </label>
        </div>

        <button type="submit" className="btn btn--primary btn--block" disabled={mutation.isPending}>
          {mutation.isPending ? '...' : t('nav.register')}
        </button>
      </form>
      <p className="auth-page__footer">
        <Link to={ROUTES.LOGIN}>{t('nav.login')}</Link>
      </p>
      <AlertDialog
        open={errorDialog.open}
        title={t('auth.registrationFailedTitle')}
        message={errorDialog.message}
        onClose={() => setErrorDialog({ open: false, message: '' })}
      />
    </PageShell>
  );
}
