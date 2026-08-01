import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Role, hasMinRole } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { photoBoardApi } from '@/api/photo-board.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { resolvePhotoBoardMediaUrl } from '@/utils/photoBoardMediaUrl';
import '@/styles/components.css';
import '@/styles/photo-board.css';

function formatDateTime(iso: string) {
  try {
    const date = new Date(iso);
    const now = new Date();
    const sameYear = date.getFullYear() === now.getFullYear();
    return date.toLocaleString(undefined, {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...(sameYear ? {} : { year: '2-digit' }),
    });
  } catch {
    return iso;
  }
}

export function PhotoPostDetailPage() {
  const { postId = '' } = useParams();
  const { t } = useTranslation('community');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAdmin = hasMinRole(user?.roleCode, Role.ADMIN);

  const [index, setIndex] = useState(0);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.photoBoardPost(postId),
    queryFn: async () => (await photoBoardApi.get(postId)).data.data,
    enabled: Boolean(postId),
  });

  const images = data?.post.images ?? [];
  const canEdit = Boolean(user && (user.id === data?.post.userId || isAdmin));

  const likeMutation = useMutation({
    mutationFn: () => photoBoardApi.toggleLike(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.photoBoardPost(postId) });
      queryClient.invalidateQueries({ queryKey: ['photo-board'] });
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const commentMutation = useMutation({
    mutationFn: () =>
      photoBoardApi.createComment(postId, {
        content: comment.trim(),
        parentId: replyTo ?? undefined,
      }),
    onSuccess: () => {
      setComment('');
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.photoBoardPost(postId) });
      queryClient.invalidateQueries({ queryKey: ['photo-board'] });
      showToast(t('createSuccess'), 'success');
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => photoBoardApi.remove(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-board'] });
      showToast(t('deleteSuccess'), 'success');
      navigate(ROUTES.PHOTO_BOARD);
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const reportMutation = useMutation({
    mutationFn: () =>
      photoBoardApi.report({
        postId,
        reason: 'other',
        description: t('photoReportDefault'),
      }),
    onSuccess: () => showToast(t('photoReportSuccess'), 'success'),
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      showToast(t('loginRequired'), 'error');
      navigate(ROUTES.LOGIN);
      return;
    }
    action();
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: data?.post.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast(t('photoLinkCopied'), 'success');
    } catch {
      showToast(t('errorGeneric'), 'error');
    }
  };

  const go = (dir: -1 | 1) => {
    if (!images.length) return;
    setIndex((prev) => (prev + dir + images.length) % images.length);
  };

  const formattedDate = useMemo(() => {
    if (!data?.post.createdAt) return '';
    return formatDateTime(data.post.createdAt);
  }, [data?.post.createdAt]);

  if (isLoading || !data) {
    return (
      <PageShell title={t('photoBoard')}>
        <Skeleton count={4} height={96} />
      </PageShell>
    );
  }

  const { post, comments } = data;

  return (
    <div className="photo-detail">
      <PageShell
        title={t('photoBoard')}
        action={
          <Link to={ROUTES.PHOTO_BOARD} className="btn btn--secondary photo-detail__back-top">
            {t('photoBackList')}
          </Link>
        }
      >
        <header className="photo-detail__header">
          <h2 className="photo-detail__title">{post.title}</h2>
          <p className="photo-detail__meta">
            <Link
              to={`${ROUTES.PHOTO_BOARD}?authorId=${post.userId}`}
              className="photo-detail__author"
            >
              {post.authorName || '—'}
            </Link>
            <span className="photo-detail__sep" aria-hidden>
              ·
            </span>
            <time dateTime={post.createdAt}>{formattedDate}</time>
            <span className="photo-detail__sep" aria-hidden>
              ·
            </span>
            <span>
              {t('photoViews')} {post.viewCount}
            </span>
            <span className="photo-detail__sep" aria-hidden>
              ·
            </span>
            <span>
              {t('comments')} {post.commentCount}
            </span>
          </p>
        </header>

        <div
          className="photo-detail__gallery"
          onTouchStart={(e) => {
            touchStartX.current = e.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current == null) return;
            const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
            touchStartX.current = null;
            if (Math.abs(dx) < 40) return;
            go(dx < 0 ? 1 : -1);
          }}
        >
          <div
            className="photo-detail__track"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {images.map((image) => (
              <div key={image.id} className="photo-detail__slide">
                <img
                  src={resolvePhotoBoardMediaUrl(image.mainUrl)}
                  alt={post.title}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
          {images.length > 1 ? (
            <>
              <button
                type="button"
                className="photo-detail__nav photo-detail__nav--prev"
                onClick={() => go(-1)}
                aria-label={t('photoPrev')}
              >
                ‹
              </button>
              <button
                type="button"
                className="photo-detail__nav photo-detail__nav--next"
                onClick={() => go(1)}
                aria-label={t('photoNext')}
              >
                ›
              </button>
            </>
          ) : null}
        </div>
        {images.length > 1 ? (
          <div className="photo-detail__dots" aria-hidden>
            {images.map((image, i) => (
              <span
                key={image.id}
                className={`photo-detail__dot${i === index ? ' is-active' : ''}`}
              />
            ))}
          </div>
        ) : null}

        <div className="photo-detail__actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => requireAuth(() => likeMutation.mutate())}
            disabled={likeMutation.isPending}
          >
            {post.likedByMe ? '♥' : '♡'} {post.likeCount}
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => void share()}>
            {t('photoShare')}
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() =>
              requireAuth(() => {
                if (window.confirm(t('photoReportConfirm'))) reportMutation.mutate();
              })
            }
          >
            {t('photoReport')}
          </button>
          {canEdit ? (
            <>
              <Link
                to={`${ROUTES.PHOTO_BOARD_WRITE}?edit=${post.id}`}
                className="btn btn--secondary"
              >
                {t('photoEdit')}
              </Link>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  if (!window.confirm(t('confirmDelete'))) return;
                  deleteMutation.mutate();
                }}
              >
                {t('deletePost')}
              </button>
            </>
          ) : null}
        </div>

        {post.content ? <p className="photo-detail__content">{post.content}</p> : null}

        {post.tags.length ? (
          <div className="photo-detail__tags">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                to={`${ROUTES.PHOTO_BOARD}?tag=${encodeURIComponent(tag)}`}
                className="photo-detail__tag"
              >
                #{tag}
              </Link>
            ))}
          </div>
        ) : null}

        <section className="photo-detail__comments" aria-label={t('comments')}>
          <div className="photo-detail__comments-head">
            <h3 className="photo-detail__comments-title">{t('comments')}</h3>
            <span className="photo-detail__comments-count">{comments.length}</span>
          </div>

          <form
            className="photo-detail__comment-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!comment.trim()) return;
              requireAuth(() => commentMutation.mutate());
            }}
          >
            {replyTo ? (
              <div className="photo-detail__replying">
                <span>{t('photoReplying')}</span>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setReplyTo(null)}
                >
                  {t('cancel')}
                </button>
              </div>
            ) : null}
            <textarea
              className="input photo-detail__comment-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('writeComment')}
              rows={2}
            />
            <button
              type="submit"
              className="btn btn--primary photo-detail__comment-submit"
              disabled={commentMutation.isPending || !comment.trim()}
            >
              {t('submit')}
            </button>
          </form>

          <div className="photo-detail__comment-list">
            {comments.map((item) => (
              <article
                key={item.id}
                className={`photo-comment${item.parentId ? ' photo-comment--reply' : ''}`}
              >
                <div className="photo-comment__meta">
                  <strong>{item.authorName || '—'}</strong>
                  <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
                </div>
                <p className="photo-comment__body">{item.content}</p>
                <button
                  type="button"
                  className="btn btn--secondary photo-comment__reply"
                  onClick={() => requireAuth(() => setReplyTo(item.id))}
                >
                  {t('photoReply')}
                </button>
              </article>
            ))}
          </div>
        </section>
      </PageShell>
    </div>
  );
}
