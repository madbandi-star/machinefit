import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { templateShareApi } from '@/api/template-share.api';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/template-share.css';

export function AdminTemplateSharePage() {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [status, setStatus] = useState('');

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
      await queryClient.invalidateQueries({ queryKey: ['admin', 'template-shares', 'reports'] });
      showToast(t('admin:templateShare.reportResolved'), 'success');
    },
  });

  const stats = statsQuery.data;

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div className="admin-page__heading">
          <h1 className="admin-page__title">{t('admin:templateShare.title')}</h1>
          <p className="admin-page__subtitle">{t('admin:templateShare.subtitle')}</p>
        </div>
      </header>

      <div className="admin-page__body">
        {statsQuery.isLoading ? <Skeleton count={2} height={72} /> : null}
        {stats ? (
          <section className="admin-panel" style={{ marginBottom: '1rem' }}>
            <h2 className="admin-panel__title">{t('admin:templateShare.stats')}</h2>
            <div className="admin-stats">
              <div className="admin-stat">
                <span className="admin-stat__label">{t('admin:templateShare.published')}</span>
                <strong className="admin-stat__value">{stats.totalPublished}</strong>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__label">{t('admin:templateShare.hidden')}</span>
                <strong className="admin-stat__value">{stats.totalHidden}</strong>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__label">{t('admin:templateShare.downloads')}</span>
                <strong className="admin-stat__value">{stats.totalDownloads}</strong>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__label">{t('admin:templateShare.uses')}</span>
                <strong className="admin-stat__value">{stats.totalUses}</strong>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__label">{t('admin:templateShare.likes')}</span>
                <strong className="admin-stat__value">{stats.totalLikes}</strong>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__label">{t('admin:templateShare.comments')}</span>
                <strong className="admin-stat__value">{stats.totalComments}</strong>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__label">{t('admin:templateShare.openReports')}</span>
                <strong className="admin-stat__value">{stats.openReports}</strong>
              </div>
            </div>
          </section>
        ) : null}

        <div className="admin-banners-filters" style={{ marginBottom: '0.75rem' }}>
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label={t('admin:templateShare.filterStatus')}
          >
            <option value="">{t('admin:templateShare.allStatus')}</option>
            <option value="published">{t('admin:templateShare.statusPublished')}</option>
            <option value="hidden">{t('admin:templateShare.statusHidden')}</option>
            <option value="removed">{t('admin:templateShare.statusRemoved')}</option>
          </select>
        </div>

        {listQuery.isLoading ? <Skeleton count={3} height={64} /> : null}
        {listQuery.isError ? <QueryErrorMessage /> : null}
        {!listQuery.isLoading && !listQuery.isError ? (
          <section className="admin-panel" style={{ overflowX: 'auto', marginBottom: '1rem' }}>
            <table className="admin-banners-table">
              <thead>
                <tr>
                  <th>{t('admin:templateShare.colTitle')}</th>
                  <th>{t('admin:templateShare.colAuthor')}</th>
                  <th>{t('admin:templateShare.colStatus')}</th>
                  <th>📥</th>
                  <th>🏋️</th>
                  <th>❤️</th>
                  <th>{t('admin:templateShare.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {(listQuery.data?.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link to={ROUTES.TEMPLATE_SHARE_DETAIL.replace(':postId', item.id)}>
                        {item.title}
                      </Link>
                    </td>
                    <td>{item.authorName}</td>
                    <td>{item.status}</td>
                    <td>{item.downloadCount}</td>
                    <td>{item.useCount}</td>
                    <td>{item.likeCount}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {item.status !== 'published' ? (
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm"
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
                            onClick={() => statusMutation.mutate({ id: item.id, next: 'hidden' })}
                          >
                            {t('admin:templateShare.hide')}
                          </button>
                        ) : null}
                        {item.status !== 'removed' ? (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => statusMutation.mutate({ id: item.id, next: 'removed' })}
                          >
                            {t('admin:templateShare.remove')}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        <section className="admin-panel" style={{ overflowX: 'auto' }}>
          <h2 className="admin-panel__title">{t('admin:templateShare.reports')}</h2>
          {reportsQuery.isLoading ? <Skeleton count={2} height={48} /> : null}
          <table className="admin-banners-table">
            <thead>
              <tr>
                <th>{t('admin:templateShare.colTitle')}</th>
                <th>{t('admin:templateShare.colReason')}</th>
                <th>{t('admin:templateShare.colStatus')}</th>
                <th>{t('admin:templateShare.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {(reportsQuery.data ?? []).map((report) => (
                <tr key={report.id}>
                  <td>
                    {report.postId ? (
                      <Link to={ROUTES.TEMPLATE_SHARE_DETAIL.replace(':postId', report.postId)}>
                        {report.postTitle || report.postId}
                      </Link>
                    ) : (
                      report.commentId || '—'
                    )}
                  </td>
                  <td>{report.reason}</td>
                  <td>{report.status}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() =>
                          resolveMutation.mutate({ reportId: report.id, next: 'actioned' })
                        }
                      >
                        {t('admin:templateShare.action')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() =>
                          resolveMutation.mutate({ reportId: report.id, next: 'dismissed' })
                        }
                      >
                        {t('admin:templateShare.dismiss')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
