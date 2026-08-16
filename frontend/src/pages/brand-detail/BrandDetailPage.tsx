import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { MachineListItem } from '@/components/machines/MachineListItem/MachineListItem';
import { MachineEmptyState } from '@/components/machines/MachineEmptyState/MachineEmptyState';
import { LegalDisclaimerBanner } from '@/components/compliance/LegalDisclaimerBanner';
import { FavoriteBrandButton } from '@/components/brands/FavoriteBrandButton/FavoriteBrandButton';
import { QUERY_KEYS } from '@/constants/query-keys';
import { brandApi } from '@/api';
import { getLocalizedName } from '@/utils/localizedName';
import { resolveBrandLogoUrl } from '@/utils/catalogAssets';
import { safeHttpUrl } from '@/utils/safeHttpUrl';
import { Seo } from '@/seo/Seo';
import { brandCollectionJsonLd, breadcrumbJsonLd } from '@/seo/jsonLd';
import { useAuthStore } from '@/store/auth.store';
import '@/styles/machines.css';

export function BrandDetailPage() {
  const { brandCode } = useParams<{ brandCode: string }>();
  const { t, i18n } = useTranslation('machines');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: brand, isLoading: brandLoading, isError: brandError } = useQuery({
    queryKey: QUERY_KEYS.brand(brandCode!),
    queryFn: async () => {
      const res = await brandApi.getByCode(brandCode!);
      return res.data.data;
    },
    enabled: !!brandCode,
  });

  const { data: machines, isLoading: machinesLoading } = useQuery({
    queryKey: [...QUERY_KEYS.machines, 'brand', brandCode],
    queryFn: async () => {
      const res = await brandApi.getMachines(brandCode!);
      return res.data.data;
    },
    enabled: !!brandCode,
  });

  if (brandLoading) return <Skeleton count={3} height={80} />;
  if (brandError) {
    return (
      <PageShell title={t('error', { defaultValue: 'Error' })}>
        <QueryErrorMessage />
      </PageShell>
    );
  }
  if (!brand) {
    return <PageShell title={t('notFound', { defaultValue: 'Not Found' })} />;
  }

  const name = getLocalizedName(brand.name, i18n.language, brand.code);
  const description = brand.description
    ? getLocalizedName(brand.description, i18n.language, '')
    : '';
  const logoUrl = resolveBrandLogoUrl(brand.code, brand.logoUrl);
  const seoPath = `/brands/${encodeURIComponent(brand.code)}`;
  const seoTitle = `${name} 머신`;
  const seoDescription =
    description ||
    `${name} 헬스장 머신 목록과 사용 팁을 머신핏에서 확인하세요.`;

  return (
    <PageShell title={name} subtitle={t('brandDetail.subtitle', { code: brand.code })}>
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={seoPath}
        image={logoUrl || undefined}
        jsonLd={[
          brandCollectionJsonLd({
            name: seoTitle,
            description: seoDescription,
            path: seoPath,
          }),
          breadcrumbJsonLd([
            { name: '홈', path: '/' },
            { name: '브랜드', path: '/brands' },
            { name, path: seoPath },
          ]),
        ]}
      />
      <LegalDisclaimerBanner variant="trademark" compact />
      <div className="brand-detail__header">
        <div className="brand-detail__title-row">
          {logoUrl ? (
            <img src={logoUrl} alt={name} className="brand-detail__logo" loading="lazy" />
          ) : null}
          {isAuthenticated ? (
            <FavoriteBrandButton brandId={brand.id} className="brand-detail__favorite" />
          ) : null}
        </div>
        {description ? <p className="brand-detail__desc">{description}</p> : null}
        {safeHttpUrl(brand.websiteUrl) ? (
          <a
            className="brand-detail__website"
            href={safeHttpUrl(brand.websiteUrl)!}
            target="_blank"
            rel="noreferrer"
          >
            {brand.websiteUrl!.replace(/^https?:\/\//, '')}
          </a>
        ) : null}
      </div>
      {machinesLoading ? (
        <Skeleton count={4} height={72} />
      ) : !machines?.length ? (
        <MachineEmptyState />
      ) : (
        <div className="machine-list">
          {machines.map((machine) => (
            <MachineListItem key={machine.id} machine={machine} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
