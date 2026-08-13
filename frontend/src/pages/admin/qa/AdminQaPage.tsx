import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminQaApi } from '@/api/qa.api';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';

export function AdminQaPage() {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [q, setQ] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin', 'qa', q],
    queryFn: async () =>
      (
        await adminQaApi.list({
          q: q || undefined,
          page: 1,
          pageSize: 100,
          sort: 'priority',
          popularLimit: 0,
        })
      ).data.data,
  });

  const statsQuery = useQuery({
    queryKey: ['admin', 'qa', 'stats'],
    queryFn: async () => (await adminQaApi.stats()).data.data,
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      adminQaApi.publish(id, isPublished),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'qa'] });
      showToast(t('admin:qa.updated'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminQaApi.remove(id),
    onSuccess: async () => {
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'qa'] });
      showToast(t('admin:qa.deleted'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const items = listQuery.data?.items ?? [];
  const stats = statsQuery.data;

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div className="admin-page__heading">
          <h1 className="admin-page__title">{t('admin:qa.title')}</h1>
          <p className="admin-page__subtitle">{t('admin:qa.subtitle')}</p>
        </div>
        <div className="admin-page__actions">
          <Link to={ROUTES.ADMIN_QA_NEW} className="btn btn--primary">
            {t('admin:qa.create')}
          </Link>
        </div>
      </header>

      <div className="admin-page__body">
        {stats ? (
          <div className="admin-stats-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span>
              {t('admin:qa.statTotal')}: {stats.total}
            </span>
            <span>
              {t('admin:qa.statPublished')}: {stats.published}
            </span>
            <span>
              {t('admin:qa.statViews')}: {stats.totalViews}
            </span>
            <span>
              {t('admin:qa.statHelpful')}: {stats.totalHelpful}/{stats.totalNotHelpful}
            </span>
          </div>
        ) : null}

        <div className="admin-toolbar" style={{ margin: '1rem 0' }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('admin:qa.searchPlaceholder')}
            aria-label={t('admin:qa.searchPlaceholder')}
            className="input"
          />
        </div>

        {listQuery.isLoading ? <Skeleton count={6} height={56} /> : null}
        {listQuery.isError ? <QueryErrorMessage /> : null}

        {!listQuery.isLoading && items.length === 0 ? (
          <p>{t('admin:qa.empty')}</p>
        ) : null}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin:qa.colOrder')}</th>
                <th>{t('admin:qa.colPriority')}</th>
                <th>{t('admin:qa.colCategory')}</th>
                <th>{t('admin:qa.colTitle')}</th>
                <th>{t('admin:qa.colViews')}</th>
                <th>{t('admin:qa.colHelpful')}</th>
                <th>{t('admin:qa.colPublished')}</th>
                <th>{t('admin:qa.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.displayOrder}</td>
                  <td>P{item.priority}</td>
                  <td>{t(`common:qa.categories.${item.category}`)}</td>
                  <td>
                    <Link to={ROUTES.ADMIN_QA_EDIT.replace(':qaId', item.id)}>{item.title}</Link>
                    {item.needsImplReview ? (
                      <div style={{ color: 'var(--color-warning, #ff9800)', fontSize: '0.75rem' }}>
                        {t('admin:qa.needsReview')}
                      </div>
                    ) : null}
                  </td>
                  <td>{item.viewCount}</td>
                  <td>
                    {item.helpfulCount}/{item.notHelpfulCount}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() =>
                        publishMutation.mutate({
                          id: item.id,
                          isPublished: !item.isPublished,
                        })
                      }
                    >
                      {item.isPublished ? t('admin:qa.published') : t('admin:qa.unpublished')}
                    </button>
                  </td>
                  <td>
                    <Link
                      to={ROUTES.ADMIN_QA_EDIT.replace(':qaId', item.id)}
                      className="btn btn--ghost btn--sm"
                    >
                      {t('admin:qa.edit')}
                    </Link>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setPendingDelete(item.id)}
                    >
                      {t('admin:qa.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {stats?.topViewed?.length ? (
          <section style={{ marginTop: '1.5rem' }}>
            <h2>{t('admin:qa.topViewed')}</h2>
            <ul>
              {stats.topViewed.map((row) => (
                <li key={row.id}>
                  {row.title} ({row.viewCount})
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('admin:qa.deleteConfirmTitle')}
        message={t('admin:qa.deleteConfirmMessage')}
        confirmLabel={t('admin:qa.delete')}
        confirmVariant="danger"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete);
        }}
      />
    </div>
  );
}
