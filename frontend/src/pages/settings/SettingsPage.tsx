import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import type { ExperienceLevel, Gender } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { BodyMetricsFields } from '@/components/settings/BodyMetricsFields/BodyMetricsFields';
import { ExperienceSelector } from '@/components/settings/ExperienceSelector/ExperienceSelector';
import { GenderPicker } from '@/components/settings/GenderPicker/GenderPicker';
import { ProfileSummaryCard } from '@/components/settings/ProfileSummaryCard/ProfileSummaryCard';
import { LanguageSelector } from '@/components/settings/LanguageSelector/LanguageSelector';
import { UnitSelector } from '@/components/settings/UnitSelector/UnitSelector';
import { ThemeSwitch } from '@/components/settings/ThemeSwitch/ThemeSwitch';
import { ProUpgradeCard } from '@/components/pro/ProUpgradeCard/ProUpgradeCard';
import { userApi } from '@/api';
import { useAuthStore } from '@/store/auth.store';
import { useSettingsStore } from '@/store/settings.store';
import { useUIStore } from '@/store/ui.store';
import { syncUserSettings } from '@/utils/syncUserSettings';
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

  const [heightCm, setHeightCm] = useState(user?.heightCm ?? 175);
  const [weightKg, setWeightKg] = useState<number | undefined>(user?.weightKg);
  const [gender, setGender] = useState<Gender | undefined>(user?.gender);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    user?.experienceLevel ?? 'intermediate'
  );

  useEffect(() => {
    if (user?.heightCm != null) setHeightCm(user.heightCm);
    setWeightKg(user?.weightKg);
    setGender(user?.gender);
    if (user?.experienceLevel) setExperienceLevel(user.experienceLevel);
  }, [user?.heightCm, user?.weightKg, user?.gender, user?.experienceLevel]);

  const mutation = useMutation({
    mutationFn: () =>
      userApi.updateMe({
        heightCm,
        weightKg,
        gender,
        unitHeight,
        unitWeight,
        experienceLevel,
      }),
    onSuccess: (res) => {
      const updatedUser = res.data.data as User;
      updateUser(updatedUser);
      syncUserSettings(updatedUser);
      showToast(t('auth.profileSaved'), 'success');
      if (returnTo) {
        navigate(returnTo, { replace: true });
      }
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  return (
    <PageShell title={t('nav.settings')}>
      <ProfileSummaryCard user={user} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <section className="form-section">
          <h3 className="form-section__title">{t('auth.bodyMetrics')}</h3>
          <p className="form-section__desc">{t('auth.bodyMetricsDesc')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <BodyMetricsFields
              unitHeight={unitHeight}
              unitWeight={unitWeight}
              heightCm={heightCm}
              weightKg={weightKg}
              onHeightCmChange={setHeightCm}
              onWeightKgChange={setWeightKg}
            />
            <GenderPicker value={gender} onChange={setGender} />
            <ExperienceSelector
              value={experienceLevel}
              onChange={setExperienceLevel}
            />
          </div>
          <button
            type="button"
            className="btn btn--primary btn--block"
            style={{ marginTop: '1rem' }}
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? '...' : t('actions.save')}
          </button>
        </section>

        <section>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>
            {t('settings.language')}
          </h3>
          <LanguageSelector />
        </section>
        <section>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>{t('auth.unitSettings')}</h3>
          <UnitSelector />
        </section>
        <section>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>{t('settings.theme')}</h3>
          <ThemeSwitch />
        </section>

        <ProUpgradeCard />
      </div>
    </PageShell>
  );
}
