import { FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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

export function TemplateShareDetailPage() {
  const { postId = '' } = useParams<{ postId: string }>();
  const { t } = useTranslation('community');
  const { t: tc } = useTranslation('common');
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
    await queryClient.invalidateQueries({ queryKey: ['workout-card-templates'] });
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
        <Skeleton count={4} height={88} />
      </PageShell>
    );
  }

  if (detailQuery.isError || !post) {
    return (
      <PageShell title={t('templateShare.title')}>
        <QueryErrorMessage onRetry={() => void detailQuery.refetch()} />
      </PageShell>
    );
  }

  const onComment = (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    commentMutation.mutate();
  };

  return (
    <PageShell title={post.title} subtitle={`${t('templateShare.author')}: ${post.authorName}`}>
      {post.thumbnailUrl ? (
        <div className="tpl-share-card__media" style={{ borderRadius: '0.75rem', marginBottom: '1rem' }}>
          <img src={post.thumbnailUrl} alt="" />
        </div>
      ) : null}

      <div className="tpl-share-detail__stats">
        <span>❤️ {post.likeCount}</span>
        <span>📥 {post.downloadCount}</span>
        <span>🏋️ {post.useCount}</span>
        <span>👁 {post.viewCount}</span>
        <span>💬 {post.commentCount}</span>
      </div>

      {post.description ? <p style={{ whiteSpace: 'pre-wrap' }}>{post.description}</p> : null}

      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
        {t(`templateShare.difficulty.${post.difficulty}`)} · {t(`templateShare.category.${post.category}`)}
        {post.tags.length ? ` · ${post.tags.map((tag) => `#${tag}`).join(' ')}` : ''}
      </p>

      <h3>{t('templateShare.workoutList')}</h3>
      <ol className="tpl-share-items">
        {post.items.map((item, idx) => (
          <li key={`${item.machineCode}-${idx}`}>
            <strong>
              {idx + 1}. {item.machineCode}
            </strong>
            <div>
              {item.setCount}
              {t('templateShare.sets')} · {item.setWeightsKg.join('/')}kg
              {item.restSeconds != null ? ` · rest ${item.restSeconds}s` : ''}
              {item.voicePrefs ? ` · ${t('templateShare.hasVoice')}` : ''}
            </div>
          </li>
        ))}
      </ol>

      <div className="tpl-share-detail__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!isAuthenticated || !post.canDownload || downloadMutation.isPending}
          onClick={() => downloadMutation.mutate()}
        >
          {post.downloadedByMe ? t('templateShare.downloadedAlready') : t('templateShare.download')}
        </button>
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
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
        <p>
          <Link to={ROUTES.LOGIN}>{tc('nav.login')}</Link> {t('templateShare.loginHint')}
        </p>
      )}

      <h3>{t('templateShare.comments')}</h3>
      {isAuthenticated ? (
        <form onSubmit={onComment} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <input
            className="input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('templateShare.commentPlaceholder')}
          />
          <button type="submit" className="btn btn--primary" disabled={commentMutation.isPending}>
            {t('templateShare.commentSubmit')}
          </button>
        </form>
      ) : null}

      <div className="tpl-share-comments">
        {(commentsQuery.data ?? []).map((c) => (
          <div key={c.id} className="tpl-share-comment">
            <div className="tpl-share-comment__meta">
              <span>
                {c.authorName}
                {c.userId === userId ? ` · ${t('templateShare.me')}` : ''}
              </span>
              <span>{new Date(c.createdAt).toLocaleString()}</span>
            </div>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{c.content}</p>
            {c.canDelete ? (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                style={{ marginTop: '0.35rem' }}
                onClick={() => deleteCommentMutation.mutate(c.id)}
              >
                {tc('actions.delete')}
              </button>
            ) : null}
          </div>
        ))}
        {(commentsQuery.data?.length ?? 0) === 0 ? (
          <p className="empty-state">{t('templateShare.noComments')}</p>
        ) : null}
      </div>
    </PageShell>
  );
}
