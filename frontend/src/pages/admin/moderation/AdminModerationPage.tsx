import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';

type Tab = 'posts' | 'requests' | 'reports';
type RequestFilter = 'all' | 'pending';

function statusPillClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'pending' || s === 'reviewing') return 'ag-pill ag-pill--warn';
  if (s === 'resolved' || s === 'approved' || s === 'active') return 'ag-pill ag-pill--on';
  if (s === 'rejected' || s === 'dismissed' || s === 'hidden') return 'ag-pill ag-pill--danger';
  return 'ag-pill ag-pill--off';
}

export function AdminModerationPage() {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [tab, setTab] = useState<Tab>('requests');
  const [requestFilter, setRequestFilter] = useState<RequestFilter>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: [...QUERY_KEYS.adminModeration, 'posts'],
    queryFn: async () => {
      const res = await adminApi.listPosts();
      return res.data.data;
    },
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: [...QUERY_KEYS.adminModeration, 'requests'],
    queryFn: async () => {
      const res = await adminApi.listMachineRequests();
      return res.data.data;
    },
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: [...QUERY_KEYS.adminModeration, 'reports'],
    queryFn: async () => {
      const res = await adminApi.listReports();
      return res.data.data;
    },
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
    mutationFn: ({ id, status }: { id: string; status: 'reviewing' | 'rejected' }) =>
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

  const counts = useMemo(() => {
    const reqList = requests ?? [];
    const pendingRequests = reqList.filter((r) => r.status === 'pending').length;
    return {
      posts: posts?.length ?? 0,
      requests: reqList.length,
      pendingRequests,
      reports: reports?.length ?? 0,
    };
  }, [posts, requests, reports]);

  const filteredRequests = useMemo(() => {
    const list = requests ?? [];
    if (requestFilter === 'pending') return list.filter((r) => r.status === 'pending');
    return list;
  }, [requests, requestFilter]);

  const isLoading =
    (tab === 'posts' && postsLoading) ||
    (tab === 'requests' && requestsLoading) ||
    (tab === 'reports' && reportsLoading);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <AdminPageShell title={t('moderation')} subtitle={t('menu.moderationDesc')}>
      <div className="ag">
        <section className="ag-kpis ag-kpis--4" aria-label={t('moderation')}>
          <button
            type="button"
            className={`ag-kpi${tab === 'posts' ? ' is-active' : ''}`}
            onClick={() => {
              setTab('posts');
              setExpandedId(null);
            }}
          >
            <span className="ag-kpi__value">{counts.posts}</span>
            <span className="ag-kpi__label">{t('posts')}</span>
          </button>
          <button
            type="button"
            className={`ag-kpi${tab === 'requests' ? ' is-active' : ''}${
              counts.pendingRequests > 0 ? ' is-warn' : ''
            }`}
            onClick={() => {
              setTab('requests');
              setExpandedId(null);
            }}
          >
            <span className="ag-kpi__value">{counts.requests}</span>
            <span className="ag-kpi__label">{t('requests')}</span>
          </button>
          <button
            type="button"
            className={`ag-kpi${tab === 'reports' ? ' is-active' : ''}`}
            onClick={() => {
              setTab('reports');
              setExpandedId(null);
            }}
          >
            <span className="ag-kpi__value">{counts.reports}</span>
            <span className="ag-kpi__label">{t('reports')}</span>
          </button>
          {tab === 'requests' ? (
            <div className="ag-kpi">
              <span className="ag-kpi__value">{counts.pendingRequests}</span>
              <span className="ag-kpi__label">{t('pendingShort')}</span>
            </div>
          ) : (
            <div className="ag-kpi is-muted">
              <span className="ag-kpi__value">—</span>
              <span className="ag-kpi__label">{t('pendingShort')}</span>
            </div>
          )}
        </section>

        <section className="ag-panel">
          {tab === 'requests' ? (
            <div className="ag-toolbar">
              <div className="ag-chips" role="group" aria-label={t('status')}>
                <button
                  type="button"
                  className={`ag-chip${requestFilter === 'pending' ? ' is-active' : ''}`}
                  onClick={() => setRequestFilter('pending')}
                >
                  {t('pendingShort')}
                  <span className="ag-chip__count">{counts.pendingRequests}</span>
                </button>
                <button
                  type="button"
                  className={`ag-chip${requestFilter === 'all' ? ' is-active' : ''}`}
                  onClick={() => setRequestFilter('all')}
                >
                  {t('filterAllShort')}
                  <span className="ag-chip__count">{counts.requests}</span>
                </button>
              </div>
            </div>
          ) : null}

          {isLoading ? <Skeleton count={4} height={52} /> : null}

          {!isLoading && tab === 'posts' ? (
            <div className="ag-queue">
              {(posts ?? []).length === 0 ? (
                <p className="ag-empty">{t('moderationEmpty')}</p>
              ) : (
                (posts ?? []).map((post) => {
                  const open = expandedId === post.id;
                  return (
                    <article
                      key={post.id}
                      className={['ag-card', post.isHidden ? 'is-off' : '', open ? 'is-selected' : '']
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <button
                        type="button"
                        className="ag-card__main"
                        onClick={() => toggleExpand(post.id)}
                      >
                        <span className="ag-card__identity">
                          <span className="ag-card__title">{post.title}</span>
                          <span className="ag-card__meta">{post.authorName ?? '—'}</span>
                        </span>
                        {post.isHidden ? (
                          <span className="ag-pill ag-pill--danger">{t('statusHidden')}</span>
                        ) : post.isPinned ? (
                          <span className="ag-pill ag-pill--warn">{t('statusPinned')}</span>
                        ) : (
                          <span className="ag-pill ag-pill--on">{t('statusVisible')}</span>
                        )}
                        <span className="ag-card__chevron" aria-hidden>
                          {open ? '▾' : '▸'}
                        </span>
                      </button>
                      {open ? (
                        <div className="ag-card__detail">
                          <div className="ag-card__actions">
                            <button
                              type="button"
                              className="btn btn--secondary btn--sm"
                              disabled={postMutation.isPending}
                              onClick={() =>
                                postMutation.mutate({ id: post.id, isHidden: !post.isHidden })
                              }
                            >
                              {post.isHidden ? t('unhide') : t('hide')}
                            </button>
                            <button
                              type="button"
                              className="btn btn--secondary btn--sm"
                              disabled={postMutation.isPending}
                              onClick={() =>
                                postMutation.mutate({ id: post.id, isPinned: !post.isPinned })
                              }
                            >
                              {post.isPinned ? t('unpin') : t('pin')}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          ) : null}

          {!isLoading && tab === 'requests' ? (
            <div className="ag-queue">
              {filteredRequests.length === 0 ? (
                <p className="ag-empty">{t('moderationEmpty')}</p>
              ) : (
                filteredRequests.map((req) => {
                  const open = expandedId === req.id;
                  return (
                    <article
                      key={req.id}
                      className={['ag-card', open ? 'is-selected' : ''].filter(Boolean).join(' ')}
                    >
                      <button
                        type="button"
                        className="ag-card__main"
                        onClick={() => toggleExpand(req.id)}
                      >
                        <span className="ag-card__identity">
                          <span className="ag-card__title">{req.machineName}</span>
                          <span className="ag-card__meta">
                            {req.brandName} · {req.authorName ?? '—'}
                          </span>
                        </span>
                        <span className={statusPillClass(req.status)}>{req.status}</span>
                        <span className="ag-card__chevron" aria-hidden>
                          {open ? '▾' : '▸'}
                        </span>
                      </button>
                      {open ? (
                        <div className="ag-card__detail">
                          {req.description ? (
                            <p className="ag-card__excerpt">{req.description}</p>
                          ) : null}
                          {req.status === 'pending' ? (
                            <div className="ag-card__actions">
                              <button
                                type="button"
                                className="btn btn--primary btn--sm"
                                disabled={requestMutation.isPending}
                                onClick={() =>
                                  requestMutation.mutate({ id: req.id, status: 'reviewing' })
                                }
                              >
                                {t('approve')}
                              </button>
                              <button
                                type="button"
                                className="btn btn--secondary btn--sm"
                                disabled={requestMutation.isPending}
                                onClick={() =>
                                  requestMutation.mutate({ id: req.id, status: 'rejected' })
                                }
                              >
                                {t('reject')}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          ) : null}

          {!isLoading && tab === 'reports' ? (
            <div className="ag-queue">
              {(reports ?? []).length === 0 ? (
                <p className="ag-empty">{t('moderationEmpty')}</p>
              ) : (
                (reports ?? []).map((report) => {
                  const open = expandedId === report.id;
                  return (
                    <article
                      key={report.id}
                      className={['ag-card', open ? 'is-selected' : ''].filter(Boolean).join(' ')}
                    >
                      <button
                        type="button"
                        className="ag-card__main"
                        onClick={() => toggleExpand(report.id)}
                      >
                        <span className="ag-card__identity">
                          <span className="ag-card__title">
                            {t('reason')}: {report.reason}
                          </span>
                          <span className="ag-card__meta">
                            {report.description ? `${report.description} · ` : ''}
                            {report.status}
                          </span>
                        </span>
                        <span className={statusPillClass(report.status)}>{report.status}</span>
                        <span className="ag-card__chevron" aria-hidden>
                          {open ? '▾' : '▸'}
                        </span>
                      </button>
                      {open ? (
                        <div className="ag-card__detail">
                          {report.description ? (
                            <p className="ag-card__excerpt">{report.description}</p>
                          ) : null}
                          {report.status === 'pending' ? (
                            <div className="ag-card__actions">
                              <button
                                type="button"
                                className="btn btn--primary btn--sm"
                                disabled={reportMutation.isPending}
                                onClick={() =>
                                  reportMutation.mutate({ id: report.id, status: 'resolved' })
                                }
                              >
                                {t('resolve')}
                              </button>
                              <button
                                type="button"
                                className="btn btn--secondary btn--sm"
                                disabled={reportMutation.isPending}
                                onClick={() =>
                                  reportMutation.mutate({ id: report.id, status: 'dismissed' })
                                }
                              >
                                {t('dismiss')}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          ) : null}
        </section>
      </div>
    </AdminPageShell>
  );
}
