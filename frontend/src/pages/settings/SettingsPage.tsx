import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { LanguageSelector } from '@/components/settings/LanguageSelector/LanguageSelector';
import { UnitSelector } from '@/components/settings/UnitSelector/UnitSelector';
import { ThemeSwitch } from '@/components/settings/ThemeSwitch/ThemeSwitch';
import '@/styles/components.css';

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <PageShell title={t('nav.settings')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <section>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Language</h3>
          <LanguageSelector />
        </section>
        <section>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Units</h3>
          <UnitSelector />
        </section>
        <section>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Theme</h3>
          <ThemeSwitch />
        </section>
      </div>
    </PageShell>
  );
}
