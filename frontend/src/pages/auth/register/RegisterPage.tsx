import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import type { ExperienceLevel, Gender, UnitHeight, UnitWeight, WorkoutGoal } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { RegisterEmailField } from '@/components/auth/RegisterEmailField/RegisterEmailField';
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
import { authApi } from '@/api';
import { AlertDialog } from '@/components/feedback/AlertDialog/AlertDialog';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { syncUserSettings } from '@/utils/syncUserSettings';
import { resolveRegisterErrorMessage } from '@/utils/getApiErrorMessage';
import {
  buildDemoEmail,
  DEMO_HOME_GYM_NAME,
  DEMO_REGISTER_PASSWORD,
  getDemoRegisterSlot,
  markDemoRegisterSlotUsed,
  type PopularEmailDomain,
} from '@/utils/demoRegisterDefaults';
import {
  getMissingRegisterFields,
  type RegisterFormField,
} from '@/utils/validateRegisterForm';
import { ROUTES } from '@/constants/routes';
import type { User, AuthTokens } from '@machinefit/shared';
import '@/styles/components.css';

function formatMissingFieldLabels(
  fields: RegisterFormField[],
  t: (key: string) => string
): string {
  return fields.map((field) => t(`auth.registerFieldLabels.${field}`)).join(', ');
}

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const showToast = useUIStore((s) => s.showToast);

  const demoSlot = useMemo(() => getDemoRegisterSlot(), []);

  const [emailLocal, setEmailLocal] = useState(demoSlot.emailLocal);
  const [emailDomain, setEmailDomain] = useState<PopularEmailDomain>('gmail.com');
  const [password, setPassword] = useState(DEMO_REGISTER_PASSWORD);
  const [displayName, setDisplayName] = useState(demoSlot.displayName);
  const [unitHeight, setUnitHeight] = useState<UnitHeight>('cm');
  const [unitWeight, setUnitWeight] = useState<UnitWeight>('kg');
  const [heightCm, setHeightCm] = useState<number | undefined>(undefined);
  const [weightKg, setWeightKg] = useState<number | undefined>(undefined);
  const [age, setAge] = useState<number | undefined>(undefined);
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [workoutGoal, setWorkoutGoal] = useState<WorkoutGoal>('hypertrophy');
  const [homeGym, setHomeGym] = useState<HomeGymValue>({ homeGymName: DEMO_HOME_GYM_NAME });
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('beginner');
  const [missingFields, setMissingFields] = useState<RegisterFormField[]>([]);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  const email = buildDemoEmail(emailLocal, emailDomain);

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
      }),
    onSuccess: (res) => {
      markDemoRegisterSlotUsed();
      const { user, tokens } = res.data.data as { user: User; tokens: AuthTokens };
      setAuth(user, tokens);
      syncUserSettings(user);
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
      homeGym,
      experienceLevel,
    });

    if (missing.length > 0) {
      setMissingFields(missing);
      const fieldLabels = formatMissingFieldLabels(missing, t);
      showToast(t('auth.registerMissingFields', { fields: fieldLabels }), 'error');
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
          domain={emailDomain}
          onLocalPartChange={setEmailLocal}
          onDomainChange={setEmailDomain}
          invalid={hasError('email')}
        />
        <input
          className={`input${hasError('password') ? ' input--invalid' : ''}`}
          type="password"
          placeholder={t('auth.passwordMinPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          autoComplete="new-password"
        />

        <section className="form-section">
          <h3 className="form-section__title">{t('auth.unitSettings')}</h3>
          <p className="form-section__desc">{t('auth.unitSettingsDesc')}</p>
          <UnitPicker
            label={t('auth.heightUnit')}
            value={unitHeight}
            options={HEIGHT_UNIT_OPTIONS}
            onChange={setUnitHeight}
          />
          <UnitPicker
            label={t('auth.weightUnit')}
            value={unitWeight}
            options={WEIGHT_UNIT_OPTIONS}
            onChange={setUnitWeight}
          />
        </section>

        <section className="form-section">
          <h3 className="form-section__title">{t('auth.bodyMetrics')}</h3>
          <p className="form-section__desc">{t('auth.bodyMetricsDesc')}</p>
          <GenderPicker
            value={gender}
            onChange={setGender}
            invalid={hasError('gender')}
          />
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
          <p className="form-section__desc">{t('auth.profileExtrasDesc')}</p>
          <WorkoutGoalSelector
            value={workoutGoal}
            onChange={(value) => {
              if (value != null) setWorkoutGoal(value);
            }}
            invalid={hasError('workoutGoal')}
          />
          <HomeGymField
            value={homeGym}
            onChange={setHomeGym}
            invalid={hasError('homeGym')}
          />
        </section>

        <button type="submit" className="btn btn--primary btn--block" disabled={mutation.isPending}>
          {mutation.isPending ? '...' : t('nav.register')}
        </button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
        {t('nav.login')}? <Link to={ROUTES.LOGIN}>{t('nav.login')}</Link>
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
