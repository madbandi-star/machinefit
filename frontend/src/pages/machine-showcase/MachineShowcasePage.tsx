import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { MachineShowcaseTab } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { ShowcaseCard } from '@/components/machine-showcase/ShowcaseCard';
import { machineShowcaseApi } from '@/api/machine-showcase.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';
import '@/styles/machine-showcase.css';

const TABS: MachineShowcaseTab[] = ['popular', 'latest', 'myGym', 'nearby'];

export function MachineShowcasePage() {
  const { t } = useTranslation('community');
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const tab = (params.get('tab') as MachineShowcaseTab) || 'latest';
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locTried, setLocTried] = useState(false);

  const query = useQuery({
    queryKey: QUERY_KEYS.machineShowcase({ page, tab, lat: coords?.lat, lng: coords?.lng }),
    queryFn: async () =>
      (
        await machineShowcaseApi.list({
          page,
          limit: 12,
          tab,
          lat: coords?.lat,
          lng: coords?.lng,
        })
      ).data.data,
  });

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocTried(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocTried(true);
      },
      () => setLocTried(true),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const setTab = (next: MachineShowcaseTab) => {
    const nextParams = new URLSearchParams(params);
    nextParams.set('tab', next);
    nextParams.set('page', '1');
    setParams(nextParams);
    if (next === 'nearby' && !coords && !locTried) requestLocation();
  };

  return (
    <PageShell title={t('showcase.title')} subtitle={t('showcase.subtitle')}>
      <div className="showcase-page">
        <div className="showcase-top photo-top">
          <div>
            <h1>{t('showcase.title')}</h1>
            <p>{t('showcase.subtitle')}</p>
          </div>
          <Link to={ROUTES.MACHINE_SHOWCASE_WRITE} className="btn btn--primary">
            {t('showcase.writeCta')}
          </Link>
        </div>

        <div className="showcase-tabs" role="tablist">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              className={tab === item ? 'is-active' : ''}
              onClick={() => setTab(item)}
            >
              {t(`showcase.tabs.${item}`)}
            </button>
          ))}
        </div>

        {tab === 'nearby' && !coords ? (
          <p className="showcase-empty">
            {t('showcase.nearbyHint')}
            <button type="button" className="btn btn--secondary" onClick={requestLocation}>
              {t('showcase.useLocation')}
            </button>
          </p>
        ) : null}

        {query.isLoading ? <Skeleton count={3} height={220} /> : null}
        {query.data?.items.length === 0 ? (
          <p className="showcase-empty">{t('showcase.empty')}</p>
        ) : (
          <div className="showcase-feed">
            {query.data?.items.map((post) => (
              <ShowcaseCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {query.data?.meta && query.data.meta.totalPages > 1 ? (
          <Pagination
            page={page}
            totalPages={query.data.meta.totalPages}
            onPageChange={(next) => {
              const nextParams = new URLSearchParams(params);
              nextParams.set('page', String(next));
              setParams(nextParams);
            }}
          />
        ) : null}
      </div>
    </PageShell>
  );
}
