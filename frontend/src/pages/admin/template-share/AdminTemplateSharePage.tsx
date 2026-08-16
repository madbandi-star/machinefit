import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { templateShareApi } from '@/api/template-share.api';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-template-share.css';

type TabId = 'posts' | 'reports';
type StatusFilter = '' | 'published' | 'hidden' | 'removed';

export function AdminTemplateSharePage() {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [tab, setTab] = useState<TabId>('posts');
  const [status, setStatus] = useState<StatusFilter>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const statsQuery = useQuery({
    queryKey: ['admin', 'template-shares', 'stats'],
    queryFn: async () => (await templateShareApi.adminStats()).data.data,
  });

  const listQuery = useQuery({
    queryKey: ['admin', 'template-shares', status],
    queryFn: async () =>
      (
        await templateShareApi.adminList({
          pageSize: 50,
          status: status || undefined,
        })
      ).data.data,
  });

  const reportsQuery = useQuery({
    queryKey: ['admin', 'template-shares', 'reports'],
    queryFn: async () => (await templateShareApi.adminReports()).data.data,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: 'published' | 'hidden' | 'removed' }) =>
      templateShareApi.adminSetStatus(id, next),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'template-shares'] });
      showToast(t('admin:templateShare.updated'), 'success');
      setExpandedId(null);
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      reportId,
      next,
    }: {
      reportId: string;
      next: 'actioned' | 'dismissed' | 'reviewed';
    }) => templateShareApi.adminResolveReport(reportId, next),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'template-shares'] });
      showToast(t('admin:templateShare.reportResolved'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const stats = statsQuery.data;
  const busy = statusMutation.isPending || resolveMutation.isPending;

  const posts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = listQuery.data?.items ?? [];
    if (!q) return items;
    return items.filter((item) => {
      const hay = `${item.title} ${item.authorName} ${item.status}`.toLowerCase();
      return hay.includes(q);
    });
  }, [listQuery.data?.items, search]);

  const openReports = useMemo(
    () =>
      (reportsQuery.data ?? []).filter(
        (r) => r.status === 'open' || r.status === 'reviewed'
      ),
    [reportsQuery.data]
  );

  const closedReports = useMemo(
    () =>
      (reportsQuery.data ?? []).filter(
        (r) => r.status !== 'open' && r.status !== 'reviewed'
      ),
    [reportsQuery.data]
  );

  const reportRows = tab === 'reports' ? [...openReports, ...closedReports] : [];

  return (
    <AdminPageShell
      title={t('admin:templateShare.title')}
      subtitle={t('admin:templateShare.subtitle')}
    >
      <div className="ats">
        {statsQuery.isLoading ? <Skeleton count={1} height={72} /> : null}
        {stats ? (
          <section className="ats-kpis" aria-label={t('admin:templateShare.stats')}>
            <button
              type="button"
              className={`ats-kpi${status === 'published' && tab === 'posts' ? ' is-active' : ''}`}
              onClick={() => {
                setTab('posts');
                setStatus('published');
              }}
            >
              <span className="ats-kpi__value">{stats.totalPublished}</span>
              <span className="ats-kpi__label">{t('admin:templateShare.published')}</span>
            </button>
            <button
              type="button"
              className={`ats-kpi${status === 'hidden' && tab === 'posts' ? ' is-active' : ''}`}
              onClick={() => {
                setTab('posts');
                setStatus('hidden');
              }}
            >
              <span className="ats-kpi__value">{stats.totalHidden}</span>
              <span className="ats-kpi__label">{t('admin:templateShare.hidden')}</span>
            </button>
            <div className="ats-kpi">
              <span className="ats-kpi__value">{stats.totalDownloads}</span>
              <span className="ats-kpi__label">{t('admin:templateShare.downloads')}</span>
            </div>
            <div className="ats-kpi">
              <span className="ats-kpi__value">{stats.totalUses}</span>
              <span className="ats-kpi__label">{t('admin:templateShare.uses')}</span>
            </div>
            <div className="ats-kpi">
              <span className="ats-kpi__value">{stats.totalLikes}</span>
              <span className="ats-kpi__label">{t('admin:templateShare.likes')}</span>
            </div>
            <div className="ats-kpi">
              <span className="ats-kpi__value">{stats.totalComments}</span>
              <span className="ats-kpi__label">{t('admin:templateShare.comments')}</span>
            </div>
            <button
              type="button"
              className={`ats-kpi${tab === 'reports' ? ' is-active' : ''}${
                stats.openReports > 0 ? ' is-warn' : ''
              }`}
              onClick={() => setTab('reports')}
            >
              <span className="ats-kpi__value">{stats.openReports}</span>
              <span className="ats-kpi__label">{t('admin:templateShare.openReports')}</span>
            </button>
          </section>
        ) : null}

        <div className="ats-tabs" role="tablist" aria-label={t('admin:templateShare.title')}>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'posts'}
            className={`ats-tab${tab === 'posts' ? ' is-active' : ''}`}
            onClick={() => setTab('posts')}
          >
            {t('admin:templateShare.tabPosts')}
            <span className="ats-tab__count">{listQuery.data?.total ?? posts.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'reports'}
            className={`ats-tab${tab === 'reports' ? ' is-active' : ''}`}
            onClick={() => setTab('reports')}
          >
            {t('admin:templateShare.reports')}
            <span className="ats-tab__count">{stats?.openReports ?? openReports.length}</span>
          </button>
        </div>

        {tab === 'posts' ? (
          <section className="ats-panel">
            <div className="ats-toolbar">
              <input
                className="ats-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin:templateShare.searchPlaceholder')}
                aria-label={t('admin:templateShare.searchPlaceholder')}
              />
              <div
                className="ats-chips"
                role="group"
                aria-label={t('admin:templateShare.filterStatus')}
              >
                {(
                  [
                    ['', t('admin:templateShare.allStatus')],
                    ['published', t('admin:templateShare.statusPublished')],
                    ['hidden', t('admin:templateShare.statusHidden')],
                    ['removed', t('admin:templateShare.statusRemoved')],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value || 'all'}
                    type="button"
                    className={`ats-chip${status === value ? ' is-active' : ''}`}
                    aria-pressed={status === value}
                    onClick={() => setStatus(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {listQuery.isLoading ? <Skeleton count={3} height={56} /> : null}
            {listQuery.isError ? <QueryErrorMessage /> : null}
            {!listQuery.isLoading && !listQuery.isError && posts.length === 0 ? (
              <p className="ats-empty">{t('admin:templateShare.emptyPosts')}</p>
            ) : null}
            {!listQuery.isLoading && !listQuery.isError && posts.length > 0 ? (
              <div className="ats-queue">
                <div className="ats-queue__head" aria-hidden>
                  <span>{t('admin:templateShare.colTitle')}</span>
                  <span>{t('admin:templateShare.colStatus')}</span>
                  <span>{t('admin:templateShare.metrics')}</span>
                  <span />
                </div>
                {posts.map((item) => {
                  const open = expandedId === item.id;
                  return (
                    <article
                      key={item.id}
                      className={`ats-card ats-card--${item.status}${open ? ' is-open' : ''}`}
                    >
                      <button
                        type="button"
                        className="ats-card__main"
                        onClick={() =>
                          setExpandedId((prev) => (prev === item.id ? null : item.id))
                        }
                      >
                        <span className="ats-card__identity">
                          <span className="ats-card__title">{item.title}</span>
                          <span className="ats-card__meta">
                            {item.authorName}
                            {' · '}
                            {item.category}
                          </span>
                        </span>
                        <span className={`ats-pill ats-pill--${item.status}`}>
                          {t(`admin:templateShare.status.${item.status}`, {
                            defaultValue: item.status,
                          })}
                        </span>
                        <span className="ats-metrics">
                          <span title={t('admin:templateShare.downloads')}>
                            ↓{item.downloadCount}
                          </span>
                          <span title={t('admin:templateShare.uses')}>↻{item.useCount}</span>
                          <span title={t('admin:templateShare.likes')}>♥{item.likeCount}</span>
                        </span>
                        <span className="ats-card__chevron" aria-hidden>
                          {open ? '▾' : '▸'}
                        </span>
                      </button>
                      {open ? (
                        <div className="ats-card__actions">
                          <Link
                            className="btn btn--ghost btn--sm"
                            to={ROUTES.TEMPLATE_SHARE_DETAIL.replace(':postId', item.id)}
                          >
                            {t('admin:templateShare.view')}
                          </Link>
                          {item.status !== 'published' ? (
                            <button
                              type="button"
                              className="btn btn--secondary btn--sm"
                              disabled={busy}
                              onClick={() =>
                                statusMutation.mutate({ id: item.id, next: 'published' })
                              }
                            >
                              {t('admin:templateShare.publish')}
                            </button>
                          ) : null}
                          {item.status !== 'hidden' ? (
                            <button
                              type="button"
                              className="btn btn--secondary btn--sm"
                              disabled={busy}
                              onClick={() =>
                                statusMutation.mutate({ id: item.id, next: 'hidden' })
                              }
                            >
                              {t('admin:templateShare.hide')}
                            </button>
                          ) : null}
                          {item.status !== 'removed' ? (
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm ats-btn--danger"
                              disabled={busy}
                              onClick={() =>
                                statusMutation.mutate({ id: item.id, next: 'removed' })
                              }
                            >
                              {t('admin:templateShare.remove')}
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>
        ) : null}

        {tab === 'reports' ? (
          <section className="ats-panel">
            {reportsQuery.isLoading ? <Skeleton count={2} height={48} /> : null}
            {!reportsQuery.isLoading && reportRows.length === 0 ? (
              <p className="ats-empty">{t('admin:templateShare.emptyReports')}</p>
            ) : null}
            {reportRows.length > 0 ? (
              <div className="ats-queue">
                {reportRows.map((report) => {
                  const needsAction =
                    report.status === 'open' || report.status === 'reviewed';
                  return (
                    <article
                      key={report.id}
                      className={`ats-report${needsAction ? ' is-open-report' : ''}`}
                    >
                      <div className="ats-report__main">
                        <span className={`ats-pill ats-pill--report-${report.status}`}>
                          {t(`admin:templateShare.reportStatus.${report.status}`, {
                            defaultValue: report.status,
                          })}
                        </span>
                        <div className="ats-report__body">
                          <strong>
                            {report.postId ? (
                              <Link
                                to={ROUTES.TEMPLATE_SHARE_DETAIL.replace(
                                  ':postId',
                                  report.postId
                                )}
                              >
                                {report.postTitle || report.postId}
                              </Link>
                            ) : (
                              report.commentId || '—'
                            )}
                          </strong>
                          <span>
                            {t(`admin:templateShare.reason.${report.reason}`, {
                              defaultValue: String(report.reason),
                            })}
                            {report.description ? ` · ${report.description}` : ''}
                          </span>
                        </div>
                      </div>
                      {needsAction ? (
                        <div className="ats-card__actions">
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            disabled={busy}
                            onClick={() =>
                              resolveMutation.mutate({
                                reportId: report.id,
                                next: 'actioned',
                              })
                            }
                          >
                            {t('admin:templateShare.action')}
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            disabled={busy}
                            onClick={() =>
                              resolveMutation.mutate({
                                reportId: report.id,
                                next: 'dismissed',
                              })
                            }
                          >
                            {t('admin:templateShare.dismiss')}
                          </button>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </AdminPageShell>
  );
}
