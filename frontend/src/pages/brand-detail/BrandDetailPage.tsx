import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { MachineListItem } from '@/components/machines/MachineListItem/MachineListItem';
import { MachineEmptyState } from '@/components/machines/MachineEmptyState/MachineEmptyState';
import { QUERY_KEYS } from '@/constants/query-keys';
import { brandApi } from '@/api';
import { getLocalizedName } from '@/utils/localizedName';
import '@/styles/machines.css';

export function BrandDetailPage() {
  const { brandCode } = useParams<{ brandCode: string }>();
  const { t, i18n } = useTranslation('machines');

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

  return (
    <PageShell title={name} subtitle={t('brandDetail.subtitle', { code: brand.code })}>
      <div className="brand-detail__header">
        {brand.logoUrl ? (
          <img
            src={brand.logoUrl}
            alt={name}
            className="brand-detail__logo"
            loading="lazy"
          />
        ) : null}
        {description ? <p className="brand-detail__desc">{description}</p> : null}
        {brand.websiteUrl ? (
          <a
            className="brand-detail__website"
            href={brand.websiteUrl}
            target="_blank"
            rel="noreferrer"
          >
            {brand.websiteUrl.replace(/^https?:\/\//, '')}
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
