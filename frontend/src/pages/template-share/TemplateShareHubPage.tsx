import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import type { TemplateShareSort } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { templateShareApi } from '@/api/template-share.api';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';
import '@/styles/template-share.css';

const SORTS: TemplateShareSort[] = ['popular', 'latest', 'uses', 'downloads', 'likes'];

function isTemplateShareApiMissing(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  if (status === 404 || status === 502 || status === 503) return true;
  const body = error.response?.data;
  return typeof body === 'string' && body.includes('Cannot GET');
}

export function TemplateShareHubPage() {
  const { t } = useTranslation('community');
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const sort = (params.get('sort') as TemplateShareSort) || 'popular';
  const q = params.get('q') || '';
  const [draftQ, setDraftQ] = useState(q);

  const listQuery = useQuery({
    queryKey: ['template-shares', page, sort, q],
    queryFn: async () => {
      const res = await templateShareApi.list({ page, pageSize: 12, sort, q: q || undefined });
      return res.data.data;
    },
    retry: (failureCount, error) => {
      if (isTemplateShareApiMissing(error)) return false;
      return failureCount < 2;
    },
  });

  const setSort = (next: TemplateShareSort) => {
    const sp = new URLSearchParams(params);
    sp.set('sort', next);
    sp.set('page', '1');
    setParams(sp);
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const sp = new URLSearchParams(params);
    if (draftQ.trim()) sp.set('q', draftQ.trim());
    else sp.delete('q');
    sp.set('page', '1');
    setParams(sp);
  };

  return (
    <PageShell title={t('templateShare.title')} subtitle={t('templateShare.subtitle')}>
      <div className="tpl-share-page">
        <div className="tpl-share-controls">
          <form className="tpl-share-search" onSubmit={onSearch}>
            <input
              className="input"
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              placeholder={t('templateShare.searchPlaceholder')}
              aria-label={t('templateShare.searchPlaceholder')}
            />
            <button type="submit" className="btn btn--primary">
              {t('templateShare.search')}
            </button>
          </form>

          <div className="tpl-share-filters" role="tablist" aria-label={t('templateShare.sortLabel')}>
            {SORTS.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={sort === key}
                className={['tpl-share-filters__chip', sort === key && 'is-active']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setSort(key)}
              >
                {t(`templateShare.sort.${key}`)}
              </button>
            ))}
          </div>
        </div>

        {listQuery.isLoading ? <Skeleton count={4} height={78} /> : null}
        {listQuery.isError ? (
          <QueryErrorMessage
            message={
              isTemplateShareApiMissing(listQuery.error)
                ? t('templateShare.apiUnavailable')
                : undefined
            }
            onRetry={() => void listQuery.refetch()}
          />
        ) : null}

        {!listQuery.isLoading && !listQuery.isError ? (
          <>
            {(listQuery.data?.items.length ?? 0) === 0 ? (
              <p className="tpl-share-empty">{t('templateShare.empty')}</p>
            ) : (
              <div className="tpl-share-list">
                {listQuery.data!.items.map((item) => {
                  const badge = item.badges?.[0];
                  return (
                    <Link
                      key={item.id}
                      to={ROUTES.TEMPLATE_SHARE_DETAIL.replace(':postId', item.id)}
                      className="tpl-share-row"
                    >
                      <div className="tpl-share-row__thumb" aria-hidden>
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt="" loading="lazy" />
                        ) : (
                          <span className="tpl-share-row__thumb-fallback">
                            {t(`templateShare.category.${item.category}`)}
                          </span>
                        )}
                      </div>
                      <div className="tpl-share-row__body">
                        <h3 className="tpl-share-row__title">
                          {badge ? (
                            <span className="tpl-share-row__badge">{badge.label}</span>
                          ) : null}
                          {item.title}
                        </h3>
                        <p className="tpl-share-row__meta">
                          {item.authorName}
                          {' · '}
                          {t(`templateShare.difficulty.${item.difficulty}`)}
                          {' · '}
                          {t('templateShare.exerciseCount', { count: item.itemCount })}
                        </p>
                        <div className="tpl-share-row__stats">
                          <span>
                            {t('templateShare.statLikes')} {item.likeCount}
                          </span>
                          <span>
                            {t('templateShare.statDownloads')} {item.downloadCount}
                          </span>
                          <span>
                            {t('templateShare.statUses')} {item.useCount}
                          </span>
                          <span>
                            {t('templateShare.statComments')} {item.commentCount}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            <Pagination
              page={page}
              totalPages={Math.max(
                1,
                Math.ceil((listQuery.data?.total ?? 0) / (listQuery.data?.pageSize ?? 12))
              )}
              onPageChange={(next) => {
                const sp = new URLSearchParams(params);
                sp.set('page', String(next));
                setParams(sp);
              }}
            />
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
