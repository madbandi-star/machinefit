import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { pointsApi } from '@/api/points.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import '@/styles/components.css';

function formatPoints(n: number): string {
  return `${n.toLocaleString()} P`;
}

export function PointsPage() {
  const { t } = useTranslation();

  const summaryQuery = useQuery({
    queryKey: QUERY_KEYS.pointsBalance,
    queryFn: async () => (await pointsApi.getMine()).data.data,
  });

  const ledgerQuery = useQuery({
    queryKey: QUERY_KEYS.pointsLedger(0),
    queryFn: async () => (await pointsApi.ledger({ limit: 50, offset: 0 })).data.data,
  });

  if (summaryQuery.isLoading || ledgerQuery.isLoading) {
    return (
      <PageShell title={t('points.title')}>
        <Skeleton count={5} />
      </PageShell>
    );
  }

  const summary = summaryQuery.data;
  const items = ledgerQuery.data?.items ?? [];

  return (
    <PageShell title={t('points.title')} subtitle={t('points.subtitle')}>
      <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
        <p className="form-section__desc">{t('points.balanceLabel')}</p>
        <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
          {formatPoints(summary?.balance ?? 0)}
        </p>
        <p className="form-section__desc" style={{ marginTop: 'var(--space-sm)' }}>
          {t('points.lifetime', {
            earned: summary?.lifetimeEarned ?? 0,
            spent: summary?.lifetimeSpent ?? 0,
          })}
        </p>
      </div>

      <h3 className="form-section__title">{t('points.historyTitle')}</h3>
      {items.length === 0 ? (
        <p className="form-section__desc">{t('points.empty')}</p>
      ) : (
        <ul className="list-nav" aria-label={t('points.historyTitle')}>
          {items.map((tx) => {
            const positive = tx.points > 0;
            return (
              <li key={tx.id} className="list-nav__item" style={{ cursor: 'default' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="list-nav__label">
                    {tx.description || tx.actionCode || tx.transactionType}
                  </div>
                  <div className="form-section__desc" style={{ margin: 0 }}>
                    {new Date(tx.createdAt).toLocaleString()}
                  </div>
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    color: positive ? 'var(--color-success, #1a7f37)' : 'var(--color-danger, #b42318)',
                  }}
                >
                  {positive ? '+' : ''}
                  {tx.points}P
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
