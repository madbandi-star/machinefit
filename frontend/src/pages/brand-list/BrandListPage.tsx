import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { BrandCard } from '@/components/cards/BrandCard/BrandCard';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QUERY_KEYS } from '@/constants/query-keys';
import { brandApi } from '@/api';

export function BrandListPage() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.brands,
    queryFn: async () => {
      const res = await brandApi.list();
      return res.data.data;
    },
  });

  return (
    <PageShell title={t('nav.brands')}>
      {isLoading ? (
        <Skeleton count={6} height={60} />
      ) : (
        <div className="card-grid">
          {data?.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
