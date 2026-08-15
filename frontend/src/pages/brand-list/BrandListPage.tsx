import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { BrandCard } from '@/components/cards/BrandCard/BrandCard';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { LegalDisclaimerBanner } from '@/components/compliance/LegalDisclaimerBanner';
import { QUERY_KEYS } from '@/constants/query-keys';
import { brandApi } from '@/api';
import { Seo } from '@/seo/Seo';
import { brandCollectionJsonLd, breadcrumbJsonLd } from '@/seo/jsonLd';

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
      <Seo
        title="헬스 머신 브랜드"
        description="Hammer Strength, Cybex, Life Fitness, Technogym 등 헬스장 머신 브랜드를 MachineFit에서 살펴보세요."
        path="/brands"
        jsonLd={[
          brandCollectionJsonLd({
            name: '헬스 머신 브랜드',
            description:
              'Hammer Strength, Cybex, Life Fitness, Technogym 등 헬스장 머신 브랜드를 MachineFit에서 살펴보세요.',
            path: '/brands',
          }),
          breadcrumbJsonLd([
            { name: '홈', path: '/' },
            { name: '브랜드', path: '/brands' },
          ]),
        ]}
      />
      <LegalDisclaimerBanner variant="trademark" compact />
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
