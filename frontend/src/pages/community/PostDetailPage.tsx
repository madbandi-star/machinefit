import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { communityApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';

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
        <button className="btn btn--secondary btn--block" style={{ marginTop: '1rem' }} onClick={() => refetch()}>
          {tc('actions.retry')}
        </button>
        <Link to={ROUTES.FREE_BOARD} className="btn btn--secondary btn--block" style={{ marginTop: '0.5rem' }}>
          ← {t('freeBoard')}
        </Link>
      </PageShell>
    );
  }

  const { post, comments } = data;
  const isAuthor = user?.id === post.userId;

  return (
    <PageShell title={post.title}>
      <div className="card">
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
          {post.authorName} · {new Date(post.createdAt).toLocaleString()} · 👁 {post.viewCount}
        </p>
        <div className="post-detail__content">{post.content}</div>
        <div className="post-detail__actions">
          <button className="btn btn--secondary" onClick={handleLike} disabled={likeMutation.isPending}>
            ♥ {t('like')} {post.likeCount != null ? `(${post.likeCount})` : ''}
          </button>
          {isAuthor && (
            <button className="btn btn--secondary" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {t('deletePost')}
            </button>
          )}
        </div>
      </div>

      <h3 style={{ marginBottom: '0.75rem' }}>{t('comments')} ({comments.length})</h3>
      <div className="comment-list" style={{ marginBottom: '1rem' }}>
        {comments.map((c) => (
          <div key={c.id} className="comment-item">
            <div className="comment-item__author">{c.authorName}</div>
            <p>{c.content}</p>
            <div className="comment-item__date">{new Date(c.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleComment} className="card">
        <div className="form-row">
          <label htmlFor="comment">{t('writeComment')}</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('writeComment')}
          />
        </div>
        <button type="submit" className="btn btn--primary" disabled={commentMutation.isPending}>
          {t('comment')}
        </button>
      </form>

      <Link to={ROUTES.FREE_BOARD} className="btn btn--secondary btn--block" style={{ marginTop: '1rem' }}>
        ← {t('freeBoard')}
      </Link>
    </PageShell>
  );
}
