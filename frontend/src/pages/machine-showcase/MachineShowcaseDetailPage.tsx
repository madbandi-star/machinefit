import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { isRareOrHigher } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { RarityBadge } from '@/components/machine-showcase/RarityBadge';
import { machineShowcaseApi } from '@/api/machine-showcase.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { resolveShowcaseMediaUrl } from '@/utils/showcaseMediaUrl';
import '@/styles/components.css';
import '@/styles/machine-showcase.css';

export function MachineShowcaseDetailPage() {
  const { postId = '' } = useParams();
  const { t } = useTranslation('community');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const userId = useAuthStore((s) => s.user?.id);
  const { activeGymId, gyms } = useActiveGym();
  const [comment, setComment] = useState('');
  const [claimOpen, setClaimOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const detailQuery = useQuery({
    queryKey: QUERY_KEYS.machineShowcasePost(postId),
    queryFn: async () => (await machineShowcaseApi.get(postId)).data.data,
    enabled: Boolean(postId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.machineShowcasePost(postId) });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const post = detailQuery.data?.post;
      if (!post) return;
      if (post.likedByMe) await machineShowcaseApi.unlike(postId);
      else await machineShowcaseApi.like(postId);
    },
    onSuccess: invalidate,
    onError: (error) => showToast(getApiErrorMessage(error, t('errorGeneric')), 'error'),
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const post = detailQuery.data?.post;
      if (!post) return;
      if (post.bookmarkedByMe) await machineShowcaseApi.unbookmark(postId);
      else await machineShowcaseApi.bookmark(postId);
    },
    onSuccess: invalidate,
    onError: (error) => showToast(getApiErrorMessage(error, t('errorGeneric')), 'error'),
  });

  const commentMutation = useMutation({
    mutationFn: () => machineShowcaseApi.createComment(postId, { content: comment }),
    onSuccess: () => {
      setComment('');
      void invalidate();
    },
    onError: (error) => showToast(getApiErrorMessage(error, t('errorGeneric')), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => machineShowcaseApi.remove(postId),
    onSuccess: () => {
      showToast(t('showcase.deleted'), 'success');
      navigate(ROUTES.MACHINE_SHOWCASE);
    },
  });

  const post = detailQuery.data?.post;
  if (detailQuery.isLoading) {
    return (
      <div className="showcase-page">
        <PageShell>
          <Skeleton count={4} height={120} />
        </PageShell>
      </div>
    );
  }
  if (!post) {
    return (
      <PageShell title={t('showcase.title')}>
        <p className="showcase-empty">{t('showcase.notFound')}</p>
      </PageShell>
    );
  }

  const gymId = activeGymId || gyms[0]?.id;
  const gymLabel = post.gymName || post.userGymName;
  const comments = detailQuery.data?.comments ?? [];
  const hero = post.images?.[0] ?? post.coverImage;

  return (
    <div className="showcase-page">
      <PageShell
        title={post.machineName}
        subtitle={post.brandName}
        action={
          <Link to={ROUTES.MACHINE_SHOWCASE} className="showcase-detail__back">
            {t('showcase.backList')}
          </Link>
        }
      >
        <article className={`showcase-detail showcase-card--${post.rarity.grade.toLowerCase()}`}>
          <div className="showcase-detail__hero">
            {hero ? (
              <img src={resolveShowcaseMediaUrl(hero.mainUrl)} alt="" />
            ) : (
              <div className="showcase-card__placeholder" aria-hidden />
            )}
            <RarityBadge grade={post.rarity.grade} />
          </div>

          <header className="showcase-detail__id">
            <p className="showcase-detail__place">{gymLabel || '—'}</p>
            {post.discoveryRank === 1 ? (
              <p className="showcase-detail__finder">{t('showcase.firstFinder')}</p>
            ) : null}
            <div className="showcase-detail__chips">
              <span>{t('showcase.gymsRegistered', { count: post.rarity.gymHoldingCount })}</span>
              <span>{t('showcase.score', { score: post.rarity.score })}</span>
            </div>
          </header>

          {post.caption ? <p className="showcase-detail__caption">{post.caption}</p> : null}
          {post.tags.length ? (
            <p className="showcase-detail__tags">{post.tags.map((tag) => `#${tag}`).join(' ')}</p>
          ) : null}

          <div className="showcase-detail__toolbar">
            <button
              type="button"
              className={`showcase-detail__tool${post.likedByMe ? ' is-on' : ''}`}
              disabled={likeMutation.isPending}
              onClick={() => likeMutation.mutate()}
            >
              ♥ {post.likeCount}
            </button>
            <button
              type="button"
              className={`showcase-detail__tool${post.bookmarkedByMe ? ' is-on' : ''}`}
              disabled={bookmarkMutation.isPending}
              onClick={() => bookmarkMutation.mutate()}
            >
              🔖 {post.bookmarkCount}
            </button>
            <button
              type="button"
              className="showcase-detail__tool showcase-detail__tool--muted"
              disabled={busy}
              onClick={async () => {
                if (busy) return;
                setBusy(true);
                try {
                  await machineShowcaseApi.report({
                    postId: post.id,
                    reason: 'inappropriate',
                  });
                  showToast(t('showcase.reportSuccess'), 'success');
                } catch (error) {
                  showToast(getApiErrorMessage(error, t('errorGeneric')), 'error');
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t('showcase.report')}
            </button>
            {userId === post.userId ? (
              <button
                type="button"
                className="showcase-detail__tool showcase-detail__tool--danger"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? t('showcase.submitting') : t('showcase.delete')}
              </button>
            ) : null}
          </div>

          <button type="button" className="btn btn--primary btn--block" onClick={() => setClaimOpen(true)}>
            {t('showcase.claimCta')}
          </button>

          <div className="showcase-machine-links">
            <Link
              className="btn btn--secondary"
              to={ROUTES.MACHINE_DETAIL.replace(':machineCode', post.machineCode)}
            >
              {t('showcase.viewMachine')}
            </Link>
            <Link className="btn btn--secondary" to={ROUTES.MACHINE_DEX}>
              {t('showcase.viewDex')}
            </Link>
          </div>

          <section className="showcase-comments">
            <div className="showcase-comments__head">
              <h3>{t('showcase.comments', { count: comments.length })}</h3>
            </div>
            {comments.length === 0 ? (
              <p className="showcase-comments__empty">{t('showcase.commentsEmpty')}</p>
            ) : (
              <ul className="showcase-comments__list">
                {comments.map((c) => (
                  <li key={c.id} className="showcase-comments__item">
                    <strong>{c.authorName}</strong>
                    <p>{c.content}</p>
                  </li>
                ))}
              </ul>
            )}
            <form
              className="showcase-comments__form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!comment.trim() || commentMutation.isPending) return;
                commentMutation.mutate();
              }}
            >
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('showcase.commentPlaceholder')}
              />
              <button type="submit" className="btn btn--secondary" disabled={commentMutation.isPending}>
                {t('showcase.commentSubmit')}
              </button>
            </form>
          </section>
        </article>

        <ConfirmDialog
          open={claimOpen}
          title={t('showcase.claimTitle')}
          message={t('showcase.claimConfirm')}
          confirmLabel={t('showcase.claimCta')}
          onClose={() => setClaimOpen(false)}
          onConfirm={async () => {
            if (!gymId || busy) return;
            setBusy(true);
            try {
              await machineShowcaseApi.claimGymMachine({
                userGymId: gymId,
                machineCode: post.machineCode,
                sourcePostId: post.id,
              });
              showToast(t('showcase.claimSuccess'), 'success');
              if (isRareOrHigher(post.rarity.grade)) {
                showToast(
                  t('showcase.rareFound', {
                    grade: post.rarity.grade,
                    count: post.rarity.gymHoldingCount,
                  }),
                  'success'
                );
              }
              setClaimOpen(false);
            } catch (error) {
              showToast(getApiErrorMessage(error, t('errorGeneric')), 'error');
            } finally {
              setBusy(false);
            }
          }}
        />
      </PageShell>
    </div>
  );
}
