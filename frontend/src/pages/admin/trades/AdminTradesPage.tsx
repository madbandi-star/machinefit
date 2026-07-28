import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { TradeCard } from '@/components/trade/TradeCard';
import { machineTradeApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import { formatTradeLocalized, formatTradePrice, tradeStatusKey } from '@/utils/tradeLabels';
import '@/styles/admin.css';
import '@/styles/trade.css';

type Tab = 'listings' | 'reports' | 'stats';

export function AdminTradesPage() {
  const { t, i18n } = useTranslation('trade');
  const { t: ta } = useTranslation('admin');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [tab, setTab] = useState<Tab>('listings');
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const includeExpired = params.get('includeExpired') === '1';

  const listQuery = useQuery({
    queryKey: QUERY_KEYS.adminMachineTrades({ page, includeExpired }),
    queryFn: async () =>
      (
        await machineTradeApi.adminList({
          page,
          limit: 20,
          includeExpired,
        })
      ).data.data,
    enabled: tab === 'listings',
  });

  const reportsQuery = useQuery({
    queryKey: QUERY_KEYS.adminMachineTradeReports,
    queryFn: async () => (await machineTradeApi.adminReports()).data.data,
    enabled: tab === 'reports',
  });

  const statsQuery = useQuery({
    queryKey: QUERY_KEYS.adminMachineTradeStats,
    queryFn: async () => (await machineTradeApi.adminStats()).data.data,
    enabled: tab === 'stats',
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'resolved' | 'dismissed' }) =>
      machineTradeApi.adminResolveReport(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminMachineTradeReports });
      showToast(ta('saved'), 'success');
    },
    onError: () => showToast(ta('error'), 'error'),
  });

  const restoreMutation = useMutation({
    mutationFn: (tradeId: string) => machineTradeApi.adminRestore(tradeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'machine-trades'] });
      showToast(ta('saved'), 'success');
    },
    onError: () => showToast(ta('error'), 'error'),
  });

  const loading =
    (tab === 'listings' && listQuery.isLoading) ||
    (tab === 'reports' && reportsQuery.isLoading) ||
    (tab === 'stats' && statsQuery.isLoading);

  return (
    <AdminPageShell title={t('admin.title')} subtitle={t('admin.subtitle')}>
      <div className="admin-tabs admin-tabs--wide">
        {(
          [
            ['listings', t('admin.listings')],
            ['reports', t('admin.reports')],
            ['stats', t('admin.stats')],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`admin-tabs__btn${tab === key ? ' is-active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <Skeleton count={3} height={72} /> : null}

      {tab === 'listings' && !loading ? (
        <div className="admin-stack admin-tab-panel">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeExpired}
              onChange={(e) => {
                const next = new URLSearchParams(params);
                if (e.target.checked) next.set('includeExpired', '1');
                else next.delete('includeExpired');
                next.delete('page');
                setParams(next);
              }}
            />
            <span>{t('admin.includeExpired')}</span>
          </label>
          {!listQuery.data?.items.length ? (
            <div className="admin-empty">{t('empty')}</div>
          ) : (
            <>
              {listQuery.data.items.map((trade) => (
                <div key={trade.id} className="admin-stack admin-stack--sm">
                  <TradeCard trade={trade} />
                  <div className="admin-card__actions">
                    <Link
                      to={ROUTES.TRADE_DETAIL.replace(':tradeId', trade.id)}
                      className="btn btn--secondary"
                    >
                      {ta('openMenu')}
                    </Link>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => restoreMutation.mutate(trade.id)}
                      disabled={restoreMutation.isPending}
                    >
                      {t('admin.restore')}
                    </button>
                  </div>
                </div>
              ))}
              <Pagination
                page={listQuery.data.meta.page}
                totalPages={listQuery.data.meta.totalPages}
                onPageChange={(nextPage) => {
                  const next = new URLSearchParams(params);
                  next.set('page', String(nextPage));
                  setParams(next);
                }}
              />
            </>
          )}
        </div>
      ) : null}

      {tab === 'reports' && !loading ? (
        <div className="admin-card-list admin-tab-panel">
          {(reportsQuery.data ?? []).length === 0 ? (
            <div className="admin-empty">{t('admin.noReports')}</div>
          ) : (
            (reportsQuery.data ?? []).map((report) => (
              <div key={report.id} className="card admin-card">
                <strong>
                  {report.trade
                    ? formatTradeLocalized(
                        report.trade.machineName,
                        i18n.language,
                        report.tradeId
                      )
                    : report.tradeId}
                </strong>
                <div className="admin-card__meta">
                  {t(`reportReasons.${report.reason}`)} · {report.status} ·{' '}
                  {report.reporterName || report.reporterId}
                  {report.trade
                    ? ` · ${formatTradePrice(report.trade.price, t('currency'))} · ${t(tradeStatusKey(report.trade.status))}`
                    : null}
                </div>
                {report.description ? <p>{report.description}</p> : null}
                <div className="admin-card__actions">
                  <Link
                    to={ROUTES.TRADE_DETAIL.replace(':tradeId', report.tradeId)}
                    className="btn btn--secondary"
                  >
                    {ta('openMenu')}
                  </Link>
                  {report.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() =>
                          resolveMutation.mutate({ id: report.id, status: 'resolved' })
                        }
                      >
                        {t('admin.resolve')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() =>
                          resolveMutation.mutate({ id: report.id, status: 'dismissed' })
                        }
                      >
                        {t('admin.dismiss')}
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === 'stats' && !loading && statsQuery.data ? (
        <div className="trade-stats-grid admin-tab-panel">
          <div className="card trade-stats-card">
            <span className="trade-stats-card__value">{statsQuery.data.totalActive}</span>
            <span className="trade-stats-card__label">{t('admin.totalActive')}</span>
          </div>
          <div className="card trade-stats-card">
            <span className="trade-stats-card__value">{statsQuery.data.totalSell}</span>
            <span className="trade-stats-card__label">{t('admin.totalSell')}</span>
          </div>
          <div className="card trade-stats-card">
            <span className="trade-stats-card__value">{statsQuery.data.totalBuy}</span>
            <span className="trade-stats-card__label">{t('admin.totalBuy')}</span>
          </div>
          <div className="card trade-stats-card">
            <span className="trade-stats-card__value">{statsQuery.data.totalExpired}</span>
            <span className="trade-stats-card__label">{t('admin.totalExpired')}</span>
          </div>
          <div className="card trade-stats-card">
            <span className="trade-stats-card__value">{statsQuery.data.totalReportsPending}</span>
            <span className="trade-stats-card__label">{t('admin.totalReportsPending')}</span>
          </div>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
