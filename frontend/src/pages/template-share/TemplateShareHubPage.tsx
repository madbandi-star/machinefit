import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { AtSign, Video } from 'lucide-react';
import type { TemplateShareSort } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { Icon } from '@/components/icons/Icon';
import { CommunityBottomBanner } from '@/components/community/CommunityBottomBanner';
import { AuthorWithRole } from '@/components/common/AuthorWithRole';
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

  const clearSearch = () => {
    setDraftQ('');
    const sp = new URLSearchParams(params);
    sp.delete('q');
    sp.set('page', '1');
    setParams(sp);
  };

  const total = listQuery.data?.total ?? 0;
  const items = listQuery.data?.items ?? [];
  const hasQuery = Boolean(q.trim());

  return (
    <PageShell
      title={
        <span className="page-hero-title">
          <span className="page-hero-title__icon" aria-hidden>
            <Icon name="records" size={18} />
          </span>
          {t('templateShare.title')}
        </span>
      }
      subtitle={t('templateShare.subtitle')}
      action={
        <Link to={ROUTES.MY_TEMPLATES} className="tpl-share-header-action">
          {t('templateShare.myTemplatesShort')}
        </Link>
      }
    >
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

          <div className="tpl-share-sort" role="tablist" aria-label={t('templateShare.sortLabel')}>
            {SORTS.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={sort === key}
                className={['tpl-share-sort__btn', sort === key && 'is-active']
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
            <div className="tpl-share-toolbar">
              <p className="tpl-share-result-count">
                {t('templateShare.resultCount', { count: total })}
              </p>
            </div>

            {items.length === 0 ? (
              <div className="tpl-share-empty-box">
                <p className="tpl-share-empty-box__title">
                  {hasQuery ? t('templateShare.emptySearchTitle') : t('templateShare.emptyTitle')}
                </p>
                <p className="tpl-share-empty-box__text">
                  {hasQuery ? t('templateShare.emptySearch') : t('templateShare.empty')}
                </p>
                <div className="tpl-share-empty-box__actions">
                  {hasQuery ? (
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={clearSearch}
                    >
                      {t('templateShare.clearSearch')}
                    </button>
                  ) : null}
                  <Link to={ROUTES.MY_TEMPLATES} className="btn btn--primary btn--sm">
                    {t('templateShare.emptyCtaMy')}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="tpl-share-grid">
                {items.map((item) => {
                  const badge = item.badges?.[0];
                  const hasSocial =
                    Boolean(item.youtubeChannelName) ||
                    Boolean(item.youtubeUrl) ||
                    Boolean(item.instagramId);
                  return (
                    <Link
                      key={item.id}
                      to={ROUTES.TEMPLATE_SHARE_DETAIL.replace(':postId', item.id)}
                      className="tpl-share-card"
                    >
                      <div className="tpl-share-card__media" aria-hidden>
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt="" loading="lazy" />
                        ) : (
                          <span className="tpl-share-card__media-fallback">
                            <Icon name="dumbbell" size={22} />
                          </span>
                        )}
                        {badge ? (
                          <span className="tpl-share-card__badge">{badge.label}</span>
                        ) : null}
                      </div>
                      <div className="tpl-share-card__body">
                        <h3 className="tpl-share-card__title">{item.title}</h3>
                        <p className="tpl-share-card__meta">
                          <AuthorWithRole
                            name={item.authorName}
                            roleCode={item.authorRoleCode}
                            hellpowerScore={item.authorHellpowerScore}
                          />
                          <span aria-hidden>·</span>
                          <span>{t(`templateShare.difficulty.${item.difficulty}`)}</span>
                          <span aria-hidden>·</span>
                          <span>
                            {t('templateShare.exerciseCount', { count: item.itemCount })}
                          </span>
                        </p>
                        {hasSocial ? (
                          <div
                            className="tpl-share-card__social"
                            aria-label={t('templateShare.creatorLinks')}
                          >
                            {item.youtubeChannelName || item.youtubeUrl ? (
                              <span className="tpl-share-card__social-chip">
                                <Video size={12} strokeWidth={2.2} aria-hidden />
                                <span>
                                  {item.youtubeChannelName || t('templateShare.fieldYoutubeUrl')}
                                </span>
                              </span>
                            ) : null}
                            {item.instagramId ? (
                              <span className="tpl-share-card__social-chip">
                                <AtSign size={12} strokeWidth={2.2} aria-hidden />
                                <span>@{item.instagramId}</span>
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <div className="tpl-share-card__social tpl-share-card__social--empty" aria-hidden />
                        )}
                        <div className="tpl-share-card__stats">
                          <div className="tpl-share-card__stat">
                            <strong>{item.likeCount}</strong>
                            <span>{t('templateShare.statLikes')}</span>
                          </div>
                          <div className="tpl-share-card__stat">
                            <strong>{item.downloadCount}</strong>
                            <span>{t('templateShare.statDownloads')}</span>
                          </div>
                          <div className="tpl-share-card__stat">
                            <strong>{item.useCount}</strong>
                            <span>{t('templateShare.statUses')}</span>
                          </div>
                          <div className="tpl-share-card__stat">
                            <strong>{item.commentCount}</strong>
                            <span>{t('templateShare.statComments')}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            <Pagination
              page={page}
              totalPages={Math.max(1, Math.ceil(total / (listQuery.data?.pageSize ?? 12)))}
              onPageChange={(next) => {
                const sp = new URLSearchParams(params);
                sp.set('page', String(next));
                setParams(sp);
              }}
            />
          </>
        ) : null}
        <CommunityBottomBanner />
      </div>
    </PageShell>
  );
}
