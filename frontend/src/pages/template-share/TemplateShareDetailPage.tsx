import { FormEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { TemplateShareReportReason } from '@machinefit/shared';
import { TEMPLATE_SHARE_REPORT_REASONS } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { templateShareApi } from '@/api/template-share.api';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import '@/styles/template-share.css';

function formatCommentTime(iso: string) {
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

export function TemplateShareDetailPage() {
  const { postId = '' } = useParams<{ postId: string }>();
  const { t } = useTranslation('community');
  const { t: tc } = useTranslation('common');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const [comment, setComment] = useState('');
  const [reportReason, setReportReason] = useState<TemplateShareReportReason>('spam');

  const detailQuery = useQuery({
    queryKey: ['template-shares', postId],
    queryFn: async () => (await templateShareApi.get(postId)).data.data,
    enabled: Boolean(postId),
  });

  const commentsQuery = useQuery({
    queryKey: ['template-shares', postId, 'comments'],
    queryFn: async () => (await templateShareApi.listComments(postId)).data.data,
    enabled: Boolean(postId),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['template-shares', postId] });
    await queryClient.invalidateQueries({ queryKey: ['template-shares'] });
    await queryClient.invalidateQueries({ queryKey: ['workout-cards', 'templates'] });
  };

  const downloadMutation = useMutation({
    mutationFn: () => templateShareApi.download(postId),
    onSuccess: async (res) => {
      await invalidate();
      showToast(
        res.data.data.alreadyOwned
          ? t('templateShare.alreadyDownloaded')
          : t('templateShare.downloaded'),
        'success'
      );
      navigate(`${ROUTES.MY_TEMPLATES}#received`, { replace: false });
    },
    onError: () => showToast(tc('errors.submitFailed'), 'error'),
  });

  const likeMutation = useMutation({
    mutationFn: () => templateShareApi.toggleLike(postId),
    onSuccess: invalidate,
  });

  const favMutation = useMutation({
    mutationFn: () => templateShareApi.toggleFavorite(postId),
    onSuccess: invalidate,
  });

  const commentMutation = useMutation({
    mutationFn: () => templateShareApi.addComment(postId, { content: comment.trim() }),
    onSuccess: async () => {
      setComment('');
      await queryClient.invalidateQueries({ queryKey: ['template-shares', postId, 'comments'] });
      await invalidate();
      showToast(t('templateShare.commentAdded'), 'success');
    },
    onError: () => showToast(tc('errors.submitFailed'), 'error'),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => templateShareApi.deleteComment(postId, commentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['template-shares', postId, 'comments'] });
      await invalidate();
    },
  });

  const reportMutation = useMutation({
    mutationFn: () =>
      templateShareApi.report(postId, { reason: reportReason, description: '' }),
    onSuccess: () => showToast(t('templateShare.reportSubmitted'), 'success'),
    onError: () => showToast(tc('errors.submitFailed'), 'error'),
  });

  const post = detailQuery.data;

  const shareUrl = () => {
    if (!post) return;
    const path = ROUTES.TEMPLATE_SHARE_DETAIL.replace(':postId', post.id);
    const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
    const url = `${window.location.origin}${base}${path}`;
    void navigator.clipboard.writeText(url).then(
      () => showToast(t('templateShare.linkCopied'), 'success'),
      () => showToast(tc('errors.submitFailed'), 'error')
    );
  };

  if (detailQuery.isLoading) {
    return (
      <PageShell title={t('templateShare.title')}>
        <div className="tpl-share-page">
          <Skeleton count={4} height={88} />
        </div>
      </PageShell>
    );
  }

  if (detailQuery.isError || !post) {
    return (
      <PageShell title={t('templateShare.title')}>
        <div className="tpl-share-page">
          <Link to={ROUTES.TEMPLATE_SHARE} className="tpl-share-back">
            {t('templateShare.backToHub')}
          </Link>
          <QueryErrorMessage onRetry={() => void detailQuery.refetch()} />
        </div>
      </PageShell>
    );
  }

  const onComment = (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    commentMutation.mutate();
  };

  const comments = commentsQuery.data ?? [];

  return (
    <PageShell
      title={post.title}
      subtitle={`${t('templateShare.author')}: ${post.authorName}`}
    >
      <div className="tpl-share-page tpl-share-detail">
        <Link to={ROUTES.TEMPLATE_SHARE} className="tpl-share-back">
          {t('templateShare.backToHub')}
        </Link>

        {post.thumbnailUrl ? (
          <div className="tpl-share-detail__hero">
            <img src={post.thumbnailUrl} alt="" />
          </div>
        ) : null}

        <section className="tpl-share-panel">
          <div className="tpl-share-detail__meta">
            <span className="tpl-share-detail__chip">
              {t(`templateShare.difficulty.${post.difficulty}`)}
            </span>
            <span className="tpl-share-detail__chip">
              {t(`templateShare.category.${post.category}`)}
            </span>
            {post.tags.map((tag) => (
              <span key={tag} className="tpl-share-detail__chip">
                #{tag}
              </span>
            ))}
          </div>

          <div className="tpl-share-detail__stats">
            <span>
              {t('templateShare.statLikes')} {post.likeCount}
            </span>
            <span>
              {t('templateShare.statDownloads')} {post.downloadCount}
            </span>
            <span>
              {t('templateShare.statUses')} {post.useCount}
            </span>
            <span>
              {t('templateShare.statViews')} {post.viewCount}
            </span>
            <span>
              {t('templateShare.statComments')} {post.commentCount}
            </span>
          </div>

          {post.description ? <p className="tpl-share-detail__desc">{post.description}</p> : null}

          {post.youtubeUrl || post.youtubeChannelName || post.instagramId ? (
            <div className="tpl-share-creator-links" aria-label={t('templateShare.creatorLinks')}>
              <p className="tpl-share-creator-links__title">{t('templateShare.creatorLinks')}</p>
              <ul className="tpl-share-creator-links__list">
                {post.youtubeChannelName ? (
                  <li>
                    <span className="tpl-share-creator-links__label">
                      {t('templateShare.fieldYoutubeChannel')}
                    </span>
                    <span className="tpl-share-creator-links__value">{post.youtubeChannelName}</span>
                  </li>
                ) : null}
                {post.youtubeUrl ? (
                  <li>
                    <span className="tpl-share-creator-links__label">
                      {t('templateShare.fieldYoutubeUrl')}
                    </span>
                    <a
                      className="tpl-share-creator-links__link"
                      href={post.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {post.youtubeUrl}
                    </a>
                  </li>
                ) : null}
                {post.instagramId ? (
                  <li>
                    <span className="tpl-share-creator-links__label">
                      {t('templateShare.fieldInstagramId')}
                    </span>
                    <a
                      className="tpl-share-creator-links__link"
                      href={`https://instagram.com/${encodeURIComponent(post.instagramId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @{post.instagramId}
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="tpl-share-panel">
          <div className="tpl-share-detail__section-head">
            <h3 className="tpl-share-detail__section-title">{t('templateShare.workoutList')}</h3>
            <span className="tpl-share-detail__section-count">
              {t('templateShare.exerciseCount', { count: post.items.length })}
            </span>
          </div>
          <ol className="tpl-share-items">
            {post.items.map((item, idx) => (
              <li key={`${item.machineCode}-${idx}`}>
                <span className="tpl-share-items__num" aria-hidden>
                  {idx + 1}
                </span>
                <div className="tpl-share-items__body">
                  <span className="tpl-share-items__name">{item.machineCode}</span>
                  <div className="tpl-share-items__sub">
                    {item.setCount}
                    {t('templateShare.sets')} · {item.setWeightsKg.join('/')}kg
                    {item.restSeconds != null
                      ? ` · ${t('templateShare.restSeconds', { n: item.restSeconds })}`
                      : ''}
                    {item.voicePrefs ? ` · ${t('templateShare.hasVoice')}` : ''}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="tpl-share-panel">
          <h3 className="tpl-share-detail__section-title">{t('templateShare.actions')}</h3>
          <div className="tpl-share-detail__secondary">
            <button
              type="button"
              className="btn btn--secondary"
              disabled={!isAuthenticated || likeMutation.isPending}
              onClick={() => likeMutation.mutate()}
            >
              {post.likedByMe ? t('templateShare.unlike') : t('templateShare.like')}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={!isAuthenticated || favMutation.isPending}
              onClick={() => favMutation.mutate()}
            >
              {post.favoritedByMe ? t('templateShare.unfavorite') : t('templateShare.favorite')}
            </button>
            <button type="button" className="btn btn--ghost" onClick={shareUrl}>
              {t('templateShare.copyLink')}
            </button>
          </div>

          {isAuthenticated ? (
            <div className="tpl-share-detail__report">
              <select
                className="input"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value as TemplateShareReportReason)}
                aria-label={t('templateShare.report')}
              >
                {TEMPLATE_SHARE_REPORT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {t(`templateShare.reportReasons.${reason}`)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={reportMutation.isPending}
                onClick={() => {
                  if (window.confirm(t('templateShare.reportConfirm'))) reportMutation.mutate();
                }}
              >
                {t('templateShare.report')}
              </button>
            </div>
          ) : (
            <p className="tpl-share-detail__login-hint">
              <Link to={ROUTES.LOGIN}>{tc('nav.login')}</Link> {t('templateShare.loginHint')}
            </p>
          )}
        </section>

        <section className="tpl-share-panel">
          <div className="tpl-share-detail__section-head">
            <h3 className="tpl-share-detail__section-title">{t('templateShare.comments')}</h3>
            <span className="tpl-share-detail__section-count">{comments.length}</span>
          </div>

          {isAuthenticated ? (
            <form className="tpl-share-comment-form" onSubmit={onComment}>
              <input
                className="input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('templateShare.commentPlaceholder')}
              />
              <button
                type="submit"
                className="btn btn--primary"
                disabled={commentMutation.isPending}
              >
                {t('templateShare.commentSubmit')}
              </button>
            </form>
          ) : null}

          <div className="tpl-share-comments">
            {comments.map((c) => (
              <div key={c.id} className="tpl-share-comment">
                <div className="tpl-share-comment__meta">
                  <span className="tpl-share-comment__author">
                    {c.authorName}
                    {c.userId === userId ? ` · ${t('templateShare.me')}` : ''}
                  </span>
                  <span className="tpl-share-comment__time">{formatCommentTime(c.createdAt)}</span>
                </div>
                <p className="tpl-share-comment__body">{c.content}</p>
                {c.canDelete ? (
                  <div className="tpl-share-comment__actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => deleteCommentMutation.mutate(c.id)}
                    >
                      {tc('actions.delete')}
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
            {comments.length === 0 ? (
              <p className="tpl-share-empty">{t('templateShare.noComments')}</p>
            ) : null}
          </div>
        </section>

        <div className="tpl-share-sticky-cta">
          {post.downloadedByMe ? (
            <Link to={`${ROUTES.MY_TEMPLATES}#received`} className="btn btn--primary">
              {t('templateShare.viewInMyTemplates')}
            </Link>
          ) : (
            <button
              type="button"
              className="btn btn--primary"
              disabled={!isAuthenticated || !post.canDownload || downloadMutation.isPending}
              onClick={() => downloadMutation.mutate()}
            >
              {t('templateShare.download')}
            </button>
          )}
        </div>
      </div>
    </PageShell>
  );
}
