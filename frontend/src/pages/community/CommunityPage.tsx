import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';

export function CommunityPage() {
  const { t } = useTranslation();
  const { t: tc } = useTranslation('community');

  return (
    <PageShell title={t('nav.community')} subtitle="Connect with the MachineFit community">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Link to={ROUTES.MACHINE_REQUESTS} className="card card--interactive community-link-card">
          <strong>{tc('machineRequests')}</strong>
          <p className="community-link-card__desc">{tc('machineRequestsSubtitle')}</p>
        </Link>
        <Link to={ROUTES.FREE_BOARD} className="card card--interactive community-link-card">
          <strong>{tc('freeBoard')}</strong>
          <p className="community-link-card__desc">{tc('freeBoardSubtitle')}</p>
        </Link>
      </div>
    </PageShell>
  );
}
