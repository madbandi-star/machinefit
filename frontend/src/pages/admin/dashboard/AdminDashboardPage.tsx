import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import '@/styles/admin.css';

export function AdminDashboardPage() {
  const { t } = useTranslation('admin');

  const { data: stats, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminDashboard,
    queryFn: async () => {
      const res = await adminApi.dashboard();
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <PageShell title={t('title')}>
        <Skeleton count={4} />
      </PageShell>
    );
  }

  const cards = [
    { label: t('userCount'), value: stats?.userCount ?? 0, to: ROUTES.ADMIN_USERS },
    { label: t('gymCount'), value: stats?.gymCount ?? 0, to: ROUTES.ADMIN_GYMS },
    { label: t('machineCount'), value: stats?.machineCount ?? 0, to: ROUTES.ADMIN_MACHINES },
    { label: t('pendingRequests'), value: stats?.pendingRequests ?? 0, to: ROUTES.ADMIN_MODERATION },
    { label: t('pendingReports'), value: stats?.pendingReports ?? 0, to: ROUTES.ADMIN_MODERATION },
    { label: t('verifiedGyms'), value: stats?.verifiedGyms ?? 0, to: ROUTES.ADMIN_GYMS },
  ];

  return (
    <PageShell title={t('title')} subtitle={t('subtitle')}>
      <div className="admin-stats">
        {cards.map((card) => (
          <Link key={card.label} to={card.to} className="card admin-stat">
            <div className="admin-stat__value">{card.value}</div>
            <div className="admin-stat__label">{card.label}</div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
