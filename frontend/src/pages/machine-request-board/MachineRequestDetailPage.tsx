import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { MACHINE_REQUEST_UNKNOWN_VALUE } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { machineRequestApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { resolveMachineRequestMediaUrl } from '@/utils/machineRequestMediaUrl';
import '@/styles/components.css';
import '@/styles/photo-board.css';

function displayField(value: string | undefined, unknownLabel: string) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || trimmed === MACHINE_REQUEST_UNKNOWN_VALUE) return unknownLabel;
  return trimmed;
}

export function MachineRequestDetailPage() {
  const { requestId = '' } = useParams();
  const { t } = useTranslation('community');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const unknownLabel = t('requestFieldUnknownLabel');

  const [index, setIndex] = useState(0);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.machineRequestDetail(requestId),
    queryFn: async () => (await machineRequestApi.get(requestId)).data.data,
    enabled: Boolean(requestId),
  });

  const images = data?.request.images ?? [];

  const likeMutation = useMutation({
    mutationFn: () => machineRequestApi.toggleLike(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.machineRequestDetail(requestId) });
      queryClient.invalidateQueries({ queryKey: ['machine-requests'] });
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const commentMutation = useMutation({
    mutationFn: () =>
      machineRequestApi.createComment(requestId, {
        content: comment.trim(),
        parentId: replyTo ?? undefined,
      }),
    onSuccess: () => {
      setComment('');
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.machineRequestDetail(requestId) });
      queryClient.invalidateQueries({ queryKey: ['machine-requests'] });
      showToast(t('createSuccess'), 'success');
    },
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
        await navigator.share({
          title: data
            ? `${displayField(data.request.brandName, unknownLabel)} · ${displayField(data.request.machineName, unknownLabel)}`
            : t('machineRequests'),
          url,
        });
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
    if (!data?.request.createdAt) return '';
    try {
      return new Date(data.request.createdAt).toLocaleString();
    } catch {
      return data.request.createdAt;
    }
  }, [data?.request.createdAt]);

  if (isLoading || !data) {
    return (
      <PageShell title={t('machineRequests')}>
        <Skeleton count={4} height={96} />
      </PageShell>
    );
  }

  const { request, comments } = data;
  const title = `${displayField(request.brandName, unknownLabel)} · ${displayField(request.machineName, unknownLabel)}`;
  const gymLabel =
    request.gymChoiceMode === 'unknown'
      ? t('requestGymUnknownLabel')
      : request.gymName?.trim() || undefined;
  const statusLabel = t(`requestStatus_${request.status}`, { defaultValue: request.status });

  return (
    <div className="photo-detail">
      <PageShell title={title} subtitle={formattedDate}>
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
            {(images.length ? images : [{ id: 'empty', imageUrl: '', thumbUrl: '', sortOrder: 0 }]).map(
              (image) => (
                <div key={image.id} className="photo-detail__slide">
                  {image.imageUrl ? (
                    <img
                      src={resolveMachineRequestMediaUrl(image.imageUrl)}
                      alt={title}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : request.primaryImageUrl ? (
                    <img
                      src={resolveMachineRequestMediaUrl(request.primaryImageUrl)}
                      alt={title}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="photo-card__placeholder" aria-hidden />
                  )}
                </div>
              )
            )}
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
            {request.likedByMe ? '♥' : '♡'} {request.likeCount ?? 0}
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => void share()}>
            {t('photoShare')}
          </button>
        </div>

        <div style={{ display: 'grid', gap: '0.35rem' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            {t('photoAuthor')}: {request.authorName || '—'} · {t('status')}: {statusLabel}
            {gymLabel ? ` · ${t('requestGymLabel')}: ${gymLabel}` : ''}
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            {t('photoViews')}: {request.viewCount ?? 0} · {t('comments')}: {request.commentCount ?? 0}
          </div>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {displayField(request.description, unknownLabel)}
          </p>
        </div>

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

        <Link to={ROUTES.MACHINE_REQUESTS} className="btn btn--secondary btn--block">
          {t('photoBackList')}
        </Link>
      </PageShell>
    </div>
  );
}
