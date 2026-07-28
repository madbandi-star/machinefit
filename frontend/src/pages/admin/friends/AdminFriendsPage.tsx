import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState';
import { friendsApi } from '@/api/friends.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import '@/styles/admin.css';
import '@/styles/friends.css';

type Tab = 'overview' | 'relations' | 'reports' | 'spam';

export function AdminFriendsPage() {
  const { t } = useTranslation(['friends', 'admin']);
  const [tab, setTab] = useState<Tab>('overview');
  const [page, setPage] = useState(1);
  const showToast = useUIStore((s) => s.showToast);
  const qc = useQueryClient();

  const statsQuery = useQuery({
    queryKey: QUERY_KEYS.friendsAdminStats,
    queryFn: async () => (await friendsApi.adminStats()).data.data,
  });

  const listQuery = useQuery({
    queryKey: QUERY_KEYS.friendsAdminList(page),
    queryFn: async () => (await friendsApi.adminFriendships({ page, limit: 20 })).data.data,
    enabled: tab === 'relations',
  });

  const reportsQuery = useQuery({
    queryKey: QUERY_KEYS.friendsAdminReports,
    queryFn: async () => (await friendsApi.adminReports()).data.data,
    enabled: tab === 'reports',
  });

  const spamQuery = useQuery({
    queryKey: QUERY_KEYS.friendsAdminSpam,
    queryFn: async () => (await friendsApi.adminSpam()).data.data,
    enabled: tab === 'spam',
  });

  const delMut = useMutation({
    mutationFn: (id: string) => friendsApi.adminDeleteFriendship(id),
    onSuccess: () => {
      showToast(t('admin.deleted'), 'success');
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.friendsAdminList(page) });
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.friendsAdminStats });
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('admin.deleted')), 'error'),
  });

  const resolveMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'resolved' | 'dismissed' }) =>
      friendsApi.adminResolveReport(id, status),
    onSuccess: () => {
      showToast(t('admin.reportUpdated'), 'success');
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.friendsAdminReports });
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('admin.reportUpdated')), 'error'),
  });

  const blockMut = useMutation({
    mutationFn: (userId: string) => friendsApi.adminBlock(userId, 'spam_friend_requests'),
    onSuccess: () => {
      showToast(t('admin.userBlocked'), 'success');
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.friendsAdminSpam });
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('admin.userBlocked')), 'error'),
  });

  return (
    <div className="friends-page">
      <AdminPageShell title={t('admin.title')} subtitle={t('admin:menu.friendsDesc')}>
        <div className="admin-tabs admin-tabs--wide">
          {(['overview', 'relations', 'reports', 'spam'] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={`admin-tabs__btn${tab === key ? ' is-active' : ''}`}
              onClick={() => {
                setTab(key);
                setPage(1);
              }}
            >
              {t(`admin.tab.${key}`)}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            {statsQuery.isLoading || !statsQuery.data ? (
              <Skeleton count={4} height={48} />
            ) : (
              <AdminPanel title={t('admin.tab.overview')} className="admin-tab-panel">
                <div className="admin-stats">
                <div className="admin-stat">
                  <div className="admin-stat__value">{statsQuery.data.friendshipCount}</div>
                  <div className="admin-stat__label">{t('admin.stats.friendships')}</div>
                </div>
                <div className="admin-stat">
                  <div className="admin-stat__value">{statsQuery.data.pendingRequestCount}</div>
                  <div className="admin-stat__label">{t('admin.stats.pending')}</div>
                </div>
                <div className="admin-stat">
                  <div className="admin-stat__value">{statsQuery.data.blockCount}</div>
                  <div className="admin-stat__label">{t('admin.stats.blocks')}</div>
                </div>
                <div className="admin-stat">
                  <div className="admin-stat__value">{statsQuery.data.reportCount}</div>
                  <div className="admin-stat__label">{t('admin.stats.reports')}</div>
                </div>
                <div className="admin-stat">
                  <div className="admin-stat__value">{statsQuery.data.spamRequestSuspects}</div>
                  <div className="admin-stat__label">{t('admin.stats.spam')}</div>
                </div>
                </div>
              </AdminPanel>
            )}
          </>
        )}

        {tab === 'relations' && (
          <>
            {listQuery.isLoading ? (
              <Skeleton count={5} height={56} />
            ) : !listQuery.data?.items.length ? (
              <EmptyState title={t('admin.emptyRelations')} />
            ) : (
              <AdminPanel
                title={t('admin.tab.relations')}
                count={listQuery.data.items.length}
                countLabel={t('admin:listCount', { count: listQuery.data.items.length })}
                className="admin-tab-panel"
              >
                <ul className="friends-list">
                  {listQuery.data.items.map((row) => (
                    <li key={row.id} className="friends-row">
                      <div className="friends-row__meta">
                        <div className="friends-row__name">
                          {row.lowName} ↔ {row.highName}
                        </div>
                        <div className="friends-row__sub">{row.createdAt}</div>
                      </div>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => {
                          if (window.confirm(t('admin.confirmDelete'))) delMut.mutate(row.id);
                        }}
                      >
                        {t('admin.delete')}
                      </button>
                    </li>
                  ))}
                </ul>
              </AdminPanel>
            )}
            {listQuery.data && page * 20 < listQuery.data.total ? (
              <button
                type="button"
                className="btn btn--secondary btn--block"
                onClick={() => setPage((p) => p + 1)}
              >
                {t('loadMore')}
              </button>
            ) : null}
          </>
        )}

        {tab === 'reports' && (
          <>
            {reportsQuery.isLoading ? (
              <Skeleton count={4} height={64} />
            ) : !reportsQuery.data?.length ? (
              <EmptyState title={t('admin.emptyReports')} />
            ) : (
              <AdminPanel
                title={t('admin.tab.reports')}
                count={reportsQuery.data.length}
                countLabel={t('admin:listCount', { count: reportsQuery.data.length })}
                className="admin-tab-panel"
              >
                <ul className="friends-list">
                  {reportsQuery.data.map((r) => (
                    <li key={r.id} className="friends-row">
                      <div className="friends-row__meta">
                        <div className="friends-row__name">
                          {r.reason} · {r.status}
                        </div>
                        <div className="friends-row__sub">
                          {r.reporterId.slice(0, 8)} → {r.reportedUserId.slice(0, 8)}
                          {r.description ? ` · ${r.description}` : ''}
                        </div>
                      </div>
                      {r.status === 'pending' ? (
                        <div className="friends-row__actions">
                          <button
                            type="button"
                            className="btn btn--primary"
                            onClick={() => resolveMut.mutate({ id: r.id, status: 'resolved' })}
                          >
                            {t('admin.resolve')}
                          </button>
                          <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={() => resolveMut.mutate({ id: r.id, status: 'dismissed' })}
                          >
                            {t('admin.dismiss')}
                          </button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </AdminPanel>
            )}
          </>
        )}

        {tab === 'spam' && (
          <>
            {spamQuery.isLoading ? (
              <Skeleton count={4} height={56} />
            ) : !spamQuery.data?.length ? (
              <EmptyState title={t('admin.emptySpam')} />
            ) : (
              <AdminPanel
                title={t('admin.tab.spam')}
                count={spamQuery.data.length}
                countLabel={t('admin:listCount', { count: spamQuery.data.length })}
                className="admin-tab-panel"
              >
                <ul className="friends-list">
                  {spamQuery.data.map((s) => (
                    <li key={s.userId} className="friends-row">
                      <div className="friends-row__meta">
                        <div className="friends-row__name">{s.displayName}</div>
                        <div className="friends-row__sub">
                          {s.email} · {s.requestCount}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => {
                          if (window.confirm(t('admin.confirmBlock'))) blockMut.mutate(s.userId);
                        }}
                      >
                        {t('block')}
                      </button>
                    </li>
                  ))}
                </ul>
              </AdminPanel>
            )}
          </>
        )}
      </AdminPageShell>
    </div>
  );
}
