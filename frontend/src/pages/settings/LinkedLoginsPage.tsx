import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { LinkedProvidersSection } from '@/components/my-page/LinkedProvidersSection/LinkedProvidersSection';
import '@/styles/components.css';
import '@/styles/auth.css';

export function LinkedLoginsPage() {
  const { t } = useTranslation();

  return (
    <PageShell
      title={t('settings.linkedLogins')}
      subtitle={t('settings.linkedLoginsDesc')}
    >
      <LinkedProvidersSection showHeading={false} />
    </PageShell>
  );
}
