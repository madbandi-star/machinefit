import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <PageShell title={t('pages.notFound.title')} subtitle={t('pages.notFound.message')}>
      <Link to={ROUTES.HOME} className="btn btn--primary">
        {t('nav.home')}
      </Link>
    </PageShell>
  );
}
