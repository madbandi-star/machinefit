import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';

export function LabPage() {
  const { t } = useTranslation();

  return (
    <PageShell title={t('lab.title')} subtitle={t('lab.subtitle')}>
      <p className="page-subtitle">{t('lab.body')}</p>
    </PageShell>
  );
}
