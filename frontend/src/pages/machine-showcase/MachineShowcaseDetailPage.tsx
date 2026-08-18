import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { isRareOrHigher } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { Icon } from '@/components/icons/Icon';
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

function formatPostedAt(iso: string, locale: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MachineShowcaseDetailPage() {
  const { postId = '' } = useParams();
  const { t, i18n } = useTranslation('community');
  const { t: tm } = useTranslation('machines');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const userId = useAuthStore((s) => s.user?.id);
  const { activeGymId, gyms } = useActiveGym();
  const [comment, setComment] = useState('');
  const [claimOpen, setClaimOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [imageIdx, setImageIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const detailQuery = useQuery({
    queryKey: QUERY_KEYS.machineShowcasePost(postId),
    queryFn: async () => (await machineShowcaseApi.get(postId)).data.data,
    enabled: Boolean(postId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.machineShowcasePost(postId) });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const current = detailQuery.data?.post;
      if (!current) return;
      if (current.likedByMe) await machineShowcaseApi.unlike(postId);
      else await machineShowcaseApi.like(postId);
    },
    onSuccess: invalidate,
    onError: (error) => showToast(getApiErrorMessage(error, t('errorGeneric')), 'error'),
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const current = detailQuery.data?.post;
      if (!current) return;
      if (current.bookmarkedByMe) await machineShowcaseApi.unbookmark(postId);
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
    onError: (error) => showToast(getApiErrorMessage(error, t('errorGeneric')), 'error'),
  });

  const post = detailQuery.data?.post;
  const images = useMemo(() => {
    if (!post) return [];
    if (post.images?.length) return post.images;
    return post.coverImage ? [post.coverImage] : [];
  }, [post]);
  const safeIdx = Math.min(imageIdx, Math.max(0, images.length - 1));
  const hero = images[safeIdx] ?? images[0];

  const stepImage = (delta: number) => {
    if (images.length < 2) return;
    setImageIdx((prev) => (prev + delta + images.length) % images.length);
  };

  if (detailQuery.isLoading) {
    return (
      <div className="showcase-page showcase-page--detail">
        <PageShell>
          <Skeleton height={56} />
          <Skeleton height={280} />
          <Skeleton count={3} height={72} />
        </PageShell>
      </div>
    );
  }
  if (!post) {
    return (
      <div className="showcase-page showcase-page--detail">
        <PageShell>
          <nav className="showcase-detail__nav">
            <Link to={ROUTES.MACHINE_SHOWCASE} className="showcase-detail__back">
              <Icon name="chevronLeft" size={18} aria-hidden />
              {t('showcase.backList')}
            </Link>
          </nav>
          <p className="showcase-empty">{t('showcase.notFound')}</p>
        </PageShell>
      </div>
    );
  }

  const gymId = activeGymId || gyms[0]?.id;
  const gymLabel = [post.gymName || post.userGymName, post.gymCity].filter(Boolean).join(' · ');
  const comments = detailQuery.data?.comments ?? [];
  const muscleKey = post.muscleGroup ? `muscleGroups.${post.muscleGroup}` : '';
  const muscleLabel =
    muscleKey && tm(muscleKey) !== muscleKey ? tm(muscleKey) : post.muscleGroup || '';
  const brandLine = [post.brandName, muscleLabel].filter(Boolean).join(' · ');

  return (
    <div className="showcase-page showcase-page--detail">
      <PageShell>
        <nav className="showcase-detail__nav">
          <Link to={ROUTES.MACHINE_SHOWCASE} className="showcase-detail__back">
            <Icon name="chevronLeft" size={18} aria-hidden />
            {t('showcase.backList')}
          </Link>
          <div className="showcase-detail__nav-tools">
            <button
              type="button"
              className={`showcase-detail__tool${post.likedByMe ? ' is-on' : ''}`}
              disabled={likeMutation.isPending}
              aria-label={t('showcase.likesLabel')}
              onClick={() => likeMutation.mutate()}
            >
              <Icon name="heart" size={18} aria-hidden />
              {post.likeCount}
            </button>
            <button
              type="button"
              className={`showcase-detail__tool${post.bookmarkedByMe ? ' is-booked' : ''}`}
              disabled={bookmarkMutation.isPending}
              aria-label={t('showcase.bookmarkLabel')}
              onClick={() => bookmarkMutation.mutate()}
            >
              <Icon name="bookmark" size={18} aria-hidden />
              {post.bookmarkCount}
            </button>
          </div>
        </nav>

        <article className={`showcase-detail showcase-card--${post.rarity.grade.toLowerCase()}`}>
          <div
            className="showcase-detail__hero"
            onTouchStart={(e) => {
              touchStartX.current = e.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              const start = touchStartX.current;
              touchStartX.current = null;
              if (start == null) return;
              const dx = (e.changedTouches[0]?.clientX ?? start) - start;
              if (dx > 40) stepImage(-1);
              else if (dx < -40) stepImage(1);
            }}
          >
            {hero ? (
              <img src={resolveShowcaseMediaUrl(hero.mainUrl)} alt="" />
            ) : (
              <div className="showcase-card__placeholder" aria-hidden />
            )}
            <RarityBadge grade={post.rarity.grade} compact />
            {images.length > 1 ? (
              <>
                <span className="showcase-detail__count">
                  {safeIdx + 1}/{images.length}
                </span>
                <button
                  type="button"
                  className="showcase-detail__pager showcase-detail__pager--prev"
                  aria-label={t('showcase.prevPhoto')}
                  onClick={() => stepImage(-1)}
                >
                  <Icon name="chevronLeft" size={20} aria-hidden />
                </button>
                <button
                  type="button"
                  className="showcase-detail__pager showcase-detail__pager--next"
                  aria-label={t('showcase.nextPhoto')}
                  onClick={() => stepImage(1)}
                >
                  <Icon name="chevronRight" size={20} aria-hidden />
                </button>
              </>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="showcase-detail__thumbs" role="list">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  role="listitem"
                  className={`showcase-detail__thumb${idx === safeIdx ? ' is-on' : ''}`}
                  onClick={() => setImageIdx(idx)}
                  aria-label={t('showcase.photoIndex', { n: idx + 1 })}
                >
                  <img src={resolveShowcaseMediaUrl(img.thumbUrl)} alt="" />
                </button>
              ))}
            </div>
          ) : null}

          <header className="showcase-detail__head">
            {gymLabel ? <p className="showcase-detail__place">{gymLabel}</p> : null}
            <h1 className="showcase-detail__machine">{post.machineName}</h1>
            {brandLine ? <p className="showcase-detail__brand">{brandLine}</p> : null}
            <p className="showcase-detail__byline">
              {[
                post.authorName,
                formatPostedAt(post.createdAt, i18n.language),
                t('showcase.views', { count: post.viewCount }),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </header>

          <div className="showcase-detail__stats">
            {post.discoveryRank === 1 ? (
              <span className="is-gold">{t('showcase.dexFirst')}</span>
            ) : post.discoveryRank ? (
              <span>{t('showcase.finderRank', { rank: post.discoveryRank })}</span>
            ) : null}
            <span>{t('showcase.gymsStat', { count: post.rarity.gymHoldingCount })}</span>
            <span>{t('showcase.score', { score: post.rarity.score })}</span>
          </div>

          {post.caption ? <p className="showcase-detail__caption">{post.caption}</p> : null}

          {post.tags.length ? (
            <ul className="showcase-detail__tags">
              {post.tags.map((tag) => (
                <li key={tag}>#{tag}</li>
              ))}
            </ul>
          ) : null}

          <div className="showcase-detail__cta">
            <button type="button" className="btn btn--primary" onClick={() => setClaimOpen(true)}>
              {t('showcase.claimCtaShort')}
            </button>
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

          <div className="showcase-detail__more">
            <button
              type="button"
              className="showcase-detail__more-btn"
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
                className="showcase-detail__more-btn is-danger"
                disabled={deleteMutation.isPending}
                onClick={() => setDeleteOpen(true)}
              >
                {t('showcase.delete')}
              </button>
            ) : null}
          </div>

          <section className="showcase-comments">
            <div className="showcase-comments__head">
              <h2>{t('showcase.comments', { count: comments.length })}</h2>
            </div>
            {comments.length === 0 ? (
              <p className="showcase-comments__empty">{t('showcase.commentsEmpty')}</p>
            ) : (
              <ul className="showcase-comments__list">
                {comments.map((item) => (
                  <li key={item.id} className="showcase-comments__item">
                    <div className="showcase-comments__meta">
                      <strong>{item.authorName || '—'}</strong>
                      <time dateTime={item.createdAt}>
                        {formatPostedAt(item.createdAt, i18n.language)}
                      </time>
                    </div>
                    <p>{item.content}</p>
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
                className="input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('showcase.commentPlaceholder')}
                aria-label={t('showcase.commentPlaceholder')}
              />
              <button
                type="submit"
                className="btn btn--secondary"
                disabled={commentMutation.isPending || !comment.trim()}
              >
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
        <ConfirmDialog
          open={deleteOpen}
          title={t('showcase.delete')}
          message={t('showcase.deleteConfirm')}
          confirmLabel={t('showcase.delete')}
          confirmVariant="danger"
          onClose={() => setDeleteOpen(false)}
          onConfirm={() => {
            setDeleteOpen(false);
            deleteMutation.mutate();
          }}
        />
      </PageShell>
    </div>
  );
}
