import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Role, hasMinRole } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { machineTradeApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import '@/styles/components.css';
import '@/styles/trade.css';

export function TradeStatsPage() {
  const { t } = useTranslation('trade');
  const user = useAuthStore((s) => s.user);
  const isAdmin = hasMinRole(user?.roleCode, Role.ADMIN);

  const mineQuery = useQuery({
    queryKey: QUERY_KEYS.machineTrades({ mineOnly: true, includeExpired: true, limit: 50 }),
    queryFn: async () =>
      (
        await machineTradeApi.list({
          mineOnly: true,
          includeExpired: true,
          limit: 50,
          page: 1,
        })
      ).data.data,
  });

  const adminStatsQuery = useQuery({
    queryKey: QUERY_KEYS.adminMachineTradeStats,
    queryFn: async () => (await machineTradeApi.adminStats()).data.data,
    enabled: isAdmin,
  });

  const counts = useMemo(() => {
    const items = mineQuery.data?.items ?? [];
    return {
      total: items.length,
      sell: items.filter((i) => i.tradeType === 'sell').length,
      buy: items.filter((i) => i.tradeType === 'buy').length,
      selling: items.filter((i) => i.status === 'selling').length,
      expired: items.filter((i) => i.isExpired || i.status === 'expired').length,
    };
  }, [mineQuery.data]);

  const loading = mineQuery.isLoading || (isAdmin && adminStatsQuery.isLoading);

  return (
    <PageShell title={t('stats')} subtitle={t('statsPlaceholder')}>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 0 }}>{t('statsHint')}</p>
      {loading ? (
        <Skeleton count={2} height={72} />
      ) : (
        <>
          <div className="trade-stats-grid">
            {(
              [
                ['total', counts.total],
                ['sell', counts.sell],
                ['buy', counts.buy],
                ['selling', counts.selling],
                ['expired', counts.expired],
              ] as const
            ).map(([key, value]) => (
              <div key={key} className="card trade-stats-card">
                <span className="trade-stats-card__value">{value}</span>
                <span className="trade-stats-card__label">{t(`statsCount.${key}`)}</span>
              </div>
            ))}
          </div>

          {isAdmin && adminStatsQuery.data ? (
            <div style={{ marginTop: '1.25rem' }}>
              <h3 style={{ marginBottom: '0.65rem' }}>{t('admin.stats')}</h3>
              <div className="trade-stats-grid">
                <div className="card trade-stats-card">
                  <span className="trade-stats-card__value">
                    {adminStatsQuery.data.totalActive}
                  </span>
                  <span className="trade-stats-card__label">{t('admin.totalActive')}</span>
                </div>
                <div className="card trade-stats-card">
                  <span className="trade-stats-card__value">{adminStatsQuery.data.totalSell}</span>
                  <span className="trade-stats-card__label">{t('admin.totalSell')}</span>
                </div>
                <div className="card trade-stats-card">
                  <span className="trade-stats-card__value">{adminStatsQuery.data.totalBuy}</span>
                  <span className="trade-stats-card__label">{t('admin.totalBuy')}</span>
                </div>
                <div className="card trade-stats-card">
                  <span className="trade-stats-card__value">
                    {adminStatsQuery.data.totalExpired}
                  </span>
                  <span className="trade-stats-card__label">{t('admin.totalExpired')}</span>
                </div>
                <div className="card trade-stats-card">
                  <span className="trade-stats-card__value">
                    {adminStatsQuery.data.totalReportsPending}
                  </span>
                  <span className="trade-stats-card__label">
                    {t('admin.totalReportsPending')}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </PageShell>
  );
}
