import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { TradeCard } from '@/components/trade/TradeCard';
import { machineTradeApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import '@/styles/components.css';
import '@/styles/trade.css';

export function TradeReportsPage() {
  const { t } = useTranslation('trade');
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.machineTrades({
      page,
      mineOnly: true,
      includeExpired: true,
      scope: 'reports',
    }),
    queryFn: async () =>
      (
        await machineTradeApi.list({
          page,
          limit: 20,
          mineOnly: true,
          includeExpired: true,
        })
      ).data.data,
  });

  return (
    <PageShell title={t('reports')} subtitle={t('reportsHint')}>
      {isLoading ? (
        <Skeleton count={3} height={96} />
      ) : !data?.items.length ? (
        <div className="card trade-empty">{t('empty')}</div>
      ) : (
        <>
          <div className="trade-list">
            {data.items.map((trade) => (
              <TradeCard key={trade.id} trade={trade} />
            ))}
          </div>
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPageChange={(nextPage) => {
              const next = new URLSearchParams(params);
              next.set('page', String(nextPage));
              setParams(next);
            }}
          />
        </>
      )}
    </PageShell>
  );
}
