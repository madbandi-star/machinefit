import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { TRADE_STATUSES, type TradeStatus } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { TradeCard } from '@/components/trade/TradeCard';
import { machineTradeApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import '@/styles/trade.css';

export function TradeMinePage() {
  const { t } = useTranslation('trade');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.machineTrades({ page, mineOnly: true, includeExpired: true }),
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

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: TradeStatus }) =>
      machineTradeApi.update(id, { status: next }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machine-trades'] });
      showToast(t('statusUpdated'), 'success');
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  return (
    <PageShell title={t('myTrades')}>
      {isLoading ? (
        <Skeleton count={3} height={96} />
      ) : !data?.items.length ? (
        <div className="card trade-empty">{t('empty')}</div>
      ) : (
        <>
          <div className="trade-list">
            {data.items.map((trade) => (
              <div key={trade.id} style={{ display: 'grid', gap: '0.4rem' }}>
                <TradeCard trade={trade} />
                <select
                  className="input"
                  value={trade.status}
                  disabled={statusMutation.isPending}
                  onChange={(e) =>
                    statusMutation.mutate({
                      id: trade.id,
                      next: e.target.value as TradeStatus,
                    })
                  }
                  aria-label={t('status')}
                >
                  {TRADE_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {t(`statuses.${value}`)}
                    </option>
                  ))}
                </select>
              </div>
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
