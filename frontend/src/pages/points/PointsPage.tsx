import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { PointTransaction } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { Icon } from '@/components/icons/Icon';
import { SearchBar } from '@/components/navigation/SearchBar/SearchBar';
import { pointsApi } from '@/api/points.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import './PointsPage.css';

function formatTxWhen(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function txSearchHaystack(tx: PointTransaction, locale: string): string {
  return [
    tx.description,
    tx.actionCode,
    tx.transactionType,
    String(tx.points),
    formatTxWhen(tx.createdAt, locale),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function PointsPage() {
  const { t, i18n } = useTranslation();
  const unit = t('points.unit');
  const locale = i18n.language?.startsWith('ko') ? 'ko-KR' : i18n.language || 'en';
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery, 200);

  const summaryQuery = useQuery({
    queryKey: QUERY_KEYS.pointsBalance,
    queryFn: async () => (await pointsApi.getMine()).data.data,
  });

  const ledgerQuery = useQuery({
    queryKey: QUERY_KEYS.pointsLedger(0),
    queryFn: async () => (await pointsApi.ledger({ limit: 100, offset: 0 })).data.data,
  });

  const items = ledgerQuery.data?.items ?? [];
  const filteredItems = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((tx) => txSearchHaystack(tx, locale).includes(q));
  }, [items, debouncedQuery, locale]);

  if (summaryQuery.isLoading || ledgerQuery.isLoading) {
    return (
      <PageShell title={t('points.title')}>
        <div className="points-page points-page--loading">
          <Skeleton count={1} height={160} />
          <Skeleton count={4} height={72} />
        </div>
      </PageShell>
    );
  }

  const summary = summaryQuery.data;
  const balance = summary?.balance ?? 0;
  const earned = summary?.lifetimeEarned ?? 0;
  const hasHistory = items.length > 0;
  const hasQuery = debouncedQuery.trim().length > 0;
  const visibleCount = filteredItems.length;

  return (
    <PageShell title={t('points.title')}>
      <div className="points-page">
        <header className="points-hero">
          <div className="points-hero__glow" aria-hidden />
          <div className="points-hero__mark" aria-hidden>
            <Icon name="flame" size={22} />
          </div>
          <p className="points-hero__label">{t('points.balanceLabel')}</p>
          <p className="points-hero__balance">
            <span className="points-hero__value">{balance.toLocaleString(locale)}</span>
            <span className="points-hero__unit">{unit}</span>
          </p>
          <p className="points-hero__lifetime">
            {t('points.lifetime', { earned: earned.toLocaleString(locale) })}
          </p>
        </header>

        <section className="points-ledger" aria-labelledby="points-ledger-title">
          <div className="points-ledger__head">
            <h2 id="points-ledger-title" className="points-ledger__title">
              {t('points.historyTitle')}
            </h2>
            {hasHistory ? (
              <span className="points-ledger__count">
                {hasQuery ? `${visibleCount}/${items.length}` : items.length}
              </span>
            ) : null}
          </div>

          {hasHistory ? (
            <div className="points-ledger__search">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t('points.searchPlaceholder')}
              />
            </div>
          ) : null}

          {!hasHistory ? (
            <div className="points-empty" role="status">
              <p className="points-empty__title">{t('points.empty')}</p>
            </div>
          ) : visibleCount === 0 ? (
            <div className="points-empty" role="status">
              <p className="points-empty__title">{t('points.emptySearch')}</p>
            </div>
          ) : (
            <ul className="points-ledger__list">
              {filteredItems.map((tx) => {
                const positive = tx.points > 0;
                const label = tx.description || tx.actionCode || tx.transactionType;
                return (
                  <li
                    key={tx.id}
                    className={`points-tx${positive ? ' points-tx--in' : ' points-tx--out'}`}
                  >
                    <span className="points-tx__badge" aria-hidden>
                      {positive ? '+' : '−'}
                    </span>
                    <div className="points-tx__body">
                      <p className="points-tx__desc">{label}</p>
                      <time className="points-tx__time" dateTime={tx.createdAt}>
                        {formatTxWhen(tx.createdAt, locale)}
                      </time>
                    </div>
                    <span className="points-tx__amount">
                      {positive ? '+' : ''}
                      {tx.points.toLocaleString(locale)}
                      <span className="points-tx__unit">{unit}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}
