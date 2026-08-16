import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { QA_CATEGORIES } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { ScrollCarousel } from '@/components/navigation/ScrollCarousel/ScrollCarousel';
import { adminQaApi } from '@/api/qa.api';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-qa.css';

type PublishFilter = 'all' | 'published' | 'unpublished' | 'review';

export function AdminQaPage() {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [q, setQ] = useState('');
  const [publishFilter, setPublishFilter] = useState<PublishFilter>('all');
  const [category, setCategory] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin', 'qa', q, category],
    queryFn: async () =>
      (
        await adminQaApi.list({
          q: q || undefined,
          category: category || undefined,
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

  const stats = statsQuery.data;
  const busy = publishMutation.isPending || deleteMutation.isPending;

  const items = useMemo(() => {
    const list = listQuery.data?.items ?? [];
    return list.filter((item) => {
      if (publishFilter === 'published' && !item.isPublished) return false;
      if (publishFilter === 'unpublished' && item.isPublished) return false;
      if (publishFilter === 'review' && !item.needsImplReview) return false;
      return true;
    });
  }, [listQuery.data?.items, publishFilter]);

  const reviewCount = useMemo(
    () => (listQuery.data?.items ?? []).filter((i) => i.needsImplReview).length,
    [listQuery.data?.items]
  );

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of stats?.byCategory ?? []) {
      map.set(row.category, row.count);
    }
    return map;
  }, [stats?.byCategory]);

  return (
    <AdminPageShell
      title={t('admin:qa.title')}
      subtitle={t('admin:qa.subtitle')}
      actions={
        <Link to={ROUTES.ADMIN_QA_NEW} className="btn btn--primary">
          {t('admin:qa.create')}
        </Link>
      }
    >
      <div className="aqa">
        {statsQuery.isLoading ? <Skeleton count={1} height={72} /> : null}
        {stats ? (
          <section className="aqa-kpis" aria-label={t('admin:qa.stats')}>
            <button
              type="button"
              className={`aqa-kpi${publishFilter === 'all' ? ' is-active' : ''}`}
              onClick={() => setPublishFilter('all')}
            >
              <span className="aqa-kpi__value">{stats.total}</span>
              <span className="aqa-kpi__label">{t('admin:qa.statTotal')}</span>
            </button>
            <button
              type="button"
              className={`aqa-kpi${publishFilter === 'published' ? ' is-active' : ''}`}
              onClick={() => setPublishFilter('published')}
            >
              <span className="aqa-kpi__value">{stats.published}</span>
              <span className="aqa-kpi__label">{t('admin:qa.statPublished')}</span>
            </button>
            <button
              type="button"
              className={`aqa-kpi${publishFilter === 'unpublished' ? ' is-active' : ''}`}
              onClick={() => setPublishFilter('unpublished')}
            >
              <span className="aqa-kpi__value">{stats.unpublished}</span>
              <span className="aqa-kpi__label">{t('admin:qa.statUnpublished')}</span>
            </button>
            <button
              type="button"
              className={`aqa-kpi${publishFilter === 'review' ? ' is-active' : ''}${
                reviewCount > 0 ? ' is-warn' : ''
              }`}
              onClick={() => setPublishFilter('review')}
            >
              <span className="aqa-kpi__value">{reviewCount}</span>
              <span className="aqa-kpi__label">{t('admin:qa.statReview')}</span>
            </button>
            <div className="aqa-kpi">
              <span className="aqa-kpi__value">{stats.totalViews}</span>
              <span className="aqa-kpi__label">{t('admin:qa.statViews')}</span>
            </div>
            <div className="aqa-kpi">
              <span className="aqa-kpi__value">
                {stats.totalHelpful}/{stats.totalNotHelpful}
              </span>
              <span className="aqa-kpi__label">{t('admin:qa.statHelpful')}</span>
            </div>
          </section>
        ) : null}

        <section className="aqa-panel">
          <div className="aqa-toolbar">
            <input
              className="aqa-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('admin:qa.searchPlaceholder')}
              aria-label={t('admin:qa.searchPlaceholder')}
            />
            <ScrollCarousel
              className="chip-carousel"
              scrollerClassName="aqa-chips"
              scrollerProps={{ role: 'group', 'aria-label': t('admin:qa.colCategory') }}
            >
              <button
                type="button"
                className={`aqa-chip${category === '' ? ' is-active' : ''}`}
                onClick={() => setCategory('')}
              >
                {t('common:qa.allCategories')}
              </button>
              {QA_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`aqa-chip${category === cat ? ' is-active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {t(`common:qa.categories.${cat}`)}
                  {categoryCounts.has(cat) ? (
                    <span className="aqa-chip__count">{categoryCounts.get(cat)}</span>
                  ) : null}
                </button>
              ))}
            </ScrollCarousel>
          </div>

          <div className="aqa-layout">
            <div className="aqa-main">
              {listQuery.isLoading ? <Skeleton count={5} height={56} /> : null}
              {listQuery.isError ? <QueryErrorMessage /> : null}
              {!listQuery.isLoading && items.length === 0 ? (
                <p className="aqa-empty">{t('admin:qa.empty')}</p>
              ) : null}
              {!listQuery.isLoading && items.length > 0 ? (
                <div className="aqa-queue">
                  {items.map((item) => {
                    const open = expandedId === item.id;
                    return (
                      <article
                        key={item.id}
                        className={[
                          'aqa-card',
                          item.isPublished ? 'is-published' : 'is-draft',
                          item.needsImplReview ? 'is-review' : '',
                          open ? 'is-open' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <button
                          type="button"
                          className="aqa-card__main"
                          onClick={() =>
                            setExpandedId((prev) => (prev === item.id ? null : item.id))
                          }
                        >
                          <span className="aqa-card__order">#{item.displayOrder}</span>
                          <span className="aqa-card__identity">
                            <span className="aqa-card__title">{item.title}</span>
                            <span className="aqa-card__meta">
                              {t(`common:qa.categories.${item.category}`)}
                              {' · '}
                              P{item.priority}
                              {item.needsImplReview
                                ? ` · ${t('admin:qa.needsReviewShort')}`
                                : ''}
                            </span>
                          </span>
                          <span
                            className={`aqa-pill ${
                              item.isPublished ? 'aqa-pill--on' : 'aqa-pill--off'
                            }`}
                          >
                            {item.isPublished
                              ? t('admin:qa.published')
                              : t('admin:qa.unpublished')}
                          </span>
                          <span className="aqa-metrics">
                            <span title={t('admin:qa.colViews')}>👁 {item.viewCount}</span>
                            <span title={t('admin:qa.colHelpful')}>
                              👍 {item.helpfulCount}/{item.notHelpfulCount}
                            </span>
                          </span>
                          <span className="aqa-card__chevron" aria-hidden>
                            {open ? '▾' : '▸'}
                          </span>
                        </button>
                        {open ? (
                          <div className="aqa-card__detail">
                            {item.excerpt ? (
                              <p className="aqa-card__excerpt">{item.excerpt}</p>
                            ) : null}
                            <div className="aqa-card__actions">
                              <Link
                                to={ROUTES.ADMIN_QA_EDIT.replace(':qaId', item.id)}
                                className="btn btn--secondary btn--sm"
                              >
                                {t('admin:qa.edit')}
                              </Link>
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm"
                                disabled={busy}
                                onClick={() =>
                                  publishMutation.mutate({
                                    id: item.id,
                                    isPublished: !item.isPublished,
                                  })
                                }
                              >
                                {item.isPublished
                                  ? t('admin:qa.unpublish')
                                  : t('admin:qa.publish')}
                              </button>
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm aqa-btn--danger"
                                disabled={busy}
                                onClick={() => setPendingDelete(item.id)}
                              >
                                {t('admin:qa.delete')}
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

            {stats?.topViewed?.length ? (
              <aside className="aqa-side" aria-label={t('admin:qa.topViewed')}>
                <h2 className="aqa-side__title">{t('admin:qa.topViewed')}</h2>
                <ol className="aqa-side__list">
                  {stats.topViewed.slice(0, 8).map((row, index) => (
                    <li key={row.id}>
                      <span className="aqa-side__rank">{index + 1}</span>
                      <Link to={ROUTES.ADMIN_QA_EDIT.replace(':qaId', row.id)}>
                        {row.title}
                      </Link>
                      <span className="aqa-side__count">{row.viewCount}</span>
                    </li>
                  ))}
                </ol>
              </aside>
            ) : null}
          </div>
        </section>
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
    </AdminPageShell>
  );
}
