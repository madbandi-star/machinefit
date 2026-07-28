import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { TradeCard } from '@/components/trade/TradeCard';
import { machineTradeApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { tradeTypeFromListPath } from '@/utils/tradeRoutes';
import '@/styles/components.css';
import '@/styles/trade.css';

const SORTS = ['newest', 'popular', 'price_asc', 'price_desc'] as const;

export function TradeListPage() {
  const { t } = useTranslation('trade');
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const tradeType = tradeTypeFromListPath(location.pathname);
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const sort = (params.get('sort') as (typeof SORTS)[number]) || 'newest';
  const machineCode = params.get('machineCode') || undefined;

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.machineTrades({ tradeType, page, sort, machineCode }),
    queryFn: async () => {
      const res = await machineTradeApi.list({
        tradeType,
        page,
        limit: 20,
        sort: SORTS.includes(sort) ? sort : 'newest',
        machineCode,
      });
      return res.data.data;
    },
    staleTime: 30_000,
  });

  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const title = tradeType === 'sell' ? t('sellList') : t('buyList');
  const otherType = tradeType === 'sell' ? 'buy' : 'sell';
  const otherRoute = otherType === 'buy' ? ROUTES.TRADE_LIST_BUY : ROUTES.TRADE_LIST_SELL;
  const otherLabel = otherType === 'buy' ? t('viewBuyListings') : t('viewSellListings');
  const otherQs = machineCode ? `?machineCode=${encodeURIComponent(machineCode)}` : '';

  return (
    <PageShell title={title}>
      <div className="trade-toolbar">
        <div className="trade-toolbar__row">
          <Link
            to={`${tradeType === 'sell' ? ROUTES.TRADE_LIST_SELL : ROUTES.TRADE_LIST_BUY}${otherQs}`}
            className="trade-tabs__btn is-active"
          >
            {tradeType === 'sell' ? t('viewSellListings') : t('viewBuyListings')}
          </Link>
          <Link to={`${otherRoute}${otherQs}`} className="trade-tabs__btn">
            {otherLabel}
          </Link>
        </div>
        <div className="trade-toolbar__row">
          {SORTS.map((value) => (
            <button
              key={value}
              type="button"
              className={`trade-tabs__btn${sort === value ? ' is-active' : ''}`}
              onClick={() => updateParam('sort', value)}
            >
              {t(`sort.${value}`)}
            </button>
          ))}
        </div>
        {machineCode ? (
          <div className="trade-toolbar__row">
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {t('filterMachine')}: {machineCode}
            </span>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => updateParam('machineCode')}
            >
              {t('clearMachineFilter')}
            </button>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <Skeleton count={4} height={96} />
      ) : isError ? (
        <QueryErrorMessage onRetry={() => void refetch()} />
      ) : !data?.items.length ? (
        <div className="card trade-empty">{t('empty')}</div>
      ) : (
        <>
          <div className={`trade-list${isFetching ? ' is-fetching' : ''}`}>
            {data.items.map((trade) => (
              <TradeCard key={trade.id} trade={trade} />
            ))}
          </div>
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPageChange={(nextPage) => updateParam('page', String(nextPage))}
          />
        </>
      )}

      <div style={{ marginTop: '1rem' }}>
        <Link to={ROUTES.MY_PAGE} className="btn btn--secondary btn--block">
          {t('cancel')}
        </Link>
      </div>
    </PageShell>
  );
}
