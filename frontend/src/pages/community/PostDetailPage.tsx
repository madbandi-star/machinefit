import { useMemo, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Role, hasMinRole, getAuthorBadgeEmoji, type Comment } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { communityApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { buildCommentThreads, resolveReplyRootId } from '@/utils/commentThreads';
import { AuthorWithRole } from '@/components/common/AuthorWithRole';
import { Icon } from '@/components/icons/Icon';
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
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const commentFormRef = useRef<HTMLFormElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  /** Invalidate detail + board lists so like/comment counts refresh when navigating back. */
  const invalidatePost = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts });

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
    onSuccess: () => invalidatePost(),
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const commentMutation = useMutation({
    mutationFn: () =>
      communityApi.createComment(postId!, {
        content: comment.trim(),
        parentId: replyTo ?? undefined,
      }),
    onSuccess: () => {
      setComment('');
      setReplyTo(null);
      invalidatePost();
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      communityApi.updateComment(commentId, { content }),
    onSuccess: () => {
      setEditingId(null);
      setEditContent('');
      invalidatePost();
      showToast(t('commentUpdated'), 'success');
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => communityApi.deleteComment(commentId),
    onSuccess: () => {
      if (editingId) {
        setEditingId(null);
        setEditContent('');
      }
      invalidatePost();
      showToast(t('commentDeleted'), 'success');
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

  const commentThreads = useMemo(
    () => buildCommentThreads(data?.comments ?? []),
    [data?.comments]
  );

  const replyTarget = useMemo(() => {
    if (!replyTo || !data?.comments) return null;
    return data.comments.find((c) => c.id === replyTo) ?? null;
  }, [data?.comments, replyTo]);

  const isAdmin = hasMinRole(user?.roleCode, Role.ADMIN);

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      showToast(t('loginRequired'), 'error');
      navigate(ROUTES.LOGIN);
      return;
    }
    action();
  };

  const startReply = (commentId: string) => {
    requireAuth(() => {
      setEditingId(null);
      const rootId = resolveReplyRootId(commentId, data?.comments ?? []);
      setReplyTo(rootId);
      window.requestAnimationFrame(() => {
        commentFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        commentInputRef.current?.focus();
      });
    });
  };

  const startEdit = (item: Comment) => {
    requireAuth(() => {
      setReplyTo(null);
      setEditingId(item.id);
      setEditContent(item.content);
    });
  };

  const handleDeleteComment = (commentId: string) => {
    requireAuth(() => {
      if (!window.confirm(t('confirmDeleteComment'))) return;
      deleteCommentMutation.mutate(commentId);
    });
  };

  const handleLike = () => {
    requireAuth(() => likeMutation.mutate());
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    requireAuth(() => commentMutation.mutate());
  };

  const handleDelete = () => {
    if (window.confirm(t('confirmDelete'))) {
      deleteMutation.mutate();
    }
  };

  const renderComment = (item: Comment, replyClass?: string) => {
    const canEdit = Boolean(user && user.id === item.userId);
    const canDelete = Boolean(user && (user.id === item.userId || isAdmin));
    const isEditing = editingId === item.id;

    return (
      <div className={`comment-item${replyClass ? ` ${replyClass}` : ''}`}>
        <div className="comment-item__top">
          <AuthorWithRole
            className="comment-item__author"
            name={item.authorName}
            roleCode={item.authorRoleCode}
            hellpowerScore={item.authorHellpowerScore}
          />
          <time className="comment-item__date" dateTime={item.createdAt}>
            {formatDateTime(item.createdAt)}
          </time>
        </div>
        {isEditing ? (
          <>
            <textarea
              className="input comment-item__edit-input"
              rows={2}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              aria-label={t('editComment')}
            />
            <div className="comment-item__actions">
              <button
                type="button"
                className="btn btn--primary btn--sm"
                disabled={updateCommentMutation.isPending || !editContent.trim()}
                onClick={() =>
                  updateCommentMutation.mutate({
                    commentId: item.id,
                    content: editContent.trim(),
                  })
                }
              >
                {t('saveComment')}
              </button>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => {
                  setEditingId(null);
                  setEditContent('');
                }}
              >
                {t('cancel')}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="comment-item__body">{item.content}</p>
            <div className="comment-item__actions">
              <button
                type="button"
                className="btn btn--secondary btn--sm comment-item__reply"
                onClick={() => startReply(item.id)}
              >
                {t('photoReply')}
              </button>
              {canEdit ? (
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => startEdit(item)}
                >
                  {t('editComment')}
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  disabled={deleteCommentMutation.isPending}
                  onClick={() => handleDeleteComment(item.id)}
                >
                  {t('deleteComment')}
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    );
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
          {post.isPinned ? (
            <span className="board-post-card__pin">{t('pinnedPost')}</span>
          ) : null}
          <h2 className="post-detail__title">{post.title}</h2>
          <p className="post-detail__meta">
            <AuthorWithRole
              className="post-detail__author"
              name={post.authorName}
              roleCode={post.authorRoleCode}
              hellpowerScore={post.authorHellpowerScore}
            />
            <span className="post-detail__sep" aria-hidden>
              ·
            </span>
            <time dateTime={post.createdAt}>{formatDateTime(post.createdAt)}</time>
          </p>
          <div className="post-detail__chips">
            <span className="post-detail__chip">
              <Icon name="monitor" size={14} aria-hidden />
              {t('viewsCount', { count: post.viewCount })}
            </span>
            <span className="post-detail__chip">
              <Icon name="heart" size={14} aria-hidden />
              {t('likeCount', { count: post.likeCount ?? 0 })}
            </span>
            <span className="post-detail__chip">
              <Icon name="message" size={14} aria-hidden />
              {t('commentCount', { count: comments.length })}
            </span>
          </div>
        </header>

        <div className="post-detail__content">{post.content}</div>

        <div className="post-detail__actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={handleLike}
            disabled={likeMutation.isPending}
          >
            <Icon name="heart" size={14} aria-hidden /> {t('like')}
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

          {commentThreads.length ? (
            <ul className="comment-list">
              {commentThreads.map(({ root, replies }) => (
                <li key={root.id} className="comment-thread">
                  {renderComment(root)}
                  {replies.length ? (
                    <ul className="comment-thread__replies">
                      {replies.map((c) => (
                        <li key={c.id}>{renderComment(c, 'comment-item--reply')}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}

          <form ref={commentFormRef} onSubmit={handleComment} className="post-detail__comment-form">
            {replyTarget ? (
              <div className="post-detail__replying">
                <span>
                  {t('replyingTo', {
                    name: `${replyTarget.authorName || '—'} ${getAuthorBadgeEmoji(replyTarget.authorRoleCode, replyTarget.authorHellpowerScore)}`.trim(),
                  })}
                </span>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => setReplyTo(null)}
                >
                  {t('cancel')}
                </button>
              </div>
            ) : (
              <label className="post-detail__comment-label" htmlFor="comment">
                {t('writeComment')}
              </label>
            )}
            <textarea
              ref={commentInputRef}
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
              disabled={commentMutation.isPending || !comment.trim()}
            >
              {replyTarget ? t('photoReply') : t('comment')}
            </button>
          </form>
        </section>
      </article>
    </PageShell>
  );
}
