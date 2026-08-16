import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { UsageCounters } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminUsageApi } from '@/api/usage.api';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';

type PeriodKey = 'today' | 'last7' | 'month' | 'life';

function CounterGrid({ c, t }: { c: UsageCounters; t: (k: string) => string }) {
  const rows: Array<[string, number]> = [
    [t('usage.metric.cards'), c.exerciseCardCreateCount],
    [t('usage.metric.cardUpdates'), c.exerciseCardUpdateCount],
    [t('usage.metric.saves'), c.exerciseRecordSaveCount],
    [t('usage.metric.deletes'), c.exerciseRecordDeleteCount],
    [t('usage.metric.templateCreate'), c.templateCreateCount],
    [t('usage.metric.templateUse'), c.templateUseCount],
    [t('usage.metric.timer'), c.timerStartCount],
    [t('usage.metric.rest'), c.restTimerCount],
    [t('usage.metric.voice'), c.voiceCountCount],
    [t('usage.metric.login'), c.loginCount],
  ];
  return (
    <div className="ag-metric-grid">
      {rows.map(([label, value]) => (
        <div key={label} className="ag-metric">
          <span className="ag-metric__value">{value}</span>
          <span className="ag-metric__label">{label}</span>
        </div>
      ))}
    </div>
  );
}

function countersForPeriod(
  data: {
    today: UsageCounters;
    last7Days: UsageCounters;
    month: UsageCounters;
    lifetime: UsageCounters;
  },
  period: PeriodKey
): UsageCounters {
  if (period === 'today') return data.today;
  if (period === 'last7') return data.last7Days;
  if (period === 'month') return data.month;
  return data.lifetime;
}

export function AdminUsageUsersPage() {
  const { t } = useTranslation('admin');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodKey>('today');

  const listQuery = useQuery({
    queryKey: ['admin-usage-users', search],
    queryFn: async () =>
      (await adminUsageApi.listUsers({ q: search || undefined, limit: 30 })).data.data,
  });

  const detailQuery = useQuery({
    queryKey: ['admin-usage-user', selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => (await adminUsageApi.getUser(selectedId!)).data.data,
  });

  const items = listQuery.data?.items ?? [];
  const editing = Boolean(selectedId);

  return (
    <AdminPageShell title={t('usage.usersTitle')} subtitle={t('usage.usersSubtitle')}>
      <div className="ag">
        <section className="ag-panel">
          <div className="ag-toolbar">
            <input
              className="ag-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('usage.userSearchPlaceholder')}
              aria-label={t('usage.userSearchPlaceholder')}
            />
          </div>

          <div className={`ag-layout${editing ? ' is-editing' : ''}`}>
            <div className="ag-main">
              {listQuery.isLoading ? <Skeleton count={5} height={52} /> : null}
              {!listQuery.isLoading && items.length === 0 ? (
                <p className="ag-empty">{t('usage.noUsers')}</p>
              ) : null}
              {!listQuery.isLoading && items.length > 0 ? (
                <div className="ag-queue">
                  {items.map((u) => {
                    const open = expandedId === u.userId;
                    const selected = selectedId === u.userId;
                    const plan = u.membershipType ?? u.subscriptionPlan ?? 'FREE';
                    const name = u.displayName || u.userId.slice(0, 8);
                    return (
                      <article
                        key={u.userId}
                        className={[
                          'ag-card',
                          selected ? 'is-selected' : '',
                          open ? 'is-on' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <button
                          type="button"
                          className="ag-card__main"
                          onClick={() => {
                            setSelectedId(u.userId);
                            setExpandedId((prev) => (prev === u.userId ? null : u.userId));
                            setPeriod('today');
                          }}
                        >
                          <span className="ag-card__identity">
                            <span className="ag-card__title">{name}</span>
                            <span className="ag-card__meta">
                              {u.userId.slice(0, 8)} · {t('usage.activeDays', { n: u.monthActiveDays })}
                            </span>
                          </span>
                          <span className="ag-pill ag-pill--on">{plan}</span>
                          <span className="ag-metrics" aria-hidden>
                            {u.monthActiveDays}d
                          </span>
                          <span className="ag-card__chevron" aria-hidden>
                            {open ? '▾' : '▸'}
                          </span>
                        </button>
                        {open ? (
                          <div className="ag-card__detail">
                            <p className="ag-card__excerpt">
                              {t('usage.userQuickInfo', {
                                plan,
                                days: u.monthActiveDays,
                                id: u.userId.slice(0, 12),
                              })}
                            </p>
                            <div className="ag-card__actions">
                              <button
                                type="button"
                                className="btn btn--secondary btn--sm"
                                onClick={() => setSelectedId(u.userId)}
                              >
                                {t('usage.viewDetail')}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {selectedId ? (
              <aside className="ag-side" aria-label={t('usage.userDetail')}>
                <div className="ag-editor__head">
                  <div>
                    <h2 className="ag-editor__title">
                      {detailQuery.data?.user.displayName ?? t('usage.userDetail')}
                    </h2>
                    {detailQuery.data ? (
                      <p className="ag-editor__hint">
                        {detailQuery.data.user.roleCode}
                        {' · '}
                        {detailQuery.data.user.membershipType ??
                          detailQuery.data.user.subscriptionPlan ??
                          'FREE'}
                        {' · '}
                        {new Date(detailQuery.data.user.createdAt).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setSelectedId(null)}
                  >
                    {t('usage.closeDetail')}
                  </button>
                </div>

                {detailQuery.isLoading ? <Skeleton count={4} height={40} /> : null}
                {detailQuery.isError ? <p className="ag-empty">{t('error')}</p> : null}
                {detailQuery.data ? (
                  <>
                    <div className="ag-chips" role="group" aria-label={t('usage.periodFilter')}>
                      {(
                        [
                          ['today', 'usage.periodToday'],
                          ['last7', 'usage.period7d'],
                          ['month', 'usage.periodMonth'],
                          ['life', 'usage.periodLife'],
                        ] as const
                      ).map(([key, labelKey]) => (
                        <button
                          key={key}
                          type="button"
                          className={`ag-chip${period === key ? ' is-active' : ''}`}
                          onClick={() => setPeriod(key)}
                        >
                          {t(labelKey)}
                        </button>
                      ))}
                    </div>
                    <CounterGrid c={countersForPeriod(detailQuery.data, period)} t={t} />
                  </>
                ) : null}
                {!detailQuery.isLoading && !detailQuery.data && !detailQuery.isError ? (
                  <p className="ag-empty">{t('usage.pickUser')}</p>
                ) : null}
              </aside>
            ) : null}
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
