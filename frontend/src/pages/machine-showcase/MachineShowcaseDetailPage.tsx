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
  if (detailQuery.isLoading) return <Skeleton count={4} height={120} />;
  if (!post) {
    return (
      <PageShell title={t('showcase.title')}>
        <p className="showcase-empty">{t('showcase.notFound')}</p>
      </PageShell>
    );
  }

  const gymId = activeGymId || gyms[0]?.id;

  return (
    <PageShell title={post.machineName} subtitle={post.brandName}>
      <article className={`showcase-detail showcase-card--${post.rarity.grade.toLowerCase()}`}>
        <div className="showcase-detail__hero">
          {post.images?.[0] || post.coverImage ? (
            <img
              src={resolveShowcaseMediaUrl((post.images?.[0] ?? post.coverImage)!.mainUrl)}
              alt=""
            />
          ) : null}
        </div>
        <RarityBadge grade={post.rarity.grade} />
        <h2>{post.machineName}</h2>
        {post.brandName ? <p>🏋️ {post.brandName}</p> : null}
        <p>📍 {post.gymName || post.userGymName || '—'}</p>
        <p>
          {t('showcase.gymsRegistered', { count: post.rarity.gymHoldingCount })}
          {' · '}
          {t('showcase.score', { score: post.rarity.score })}
        </p>
        {post.discoveryRank === 1 ? <p>{t('showcase.firstFinder')}</p> : null}
        {post.caption ? <p>{post.caption}</p> : null}
        {post.tags.length ? (
          <p>{post.tags.map((tag) => `#${tag}`).join(' ')}</p>
        ) : null}

        <div className="showcase-detail__actions">
          <button
            type="button"
            className="btn btn--secondary"
            disabled={likeMutation.isPending}
            onClick={() => likeMutation.mutate()}
          >
            ❤️ {post.likeCount}
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            disabled={bookmarkMutation.isPending}
            onClick={() => bookmarkMutation.mutate()}
          >
            🔖 {post.bookmarkCount}
          </button>
          <button
            type="button"
            className="btn btn--secondary"
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

        {userId === post.userId ? (
          <button type="button" className="btn btn--ghost" onClick={() => deleteMutation.mutate()}>
            {deleteMutation.isPending ? t('showcase.submitting') : t('showcase.delete')}
          </button>
        ) : null}

        <section>
          <h3>💬 {post.commentCount}</h3>
          <ul>
            {(detailQuery.data?.comments ?? []).map((c) => (
              <li key={c.id}>
                <strong>{c.authorName}</strong> {c.content}
              </li>
            ))}
          </ul>
          <form
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
  );
}
