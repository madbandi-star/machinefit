import { useMemo, useState } from 'react';
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
  const [imageIdx, setImageIdx] = useState(0);

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
  const images = useMemo(() => {
    if (!post) return [];
    if (post.images?.length) return post.images;
    return post.coverImage ? [post.coverImage] : [];
  }, [post]);
  const hero = images[Math.min(imageIdx, Math.max(0, images.length - 1))] ?? images[0];

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
  const brandLine = [post.brandName, post.machineName].filter(Boolean).join(' · ');

  return (
    <div className="showcase-page showcase-page--detail">
      <PageShell>
        <nav className="showcase-detail__nav">
          <Link to={ROUTES.MACHINE_SHOWCASE} className="showcase-detail__back">
            {t('showcase.backList')}
          </Link>
          <div className="showcase-detail__nav-tools">
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
          </div>
        </nav>

        <article className={`showcase-detail showcase-card--${post.rarity.grade.toLowerCase()}`}>
          <div className="showcase-detail__hero">
            {hero ? (
              <img src={resolveShowcaseMediaUrl(hero.mainUrl)} alt="" />
            ) : (
              <div className="showcase-card__placeholder" aria-hidden />
            )}
            <RarityBadge grade={post.rarity.grade} compact />
            {images.length > 1 ? (
              <span className="showcase-detail__count">
                {Math.min(imageIdx, images.length - 1) + 1}/{images.length}
              </span>
            ) : null}
            <div className="showcase-detail__overlay">
              <p className="showcase-detail__place">{gymLabel || '—'}</p>
              <h1 className="showcase-detail__machine">{brandLine || post.machineName}</h1>
            </div>
          </div>

          {images.length > 1 ? (
            <div className="showcase-detail__thumbs" role="list">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  role="listitem"
                  className={`showcase-detail__thumb${idx === imageIdx ? ' is-on' : ''}`}
                  onClick={() => setImageIdx(idx)}
                  aria-label={`${idx + 1}`}
                >
                  <img src={resolveShowcaseMediaUrl(img.thumbUrl)} alt="" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="showcase-detail__meta">
            {post.discoveryRank === 1 ? (
              <span className="showcase-detail__chip showcase-detail__chip--gold">
                {t('showcase.firstFinder')}
              </span>
            ) : post.discoveryRank ? (
              <span className="showcase-detail__chip">
                {t('showcase.finderRank', { rank: post.discoveryRank })}
              </span>
            ) : null}
            <span className="showcase-detail__chip">
              {t('showcase.gymsStat', { count: post.rarity.gymHoldingCount })}
            </span>
            <span className="showcase-detail__chip">
              {t('showcase.score', { score: post.rarity.score })}
            </span>
          </div>

          {post.caption ? <p className="showcase-detail__caption">{post.caption}</p> : null}
          {post.tags.length ? (
            <p className="showcase-detail__tags">{post.tags.map((tag) => `#${tag}`).join(' ')}</p>
          ) : null}

          <div className="showcase-detail__cta">
            <button type="button" className="showcase-detail__claim" onClick={() => setClaimOpen(true)}>
              {t('showcase.claimCtaShort')}
            </button>
            <Link
              className="showcase-detail__link"
              to={ROUTES.MACHINE_DETAIL.replace(':machineCode', post.machineCode)}
            >
              {t('showcase.viewMachineShort')}
            </Link>
            <Link className="showcase-detail__link" to={ROUTES.MACHINE_DEX}>
              {t('showcase.viewDexShort')}
            </Link>
            <button
              type="button"
              className="showcase-detail__link showcase-detail__link--btn"
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
                className="showcase-detail__link showcase-detail__link--btn showcase-detail__link--danger"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? t('showcase.submitting') : t('showcase.delete')}
              </button>
            ) : null}
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
          confirmLabel={t('showcase.claimCtaShort')}
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
