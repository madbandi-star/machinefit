import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { MachineCard } from '@/components/cards/MachineCard/MachineCard';
import { BrandCard } from '@/components/cards/BrandCard/BrandCard';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { ROUTES } from '@/constants/routes';
import { QUERY_KEYS } from '@/constants/query-keys';
import { machineApi, brandApi } from '@/api';
import '@/styles/components.css';

export function HomePage() {
  const { t } = useTranslation();

  const { data: machines, isLoading: machinesLoading } = useQuery({
    queryKey: QUERY_KEYS.machines,
    queryFn: async () => {
      const res = await machineApi.list({ limit: 6 });
      return res.data.data.items;
    },
  });

  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: QUERY_KEYS.brands,
    queryFn: async () => {
      const res = await brandApi.list();
      return res.data.data;
    },
  });

  return (
    <PageShell title={t('pages.home.title')} subtitle={t('pages.home.subtitle')}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to={ROUTES.MACHINES} className="btn btn--primary btn--block">
          🔧 {t('nav.machines')}
        </Link>
      </div>

      <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{t('nav.brands')}</h2>
      {brandsLoading ? (
        <Skeleton count={3} height={60} />
      ) : (
        <div className="card-grid">
          {brands?.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      )}

      <h2 style={{ fontSize: '1.1rem', margin: '2rem 0 1rem' }}>{t('nav.machines')}</h2>
      {machinesLoading ? (
        <Skeleton count={3} height={80} />
      ) : (
        <div className="card-grid">
          {machines?.map((machine) => (
            <MachineCard key={machine.id} machine={machine} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
