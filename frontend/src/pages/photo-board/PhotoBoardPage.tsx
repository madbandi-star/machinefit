import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { PhotoBoardSort } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { photoBoardApi } from '@/api/photo-board.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import '@/styles/photo-board.css';

const SORTS: PhotoBoardSort[] = ['latest', 'popular', 'views', 'comments'];

export function PhotoBoardPage() {
  const { t } = useTranslation('community');
  const navigate = useNavigate();
  const showToast = useUIStore((s) => s.showToast);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [params, setParams] = useSearchParams();

  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const sort = (params.get('sort') as PhotoBoardSort) || 'latest';
  const q = params.get('q') || '';
  const tag = params.get('tag') || '';
  const authorId = params.get('authorId') || undefined;
  const mine = params.get('mine') === '1';
  const likedByMe = params.get('liked') === '1';

  const { data, isLoading, isFetching } = useQuery({
    queryKey: QUERY_KEYS.photoBoard({ page, sort, q, tag, authorId, mine, likedByMe }),
    queryFn: async () => {
      const res = await photoBoardApi.list({
        page,
        limit: 18,
        sort: SORTS.includes(sort) ? sort : 'latest',
        q: q || undefined,
        tag: tag || undefined,
        authorId,
        mine: mine || undefined,
        likedByMe: likedByMe || undefined,
      });
      return res.data.data;
    },
  });

  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      showToast(t('loginRequired'), 'error');
      navigate(ROUTES.LOGIN);
      return;
    }
    action();
  };

  return (
    <div className="photo-board-page">
      <PageShell
        title={t('photoBoard')}
        subtitle={t('photoBoardSubtitle')}
        action={
          <div className="page-shell__header-action" style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => requireAuth(() => navigate(ROUTES.PHOTO_BOARD_WRITE))}
            >
              {t('newPost')}
            </button>
          </div>
        }
      >
        <div className="photo-board-toolbar">
          <div className="photo-board-toolbar__row">
            <input
              className="input photo-board-toolbar__search"
              value={q}
              onChange={(e) => updateParam('q', e.target.value || undefined)}
              placeholder={t('photoSearchPlaceholder')}
              aria-label={t('photoSearchPlaceholder')}
            />
          </div>
          <div className="photo-board-tabs" role="tablist" aria-label={t('photoSortLabel')}>
            {SORTS.map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={sort === value}
                className={`photo-board-tabs__btn${sort === value ? ' is-active' : ''}`}
                onClick={() => updateParam('sort', value)}
              >
                {t(`photoSort.${value}`)}
              </button>
            ))}
          </div>
          <div className="photo-board-tabs">
            <button
              type="button"
              className={`photo-board-tabs__btn${!mine && !likedByMe ? ' is-active' : ''}`}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete('mine');
                next.delete('liked');
                next.delete('page');
                setParams(next);
              }}
            >
              {t('photoAll')}
            </button>
            <button
              type="button"
              className={`photo-board-tabs__btn${mine ? ' is-active' : ''}`}
              onClick={() =>
                requireAuth(() => {
                  const next = new URLSearchParams(params);
                  next.set('mine', '1');
                  next.delete('liked');
                  next.delete('page');
                  setParams(next);
                })
              }
            >
              {t('photoMyPosts')}
            </button>
            <button
              type="button"
              className={`photo-board-tabs__btn${likedByMe ? ' is-active' : ''}`}
              onClick={() =>
                requireAuth(() => {
                  const next = new URLSearchParams(params);
                  next.set('liked', '1');
                  next.delete('mine');
                  next.delete('page');
                  setParams(next);
                })
              }
            >
              {t('photoMyLikes')}
            </button>
          </div>
          {tag ? (
            <div className="photo-board-toolbar__row">
              <span className="photo-detail__tag">#{tag}</span>
              <button type="button" className="btn btn--secondary" onClick={() => updateParam('tag')}>
                {t('photoClearTag')}
              </button>
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <div className="photo-board-skeleton-grid" aria-busy="true">
            <Skeleton count={6} height={120} />
          </div>
        ) : !data?.items.length ? (
          <div className="card photo-board-empty">{t('photoEmpty')}</div>
        ) : (
          <>
            <div className={`photo-board-grid${isFetching ? ' is-fetching' : ''}`}>
              {data.items.map((post) => (
                <Link
                  key={post.id}
                  to={ROUTES.PHOTO_BOARD_DETAIL.replace(':postId', post.id)}
                  className="photo-board-card"
                >
                  {post.coverImage ? (
                    <img
                      className="photo-board-card__img"
                      src={post.coverImage.thumbUrl}
                      alt={post.title}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="photo-board-card__img" />
                  )}
                  <div className="photo-board-card__meta">
                    <span>♥ {post.likeCount}</span>
                    <span>💬 {post.commentCount}</span>
                  </div>
                </Link>
              ))}
            </div>
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={(nextPage) => updateParam('page', String(nextPage))}
            />
          </>
        )}

        <div style={{ marginTop: '1rem' }}>
          <Link to={ROUTES.MY_PAGE} className="btn btn--secondary btn--block">
            {t('photoBackMyPage')}
          </Link>
        </div>
      </PageShell>
    </div>
  );
}
