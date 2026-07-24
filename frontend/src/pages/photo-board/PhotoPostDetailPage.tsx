import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { photoBoardApi } from '@/api/photo-board.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import '@/styles/photo-board.css';

export function PhotoPostDetailPage() {
  const { postId = '' } = useParams();
  const { t } = useTranslation('community');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAdmin = user?.roleCode === 'admin';

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
    try {
      return new Date(data.post.createdAt).toLocaleString();
    } catch {
      return data.post.createdAt;
    }
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
      <PageShell title={post.title} subtitle={formattedDate}>
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
                <img src={image.mainUrl} alt={post.title} loading="lazy" decoding="async" />
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

        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{post.content}</p>

        <div>
          <Link
            to={`${ROUTES.PHOTO_BOARD}?authorId=${post.userId}`}
            className="btn btn--secondary"
          >
            {t('photoAuthor')}: {post.authorName || '—'}
          </Link>
          <div style={{ marginTop: '0.35rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            {t('photoViews')}: {post.viewCount} · {t('comments')}: {post.commentCount}
          </div>
        </div>

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
          <h3 className="my-page-section__title">{t('comments')}</h3>
          <form
            className="card"
            style={{ padding: '0.85rem', display: 'grid', gap: '0.5rem' }}
            onSubmit={(e) => {
              e.preventDefault();
              if (!comment.trim()) return;
              requireAuth(() => commentMutation.mutate());
            }}
          >
            {replyTo ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {t('photoReplying')}{' '}
                <button type="button" className="btn btn--secondary" onClick={() => setReplyTo(null)}>
                  {t('cancel')}
                </button>
              </div>
            ) : null}
            <textarea
              className="input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('writeComment')}
              rows={3}
            />
            <button
              type="submit"
              className="btn btn--primary"
              disabled={commentMutation.isPending || !comment.trim()}
            >
              {t('submit')}
            </button>
          </form>

          {comments.map((item) => (
            <article
              key={item.id}
              className={`photo-comment${item.parentId ? ' photo-comment--reply' : ''}`}
            >
              <div className="photo-comment__meta">
                <strong>{item.authorName || '—'}</strong>
                <span>{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <p style={{ margin: '0 0 0.35rem', whiteSpace: 'pre-wrap' }}>{item.content}</p>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => requireAuth(() => setReplyTo(item.id))}
              >
                {t('photoReply')}
              </button>
            </article>
          ))}
        </section>

        <Link to={ROUTES.PHOTO_BOARD} className="btn btn--secondary btn--block">
          {t('photoBackList')}
        </Link>
      </PageShell>
    </div>
  );
}
