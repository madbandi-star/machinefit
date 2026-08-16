import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { ScrollCarousel } from '@/components/navigation/ScrollCarousel/ScrollCarousel';
import { adminUsageApi } from '@/api/usage.api';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';

const EVENT_FILTERS = [
  'ALL',
  'RATE_LIMIT_EXCEEDED',
  'DAILY_QUOTA_EXCEEDED',
  'STOCK_LIMIT_EXCEEDED',
  'EQUIPMENT_CARD_LIMIT_EXCEEDED',
  'RECOMMENDATION_LIMIT_EXCEEDED',
  'BURST_REQUEST_DETECTED',
] as const;

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function AdminAbusePage() {
  const { t } = useTranslation('admin');
  const [range, setRange] = useState<'1' | '7' | '30'>('1');
  const [eventType, setEventType] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const from = useMemo(() => {
    if (range === '1') return daysAgoIso(0);
    if (range === '7') return daysAgoIso(7);
    return daysAgoIso(30);
  }, [range]);

  const query = useQuery({
    queryKey: ['admin-abuse-events', from, eventType],
    queryFn: async () =>
      (
        await adminUsageApi.listAbuseEvents({
          from,
          eventType: eventType === 'ALL' ? undefined : eventType,
          limit: 100,
        })
      ).data.data,
  });

  const items = (query.data?.items ?? []).filter((ev) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const hay = `${ev.userId ?? ''} ${ev.endpoint} ${ev.eventType} ${ev.severity}`.toLowerCase();
    return hay.includes(q);
  });

  return (
    <AdminPageShell title={t('usage.abuseTitle')} subtitle={t('usage.abuseSubtitle')}>
      <div className="ag">
        <section className="ag-panel">
          <div className="ag-toolbar">
            <input
              type="search"
              className="ag-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('usage.abuseSearch')}
              aria-label={t('usage.abuseSearch')}
            />
            <ScrollCarousel
              className="chip-carousel"
              scrollerClassName="ag-chips"
              scrollerProps={{ role: 'group', 'aria-label': t('usage.abuseRange') }}
            >
              {(
                [
                  ['1', t('usage.abuseToday')],
                  ['7', t('usage.abuse7d')],
                  ['30', t('usage.abuse30d')],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`ag-chip${range === value ? ' is-active' : ''}`}
                  onClick={() => setRange(value)}
                >
                  {label}
                </button>
              ))}
            </ScrollCarousel>
            <ScrollCarousel
              className="chip-carousel"
              scrollerClassName="ag-chips"
              scrollerProps={{ role: 'group', 'aria-label': t('usage.abuseType') }}
            >
              {EVENT_FILTERS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`ag-chip${eventType === value ? ' is-active' : ''}`}
                  onClick={() => setEventType(value)}
                >
                  {value === 'ALL' ? t('usage.abuseAllTypes') : value}
                </button>
              ))}
            </ScrollCarousel>
          </div>

          {query.isLoading ? <Skeleton count={6} height={40} /> : null}
          {!query.isLoading && items.length === 0 ? (
            <p className="ag-empty">{t('usage.abuseEmpty')}</p>
          ) : null}
          {items.length > 0 ? (
            <div className="ag-queue">
              {items.map((ev) => (
                <article key={ev.id} className="ag-card">
                  <div className="ag-card__main" style={{ cursor: 'default' }}>
                    <span className="ag-card__identity">
                      <span className="ag-card__title">{ev.eventType}</span>
                      <span className="ag-card__meta">
                        {(ev.userId ?? '—').slice(0, 8)}
                        {' · '}
                        {ev.endpoint || '—'}
                        {' · '}
                        {ev.createdAt.slice(0, 19).replace('T', ' ')}
                      </span>
                    </span>
                    <span
                      className={`ag-pill ${
                        ev.severity === 'CRITICAL' || ev.severity === 'HIGH'
                          ? 'ag-pill--danger'
                          : ev.severity === 'MEDIUM'
                            ? 'ag-pill--warn'
                            : 'ag-pill--on'
                      }`}
                    >
                      {ev.severity}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </AdminPageShell>
  );
}
