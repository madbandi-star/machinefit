import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';

type Tab = 'posts' | 'requests' | 'reports';

export function AdminModerationPage() {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [tab, setTab] = useState<Tab>('requests');

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: [...QUERY_KEYS.adminModeration, 'posts'],
    queryFn: async () => {
      const res = await adminApi.listPosts();
      return res.data.data;
    },
    enabled: tab === 'posts',
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: [...QUERY_KEYS.adminModeration, 'requests'],
    queryFn: async () => {
      const res = await adminApi.listMachineRequests();
      return res.data.data;
    },
    enabled: tab === 'requests',
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: [...QUERY_KEYS.adminModeration, 'reports'],
    queryFn: async () => {
      const res = await adminApi.listReports();
      return res.data.data;
    },
    enabled: tab === 'reports',
  });

  const postMutation = useMutation({
    mutationFn: ({ id, isHidden, isPinned }: { id: string; isHidden?: boolean; isPinned?: boolean }) =>
      adminApi.moderatePost(id, { isHidden, isPinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminModeration });
      showToast(t('saved'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const requestMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      adminApi.updateMachineRequest(id, { status, adminNote: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminModeration });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminDashboard });
      showToast(t('saved'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const reportMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'resolved' | 'dismissed' }) =>
      adminApi.resolveReport(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminModeration });
      showToast(t('saved'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const isLoading =
    (tab === 'posts' && postsLoading) ||
    (tab === 'requests' && requestsLoading) ||
    (tab === 'reports' && reportsLoading);

  return (
    <PageShell title={t('moderation')}>
      <div className="admin-tabs">
        {(['posts', 'requests', 'reports'] as Tab[]).map((key) => (
          <button
            key={key}
            className={`btn ${tab === key ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setTab(key)}
          >
            {t(key)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton count={3} />
      ) : tab === 'posts' ? (
        <div className="admin-table" style={{ marginTop: '1rem' }}>
          {posts?.map((post) => (
            <div key={post.id} className="card admin-table__row">
              <div>
                <strong>{post.title}</strong>
                <p className="admin-table__meta">
                  {post.authorName}
                  {post.isHidden && ' · Hidden'}
                  {post.isPinned && ' · Pinned'}
                </p>
              </div>
              <div className="admin-table__actions">
                <button
                  className="btn btn--secondary"
                  onClick={() => postMutation.mutate({ id: post.id, isHidden: !post.isHidden })}
                >
                  {post.isHidden ? t('unhide') : t('hide')}
                </button>
                <button
                  className="btn btn--secondary"
                  onClick={() => postMutation.mutate({ id: post.id, isPinned: !post.isPinned })}
                >
                  {post.isPinned ? t('unpin') : t('pin')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'requests' ? (
        <div className="admin-table" style={{ marginTop: '1rem' }}>
          {requests?.map((req) => (
            <div key={req.id} className="card admin-table__row">
              <div>
                <strong>{req.machineName}</strong>
                <p className="admin-table__meta">
                  {req.brandName} · {req.authorName} · {req.status}
                </p>
              </div>
              {req.status === 'pending' && (
                <div className="admin-table__actions">
                  <button
                    className="btn btn--primary"
                    onClick={() => requestMutation.mutate({ id: req.id, status: 'approved' })}
                  >
                    {t('approve')}
                  </button>
                  <button
                    className="btn btn--secondary"
                    onClick={() => requestMutation.mutate({ id: req.id, status: 'rejected' })}
                  >
                    {t('reject')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-table" style={{ marginTop: '1rem' }}>
          {reports?.map((report) => (
            <div key={report.id} className="card admin-table__row">
              <div>
                <strong>{t('reason')}: {report.reason}</strong>
                <p className="admin-table__meta">
                  {report.description} · {report.status}
                </p>
              </div>
              {report.status === 'pending' && (
                <div className="admin-table__actions">
                  <button
                    className="btn btn--primary"
                    onClick={() => reportMutation.mutate({ id: report.id, status: 'resolved' })}
                  >
                    {t('resolve')}
                  </button>
                  <button
                    className="btn btn--secondary"
                    onClick={() => reportMutation.mutate({ id: report.id, status: 'dismissed' })}
                  >
                    {t('dismiss')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
