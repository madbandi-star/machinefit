import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
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

type TradeHubTab = 'sell' | 'buy' | 'mine' | 'liked';

const TABS: TradeHubTab[] = ['sell', 'buy', 'mine', 'liked'];

function parseTab(raw: string | null): TradeHubTab {
  if (raw === 'buy' || raw === 'mine' || raw === 'liked') return raw;
  return 'sell';
}

export function TradeHubPage() {
  const { t } = useTranslation('trade');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [params, setParams] = useSearchParams();

  const tab = parseTab(params.get('tab'));
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const status = (params.get('status') as TradeStatus | null) || undefined;

  const listQuery = useMemo(() => {
    if (tab === 'liked') {
      return { page, likedOnly: true as const };
    }
    if (tab === 'mine') {
      return { page, mineOnly: true as const, includeExpired: true as const };
    }
    return {
      tradeType: tab,
      page,
      mineOnly: true as const,
      includeExpired: true as const,
      status,
    };
  }, [tab, page, status]);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.machineTrades(listQuery),
    queryFn: async () => (await machineTradeApi.list({ limit: 20, ...listQuery })).data.data,
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

  const showStatusFilters = tab === 'sell' || tab === 'buy';
  const showStatusEditor = tab !== 'liked';

  function setTab(nextTab: TradeHubTab) {
    const next = new URLSearchParams();
    next.set('tab', nextTab);
    setParams(next);
  }

  function setStatusFilter(nextStatus?: TradeStatus) {
    const next = new URLSearchParams(params);
    next.set('tab', tab);
    if (nextStatus) next.set('status', nextStatus);
    else next.delete('status');
    next.delete('page');
    setParams(next);
  }

  return (
    <PageShell title={t('hubTitle')}>
      <div className="trade-hub-tabs" role="tablist" aria-label={t('hubTitle')}>
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`trade-tabs__btn trade-hub-tabs__btn${tab === key ? ' is-active' : ''}`}
            onClick={() => setTab(key)}
          >
            {t(`hubTab.${key}`)}
          </button>
        ))}
      </div>

      {showStatusFilters ? (
        <div className="trade-toolbar">
          <div className="trade-toolbar__row">
            <button
              type="button"
              className={`trade-tabs__btn${!status ? ' is-active' : ''}`}
              onClick={() => setStatusFilter(undefined)}
            >
              {t('statsCount.total')}
            </button>
            {TRADE_STATUSES.map((value) => (
              <button
                key={value}
                type="button"
                className={`trade-tabs__btn${status === value ? ' is-active' : ''}`}
                onClick={() => setStatusFilter(value)}
              >
                {t(`statuses.${value}`)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <Skeleton count={3} height={96} />
      ) : !data?.items.length ? (
        <div className="card trade-empty">{t('empty')}</div>
      ) : (
        <>
          <div className="trade-list">
            {data.items.map((trade) => (
              <div key={trade.id} className="trade-hub-item">
                <TradeCard trade={trade} />
                {showStatusEditor ? (
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
                ) : null}
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
