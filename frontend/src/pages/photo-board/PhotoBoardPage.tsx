import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { PhotoBoardSort, PhotoPost } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { CommunityBottomBanner } from '@/components/community/CommunityBottomBanner';
import { AuthorWithRole } from '@/components/common/AuthorWithRole';
import { Icon } from '@/components/icons/Icon';
import { photoBoardApi } from '@/api/photo-board.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { resolvePhotoBoardMediaUrl } from '@/utils/photoBoardMediaUrl';
import '@/styles/components.css';
import '@/styles/photo-board.css';

const SORTS: PhotoBoardSort[] = ['latest', 'popular', 'views', 'comments'];

type PhotoScope = 'all' | 'mine' | 'liked';

function PhotoCard({ post }: { post: PhotoPost }) {
  const { t } = useTranslation('community');
  const imageCount = post.images?.length ?? (post.coverImage ? 1 : 0);

  return (
    <Link
      to={ROUTES.PHOTO_BOARD_DETAIL.replace(':postId', post.id)}
      className="photo-card"
    >
      <div className="photo-card__media">
        {post.coverImage ? (
          <img
            className="photo-card__img"
            src={resolvePhotoBoardMediaUrl(post.coverImage.thumbUrl)}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="photo-card__placeholder" aria-hidden />
        )}
        {imageCount > 1 ? (
          <span className="photo-card__count">{imageCount}</span>
        ) : null}
        {post.likedByMe ? (
          <span className="photo-card__liked" aria-label={t('photoLiked')}>
            ♥
          </span>
        ) : null}
        <div className="photo-card__overlay">
          <span>
            <Icon name="heart" size={12} aria-hidden /> {post.likeCount}
          </span>
          <span>
            <Icon name="message" size={12} aria-hidden /> {post.commentCount}
          </span>
        </div>
      </div>
      <div className="photo-card__body">
        <h3 className="photo-card__title">{post.title}</h3>
        <div className="photo-card__meta">
          <AuthorWithRole
            className="photo-card__author"
            name={post.authorName}
            roleCode={post.authorRoleCode}
          />
          <span className="photo-card__stats">
            <span>♥ {post.likeCount}</span>
            <span>💬 {post.commentCount}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

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
  const scope: PhotoScope = mine ? 'mine' : likedByMe ? 'liked' : 'all';

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

  const setScope = (nextScope: PhotoScope) => {
    const apply = () => {
      const next = new URLSearchParams(params);
      next.delete('mine');
      next.delete('liked');
      next.delete('page');
      if (nextScope === 'mine') next.set('mine', '1');
      if (nextScope === 'liked') next.set('liked', '1');
      setParams(next);
    };
    if (nextScope === 'all') {
      apply();
      return;
    }
    requireAuth(apply);
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
      <PageShell>
        <header className="photo-top">
          <div className="photo-top__text">
            <h1 className="page-hero-title">
              <span className="page-hero-title__icon" aria-hidden>
                <Icon name="camera" size={18} />
              </span>
              {t('photoBoard')}
            </h1>
            <p>{t('photoBoardSubtitle')}</p>
          </div>
          <button
            type="button"
            className="photo-top__write"
            onClick={() => requireAuth(() => navigate(ROUTES.PHOTO_BOARD_WRITE))}
          >
            {t('photoWrite')}
          </button>
        </header>

        <div className="photo-controls">
          <div className="photo-controls__search-row">
            <label className="photo-search-wrap">
              <Icon name="search" size={16} className="photo-search-wrap__icon" aria-hidden />
              <input
                className="photo-search"
                value={q}
                onChange={(e) => updateParam('q', e.target.value || undefined)}
                placeholder={t('photoSearchPlaceholder')}
                aria-label={t('photoSearchPlaceholder')}
              />
            </label>
            {data ? (
              <span className="photo-count">{t('photoPostCount', { count: data.meta.total })}</span>
            ) : null}
          </div>

          <div className="photo-scope" role="tablist" aria-label={t('photoScopeLabel')}>
            {(
              [
                ['all', t('photoAll')],
                ['mine', t('photoMyPosts')],
                ['liked', t('photoMyLikes')],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={scope === value}
                className={`photo-scope__btn${scope === value ? ' is-active' : ''}`}
                onClick={() => setScope(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="photo-sort" role="tablist" aria-label={t('photoSortLabel')}>
            {SORTS.map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={sort === value}
                className={`photo-sort__btn${sort === value ? ' is-active' : ''}`}
                onClick={() => updateParam('sort', value)}
              >
                {t(`photoSort.${value}`)}
              </button>
            ))}
          </div>

          {tag ? (
            <div className="photo-tag-filter">
              <span className="photo-tag-filter__chip">#{tag}</span>
              <button type="button" className="photo-tag-filter__clear" onClick={() => updateParam('tag')}>
                {t('photoClearTag')}
              </button>
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <div className="photo-grid photo-grid--skeleton" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="photo-card photo-card--skeleton">
                <Skeleton height={120} />
              </div>
            ))}
          </div>
        ) : !data?.items.length ? (
          <div className="photo-empty">
            <span className="photo-empty__icon" aria-hidden>
              <Icon name="camera" size={28} />
            </span>
            <strong>{t('photoEmpty')}</strong>
          </div>
        ) : (
          <>
            <div className={`photo-grid${isFetching ? ' is-fetching' : ''}`}>
              {data.items.map((post) => (
                <PhotoCard key={post.id} post={post} />
              ))}
            </div>
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={(nextPage) => updateParam('page', String(nextPage))}
            />
          </>
        )}

        <CommunityBottomBanner />

        <Link to={ROUTES.MY_PAGE} className="photo-back-link">
          ← {t('photoBackMyPage')}
        </Link>
      </PageShell>
    </div>
  );
}
