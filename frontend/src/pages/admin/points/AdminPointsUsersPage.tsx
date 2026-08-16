import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminPointsApi } from '@/api/points.api';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';

const HIGH_BALANCE = 1000;

export function AdminPointsUsersPage() {
  const { t } = useTranslation(['admin', 'common']);
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adjustPoints, setAdjustPoints] = useState(10);
  const [adjustDir, setAdjustDir] = useState<'grant' | 'deduct'>('grant');
  const [adjustDesc, setAdjustDesc] = useState('');

  const usersQuery = useQuery({
    queryKey: ['admin-points-users', q],
    queryFn: async () => (await adminPointsApi.listUsers(q)).data.data,
  });

  const detailQuery = useQuery({
    queryKey: ['admin-points-user', selectedId],
    queryFn: async () => (await adminPointsApi.getUser(selectedId!)).data.data,
    enabled: Boolean(selectedId),
  });

  const adjustMutation = useMutation({
    mutationFn: async () =>
      adminPointsApi.adjust({
        userId: selectedId!,
        points: adjustPoints,
        direction: adjustDir,
        description: adjustDesc.trim() || t('admin:points.manualAdjust'),
      }),
    onSuccess: () => {
      showToast(t('admin:saved'), 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-points-user', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['admin-points-users'] });
      setAdjustDesc('');
    },
    onError: () => showToast(t('admin:error'), 'error'),
  });

  const users = usersQuery.data ?? [];

  const stats = useMemo(() => {
    const sumBalances = users.reduce((sum, u) => sum + u.balance, 0);
    const highBalance = users.filter((u) => u.balance > HIGH_BALANCE).length;
    return {
      inView: users.length,
      sumBalances,
      highBalance,
    };
  }, [users]);

  const closeEditor = () => setSelectedId(null);

  return (
    <AdminPageShell title={t('admin:points.usersTitle')} subtitle={t('admin:points.usersSubtitle')}>
      <div className="ag">
        <section className="ag-kpis ag-kpis--4" aria-label={t('admin:points.stats')}>
          <div className="ag-kpi">
            <span className="ag-kpi__value">{stats.inView}</span>
            <span className="ag-kpi__label">{t('admin:points.statUsersInView')}</span>
          </div>
          <div className="ag-kpi">
            <span className="ag-kpi__value">{stats.sumBalances.toLocaleString()}P</span>
            <span className="ag-kpi__label">{t('admin:points.statSumBalances')}</span>
          </div>
          <div className={`ag-kpi${stats.highBalance > 0 ? ' is-warn' : ''}`}>
            <span className="ag-kpi__value">{stats.highBalance}</span>
            <span className="ag-kpi__label">{t('admin:points.highBalance')}</span>
          </div>
        </section>

        <section className="ag-panel">
          <div className="ag-toolbar">
            <input
              className="ag-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('admin:points.searchUsers')}
              aria-label={t('admin:points.searchUsers')}
            />
          </div>

          <div className={`ag-layout${selectedId ? ' is-editing' : ''}`}>
            <div className="ag-main">
              {usersQuery.isLoading ? <Skeleton count={5} height={52} /> : null}
              {!usersQuery.isLoading && users.length === 0 ? (
                <p className="ag-empty">{t('admin:points.emptyUsers')}</p>
              ) : null}
              {!usersQuery.isLoading && users.length > 0 ? (
                <div className="ag-queue">
                  {users.map((u) => {
                    const isSelected = u.userId === selectedId;
                    const high = u.balance > HIGH_BALANCE;
                    return (
                      <article
                        key={u.userId}
                        className={[
                          'ag-card',
                          isSelected ? 'is-selected' : '',
                          high ? 'is-warn' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <button
                          type="button"
                          className="ag-card__main"
                          onClick={() => setSelectedId(u.userId)}
                        >
                          <span className="ag-card__identity">
                            <span className="ag-card__title">
                              {u.displayName || u.email || u.userId.slice(0, 8)}
                            </span>
                            <span className="ag-card__meta">
                              {u.balance.toLocaleString()}P
                              {' · '}
                              +{u.lifetimeEarned.toLocaleString()} / −
                              {u.lifetimeSpent.toLocaleString()}
                            </span>
                          </span>
                          <span className="ag-metrics">
                            <span>
                              +{u.lifetimeEarned.toLocaleString()} / −
                              {u.lifetimeSpent.toLocaleString()}
                            </span>
                          </span>
                          {high ? (
                            <span className="ag-pill ag-pill--warn">{t('admin:points.highBalance')}</span>
                          ) : null}
                        </button>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {selectedId ? (
              <aside className="ag-editor" aria-label={t('admin:points.userDetail')}>
                <div className="ag-editor__head">
                  <div>
                    <h2 className="ag-editor__title">{t('admin:points.userDetail')}</h2>
                    <p className="ag-editor__hint">
                      {detailQuery.data?.displayName ||
                        detailQuery.data?.email ||
                        selectedId.slice(0, 8)}
                    </p>
                  </div>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={closeEditor}>
                    {t('common:actions.close')}
                  </button>
                </div>

                {detailQuery.isLoading ? (
                  <Skeleton count={4} />
                ) : (
                  <>
                    <div className="ag-kpi">
                      <span className="ag-kpi__value">
                        {(detailQuery.data?.summary.balance ?? 0).toLocaleString()}P
                      </span>
                      <span className="ag-kpi__label">{t('admin:points.balance')}</span>
                    </div>

                    <div className="ag-metric-grid">
                      <div className="ag-metric">
                        <span className="ag-metric__value">
                          +{(detailQuery.data?.summary.lifetimeEarned ?? 0).toLocaleString()}
                        </span>
                        <span className="ag-metric__label">{t('admin:points.lifetimeEarned')}</span>
                      </div>
                      <div className="ag-metric">
                        <span className="ag-metric__value">
                          −{(detailQuery.data?.summary.lifetimeSpent ?? 0).toLocaleString()}
                        </span>
                        <span className="ag-metric__label">{t('admin:points.lifetimeSpent')}</span>
                      </div>
                    </div>

                    <div className="ag-editor__form">
                      <label className="ag-field">
                        <span>{t('admin:points.adjustAmount')}</span>
                        <input
                          className="input"
                          type="number"
                          min={1}
                          value={adjustPoints}
                          onChange={(e) => setAdjustPoints(Math.max(1, Number(e.target.value) || 1))}
                        />
                      </label>
                      <label className="ag-field">
                        <span>{t('admin:points.adjustDirection')}</span>
                        <select
                          className="input"
                          value={adjustDir}
                          onChange={(e) => setAdjustDir(e.target.value as 'grant' | 'deduct')}
                        >
                          <option value="grant">{t('admin:points.grant')}</option>
                          <option value="deduct">{t('admin:points.deduct')}</option>
                        </select>
                      </label>
                      <label className="ag-field">
                        <span>{t('admin:points.adjustReason')}</span>
                        <input
                          className="input"
                          value={adjustDesc}
                          onChange={(e) => setAdjustDesc(e.target.value)}
                        />
                      </label>
                      <div className="ag-editor__actions">
                        <button
                          type="button"
                          className="btn btn--primary"
                          disabled={adjustMutation.isPending}
                          onClick={() => adjustMutation.mutate()}
                        >
                          {t('admin:points.applyAdjust')}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="ag-editor__title">{t('admin:points.recentTx')}</h3>
                      <div className="ag-queue">
                        {(detailQuery.data?.recent ?? []).slice(0, 20).map((tx) => (
                          <article key={tx.id} className="ag-card">
                            <div className="ag-card__main">
                              <span className="ag-card__identity">
                                <span className="ag-card__title">
                                  {tx.description || tx.actionCode || '—'}
                                </span>
                                <span className="ag-card__meta">
                                  {new Date(tx.createdAt).toLocaleString()}
                                </span>
                              </span>
                              <span
                                className={`ag-pill ${
                                  tx.points >= 0 ? 'ag-pill--on' : 'ag-pill--off'
                                }`}
                              >
                                {tx.points > 0 ? '+' : ''}
                                {tx.points}P
                              </span>
                            </div>
                          </article>
                        ))}
                        {(detailQuery.data?.recent ?? []).length === 0 ? (
                          <p className="ag-empty">{t('admin:points.emptyTx')}</p>
                        ) : null}
                      </div>
                    </div>
                  </>
                )}
              </aside>
            ) : null}
          </div>
          {!selectedId ? <p className="ag-banner">{t('admin:points.pickUser')}</p> : null}
        </section>
      </div>
    </AdminPageShell>
  );
}
