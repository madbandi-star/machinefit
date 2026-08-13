import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { UsageCounters } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminUsageApi } from '@/api/usage.api';
import '@/styles/admin.css';
import '@/styles/admin-usage.css';

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
    <div className="admin-usage__metrics">
      {rows.map(([label, value]) => (
        <div key={label} className="admin-usage__metric">
          <span className="admin-usage__metric-value">{value}</span>
          <span className="admin-usage__metric-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function AdminUsageUsersPage() {
  const { t } = useTranslation('admin');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  return (
    <AdminPageShell title={t('usage.usersTitle')} subtitle={t('usage.usersSubtitle')}>
      <div className="admin-usage admin-usage--split">
        <AdminPanel title={t('usage.userSearch')}>
          <form
            className="admin-usage__search"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(q.trim());
            }}
          >
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('usage.userSearchPlaceholder')}
            />
            <button type="submit" className="btn btn--primary">
              {t('usage.search')}
            </button>
          </form>
          {listQuery.isLoading ? (
            <Skeleton count={4} />
          ) : (
            <ul className="admin-usage__user-list">
              {(listQuery.data?.items ?? []).map((u) => (
                <li key={u.userId}>
                  <button
                    type="button"
                    className={`admin-usage__user-item${
                      selectedId === u.userId ? ' is-selected' : ''
                    }`}
                    onClick={() => setSelectedId(u.userId)}
                  >
                    <strong>{u.displayName || u.userId.slice(0, 8)}</strong>
                    <span className="admin-muted">{u.userId.slice(0, 8)}</span>
                    <span className="admin-muted">
                      {u.membershipType ?? u.subscriptionPlan ?? 'FREE'} ·{' '}
                      {t('usage.activeDays', { n: u.monthActiveDays })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel title={t('usage.userDetail')}>
          {!selectedId ? (
            <p className="admin-muted">{t('usage.pickUser')}</p>
          ) : detailQuery.isLoading ? (
            <Skeleton count={5} />
          ) : detailQuery.data ? (
            <div className="admin-usage__detail">
              <header className="admin-usage__detail-head">
                <h3>{detailQuery.data.user.displayName}</h3>
                <p>
                  {detailQuery.data.user.roleCode}
                </p>
                <p className="admin-muted">
                  {detailQuery.data.user.membershipType ??
                    detailQuery.data.user.subscriptionPlan ??
                    'FREE'}{' '}
                  · {new Date(detailQuery.data.user.createdAt).toLocaleDateString()}
                </p>
              </header>
              <h4>{t('usage.today')}</h4>
              <CounterGrid c={detailQuery.data.today} t={t} />
              <h4>{t('usage.last7')}</h4>
              <CounterGrid c={detailQuery.data.last7Days} t={t} />
              <h4>{t('usage.thisMonth')}</h4>
              <CounterGrid c={detailQuery.data.month} t={t} />
              <h4>{t('usage.lifetime')}</h4>
              <CounterGrid c={detailQuery.data.lifetime} t={t} />
            </div>
          ) : (
            <p className="admin-muted">{t('error')}</p>
          )}
        </AdminPanel>
      </div>
    </AdminPageShell>
  );
}
