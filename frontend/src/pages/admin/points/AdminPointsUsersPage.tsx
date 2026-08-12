import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminPointsApi } from '@/api/points.api';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-usage.css';

export function AdminPointsUsersPage() {
  const { t } = useTranslation('admin');
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
        description: adjustDesc.trim() || t('points.manualAdjust'),
      }),
    onSuccess: () => {
      showToast(t('saved'), 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-points-user', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['admin-points-users'] });
      setAdjustDesc('');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  return (
    <AdminPageShell title={t('points.usersTitle')} subtitle={t('points.usersSubtitle')}>
      <div className="admin-usage admin-usage--split">
        <AdminPanel title={t('points.userList')}>
          <input
            className="input"
            placeholder={t('points.searchUsers')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ marginBottom: 'var(--space-sm)' }}
          />
          {usersQuery.isLoading ? (
            <Skeleton count={4} />
          ) : (
            <ul className="admin-usage__policy-list">
              {(usersQuery.data ?? []).map((u) => (
                <li key={u.userId}>
                  <button
                    type="button"
                    className={
                      u.userId === selectedId
                        ? 'admin-usage__policy-btn admin-usage__policy-btn--active'
                        : 'admin-usage__policy-btn'
                    }
                    onClick={() => setSelectedId(u.userId)}
                  >
                    <strong>{u.displayName || u.email || u.userId.slice(0, 8)}</strong>
                    <span>
                      {u.balance}P · +{u.lifetimeEarned} / −{u.lifetimeSpent}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel title={t('points.userDetail')}>
          {!selectedId ? (
            <p className="admin-usage__banner">{t('points.selectUser')}</p>
          ) : detailQuery.isLoading ? (
            <Skeleton count={4} />
          ) : (
            <div className="form-stack">
              <p>
                <strong>{detailQuery.data?.displayName}</strong>
                <br />
                {detailQuery.data?.email}
              </p>
              <p>
                {t('points.balance')}: <strong>{detailQuery.data?.summary.balance ?? 0}P</strong>
              </p>
              <div className="form-stack">
                <label className="admin-usage__field">
                  <span>{t('points.adjustAmount')}</span>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={adjustPoints}
                    onChange={(e) => setAdjustPoints(Math.max(1, Number(e.target.value) || 1))}
                  />
                </label>
                <label className="admin-usage__field">
                  <span>{t('points.adjustDirection')}</span>
                  <select
                    className="input"
                    value={adjustDir}
                    onChange={(e) => setAdjustDir(e.target.value as 'grant' | 'deduct')}
                  >
                    <option value="grant">{t('points.grant')}</option>
                    <option value="deduct">{t('points.deduct')}</option>
                  </select>
                </label>
                <label className="admin-usage__field">
                  <span>{t('points.adjustReason')}</span>
                  <input
                    className="input"
                    value={adjustDesc}
                    onChange={(e) => setAdjustDesc(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={adjustMutation.isPending}
                  onClick={() => adjustMutation.mutate()}
                >
                  {t('points.applyAdjust')}
                </button>
              </div>
              <h4>{t('points.recentTx')}</h4>
              <ul className="admin-usage__policy-list">
                {(detailQuery.data?.recent ?? []).slice(0, 20).map((tx) => (
                  <li key={tx.id}>
                    <span>
                      {tx.description || tx.actionCode} · {tx.points > 0 ? '+' : ''}
                      {tx.points}P
                    </span>
                    <small>{new Date(tx.createdAt).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </AdminPanel>
      </div>
    </AdminPageShell>
  );
}
