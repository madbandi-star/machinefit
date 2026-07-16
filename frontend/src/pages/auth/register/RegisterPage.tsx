import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import type { UnitHeight, UnitWeight } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { BodyMetricsFields } from '@/components/settings/BodyMetricsFields/BodyMetricsFields';
import {
  HEIGHT_UNIT_OPTIONS,
  UnitPicker,
  WEIGHT_UNIT_OPTIONS,
} from '@/components/settings/UnitPicker/UnitPicker';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { syncUserSettings } from '@/utils/syncUserSettings';
import { ROUTES } from '@/constants/routes';
import type { User, AuthTokens } from '@machinefit/shared';
import '@/styles/components.css';

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const showToast = useUIStore((s) => s.showToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [unitHeight, setUnitHeight] = useState<UnitHeight>('cm');
  const [unitWeight, setUnitWeight] = useState<UnitWeight>('kg');
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState<number | undefined>(undefined);

  const mutation = useMutation({
    mutationFn: () =>
      authApi.register({
        email,
        password,
        displayName,
        unitHeight,
        unitWeight,
        heightCm,
        weightKg,
      }),
    onSuccess: (res) => {
      const { user, tokens } = res.data.data as { user: User; tokens: AuthTokens };
      setAuth(user, tokens);
      syncUserSettings(user);
      showToast(t('auth.accountCreated'), 'success');
      navigate(ROUTES.HOME, { replace: true });
    },
    onError: () => showToast(t('auth.registrationFailed'), 'error'),
  });

  return (
    <PageShell title={t('nav.register')}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <input
          className="input"
          type="text"
          placeholder={t('auth.displayNamePlaceholder')}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          minLength={2}
          required
        />
        <input
          className="input"
          type="email"
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          className="input"
          type="password"
          placeholder={t('auth.passwordMinPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          autoComplete="new-password"
          required
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
          <BodyMetricsFields
            unitHeight={unitHeight}
            unitWeight={unitWeight}
            heightCm={heightCm}
            weightKg={weightKg}
            onHeightCmChange={setHeightCm}
            onWeightKgChange={setWeightKg}
          />
        </section>

        <button type="submit" className="btn btn--primary btn--block" disabled={mutation.isPending}>
          {mutation.isPending ? '...' : t('nav.register')}
        </button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
        {t('nav.login')}? <Link to={ROUTES.LOGIN}>{t('nav.login')}</Link>
      </p>
    </PageShell>
  );
}
