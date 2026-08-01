import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Role, hasMinRole } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { communityApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import '@/styles/community.css';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';

function formatDateTime(iso: string) {
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
}

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const { t } = useTranslation('community');
  const { t: tc } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showToast = useUIStore((s) => s.showToast);
  const [comment, setComment] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...QUERY_KEYS.posts, postId],
    queryFn: async () => {
      const res = await communityApi.getPost(postId!);
      return res.data.data;
    },
    enabled: !!postId,
  });

  const likeMutation = useMutation({
    mutationFn: () => communityApi.toggleLike(postId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.posts, postId] }),
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const commentMutation = useMutation({
    mutationFn: () => communityApi.createComment(postId!, { content: comment }),
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.posts, postId] });
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => communityApi.deletePost(postId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts });
      navigate(ROUTES.FREE_BOARD);
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const reportMutation = useMutation({
    mutationFn: () =>
      communityApi.reportPost(postId!, { reason: 'abuse', description: 'user report' }),
    onSuccess: () => showToast(tc('compliance.report.submitted'), 'success'),
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      showToast(t('loginRequired'), 'error');
      navigate(ROUTES.LOGIN);
      return;
    }
    likeMutation.mutate();
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast(t('loginRequired'), 'error');
      navigate(ROUTES.LOGIN);
      return;
    }
    if (!comment.trim()) return;
    commentMutation.mutate();
  };

  const handleDelete = () => {
    if (window.confirm(t('confirmDelete'))) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <PageShell title={t('freeBoard')}>
        <Skeleton count={4} />
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell title={t('freeBoard')}>
        <QueryErrorMessage />
        <button
          className="btn btn--secondary btn--sm post-detail__nav-btn"
          onClick={() => refetch()}
        >
          {tc('actions.retry')}
        </button>
        <Link to={ROUTES.FREE_BOARD} className="btn btn--secondary btn--sm post-detail__nav-btn">
          ← {t('freeBoard')}
        </Link>
      </PageShell>
    );
  }

  const { post, comments } = data;
  const isAuthor = user?.id === post.userId;
  const isAdmin = hasMinRole(user?.roleCode, Role.ADMIN);
  const canDelete = isAuthor || (isAdmin && post.boardType === 'free');

  return (
    <PageShell
      title={t('freeBoard')}
      action={
        <Link to={ROUTES.FREE_BOARD} className="btn btn--secondary btn--sm post-detail__back-top">
          ← {t('freeBoard')}
        </Link>
      }
    >
      <article className="post-detail">
        <header className="post-detail__header">
          <h2 className="post-detail__title">{post.title}</h2>
          <p className="post-detail__meta">
            <span className="post-detail__author">{post.authorName}</span>
            <span className="post-detail__sep" aria-hidden>
              ·
            </span>
            <time dateTime={post.createdAt}>{formatDateTime(post.createdAt)}</time>
            <span className="post-detail__sep" aria-hidden>
              ·
            </span>
            <span className="post-detail__views">👁 {post.viewCount}</span>
          </p>
        </header>

        <div className="post-detail__content">{post.content}</div>

        <div className="post-detail__actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={handleLike}
            disabled={likeMutation.isPending}
          >
            ♥ {t('like')}
            {post.likeCount != null ? ` ${post.likeCount}` : ''}
          </button>
          {isAuthenticated && !isAuthor && (
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => {
                if (window.confirm(tc('compliance.report.confirm'))) {
                  reportMutation.mutate();
                }
              }}
              disabled={reportMutation.isPending}
            >
              {tc('compliance.report.cta')}
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {t('deletePost')}
            </button>
          )}
        </div>

        <section className="post-detail__comments" aria-label={t('comments')}>
          <div className="post-detail__comments-head">
            <h3 className="post-detail__comments-title">{t('comments')}</h3>
            <span className="post-detail__comments-count">{comments.length}</span>
          </div>

          {comments.length ? (
            <ul className="comment-list">
              {comments.map((c) => (
                <li key={c.id} className="comment-item">
                  <div className="comment-item__top">
                    <span className="comment-item__author">{c.authorName}</span>
                    <time className="comment-item__date" dateTime={c.createdAt}>
                      {formatDateTime(c.createdAt)}
                    </time>
                  </div>
                  <p className="comment-item__body">{c.content}</p>
                </li>
              ))}
            </ul>
          ) : null}

          <form onSubmit={handleComment} className="post-detail__comment-form">
            <label className="post-detail__comment-label" htmlFor="comment">
              {t('writeComment')}
            </label>
            <textarea
              id="comment"
              className="input post-detail__comment-input"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('writeComment')}
            />
            <button
              type="submit"
              className="btn btn--primary btn--sm post-detail__comment-submit"
              disabled={commentMutation.isPending}
            >
              {t('comment')}
            </button>
          </form>
        </section>
      </article>
    </PageShell>
  );
}
