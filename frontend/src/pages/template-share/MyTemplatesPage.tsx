import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type {
  PublishTemplateShareInput,
  TemplateShareCategory,
  TemplateShareDifficulty,
  WorkoutCardTemplate,
} from '@machinefit/shared';
import { TEMPLATE_SHARE_CATEGORIES, TEMPLATE_SHARE_DIFFICULTIES } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { workoutCardApi } from '@/api/workout-card.api';
import { templateShareApi } from '@/api/template-share.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useUIStore } from '@/store/ui.store';
import { getApiErrorCode } from '@/utils/motivationAudio';
import '@/styles/components.css';
import '@/styles/template-share.css';

export function MyTemplatesPage() {
  const { t } = useTranslation('community');
  const { t: tc } = useTranslation('common');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const { activeGymId } = useActiveGym();
  const [shareTarget, setShareTarget] = useState<WorkoutCardTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateShareCategory>('general');
  const [difficulty, setDifficulty] = useState<TemplateShareDifficulty>('beginner');
  const [tags, setTags] = useState('');

  const templatesQuery = useQuery({
    queryKey: QUERY_KEYS.workoutCardTemplates(activeGymId ?? ''),
    queryFn: async () => {
      const res = await workoutCardApi.listTemplates({
        gymId: activeGymId ?? undefined,
      });
      return res.data.data ?? [];
    },
  });

  const mine = useMemo(
    () =>
      (templatesQuery.data ?? []).filter(
        (tpl) => tpl.isOriginal !== false && !tpl.sourceTemplateId && !tpl.sourceSharePostId
      ),
    [templatesQuery.data]
  );
  const received = useMemo(
    () =>
      (templatesQuery.data ?? []).filter(
        (tpl) =>
          tpl.isOriginal === false ||
          Boolean(tpl.sourceSharePostId || tpl.sourceTemplateId || tpl.originalTemplateId)
      ),
    [templatesQuery.data]
  );

  const publishMutation = useMutation({
    mutationFn: (body: PublishTemplateShareInput) => templateShareApi.publish(body),
    onSuccess: async (res) => {
      setShareTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['template-shares'] });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutCardTemplates(activeGymId ?? '') });
      showToast(t('templateShare.published'), 'success');
      // navigate-friendly: keep user on page with link
      void res;
    },
    onError: (err) => {
      const code = getApiErrorCode(err);
      if (code === 'SHARE_NOT_ALLOWED') {
        showToast(t('templateShare.shareBlocked'), 'error');
        return;
      }
      showToast(tc('errors.submitFailed'), 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workoutCardApi.deleteTemplate(id),
    onSuccess: async () => {
      setDeleteId(null);
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workoutCardTemplates(activeGymId ?? ''),
      });
      showToast(t('templateShare.templateDeleted'), 'success');
    },
    onError: () => showToast(tc('errors.submitFailed'), 'error'),
  });

  const openShare = (tpl: WorkoutCardTemplate) => {
    setShareTarget(tpl);
    setTitle(tpl.name);
    setDescription('');
    setCategory('general');
    setDifficulty('beginner');
    setTags('');
  };

  const onPublish = (e: FormEvent) => {
    e.preventDefault();
    if (!shareTarget) return;
    publishMutation.mutate({
      templateId: shareTarget.id,
      title: title.trim() || shareTarget.name,
      description: description.trim(),
      category,
      difficulty,
      tags: tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12),
    });
  };

  return (
    <PageShell title={t('templateShare.myTemplates')} subtitle={t('templateShare.myTemplatesSubtitle')}>
      <p style={{ marginBottom: '1rem' }}>
        <Link to={ROUTES.TEMPLATE_SHARE}>{t('templateShare.goHub')}</Link>
      </p>

      {templatesQuery.isLoading ? <Skeleton count={3} height={72} /> : null}
      {templatesQuery.isError ? (
        <QueryErrorMessage onRetry={() => void templatesQuery.refetch()} />
      ) : null}

      {!templatesQuery.isLoading && !templatesQuery.isError ? (
        <>
          <section className="tpl-share-mine__section">
            <h3>{t('templateShare.sectionMine')}</h3>
            {mine.length === 0 ? (
              <p className="empty-state">{t('templateShare.noMine')}</p>
            ) : (
              mine.map((tpl) => {
                const canShare = tpl.canShare === true || (tpl.isOriginal !== false && !tpl.sourceSharePostId && !tpl.sourceTemplateId);
                return (
                  <div key={tpl.id} className="tpl-share-mine__item">
                    <div className="tpl-share-mine__meta">
                      <span className="tpl-share-pill">{t('templateShare.badgeOriginal')}</span>
                      <strong>{tpl.name}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {tpl.items.length} {t('templateShare.exercises')}
                        {tpl.sharePostId ? ` · ${t('templateShare.alreadyShared')}` : ''}
                      </div>
                    </div>
                    <div className="tpl-share-mine__actions">
                      {canShare ? (
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => openShare(tpl)}
                        >
                          {tpl.sharePostId
                            ? t('templateShare.updateShare')
                            : t('templateShare.share')}
                        </button>
                      ) : (
                        <span className="btn btn--ghost btn--sm" style={{ opacity: 0.6 }}>
                          {t('templateShare.cannotShare')}
                        </span>
                      )}
                      {tpl.sharePostId ? (
                        <Link
                          to={ROUTES.TEMPLATE_SHARE_DETAIL.replace(':postId', tpl.sharePostId)}
                          className="btn btn--secondary btn--sm"
                        >
                          {t('templateShare.viewPost')}
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => setDeleteId(tpl.id)}
                      >
                        {tc('actions.delete')}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          <section className="tpl-share-mine__section">
            <h3>{t('templateShare.sectionReceived')}</h3>
            {received.length === 0 ? (
              <p className="empty-state">{t('templateShare.noReceived')}</p>
            ) : (
              received.map((tpl) => (
                <div key={tpl.id} className="tpl-share-mine__item">
                  <div className="tpl-share-mine__meta">
                    <span className="tpl-share-pill tpl-share-pill--received">
                      {t('templateShare.badgeReceived')}
                    </span>
                    <strong>{tpl.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {tpl.originTitle
                        ? t('templateShare.originLine', {
                            title: tpl.originTitle,
                            author: tpl.originAuthorName || '—',
                          })
                        : t('templateShare.originUnknown')}
                    </div>
                  </div>
                  <div className="tpl-share-mine__actions">
                    {tpl.sourceSharePostId ? (
                      <Link
                        to={ROUTES.TEMPLATE_SHARE_DETAIL.replace(
                          ':postId',
                          tpl.sourceSharePostId
                        )}
                        className="btn btn--secondary btn--sm"
                      >
                        {t('templateShare.viewOriginal')}
                      </Link>
                    ) : null}
                    <span className="btn btn--ghost btn--sm" style={{ opacity: 0.6 }}>
                      {t('templateShare.cannotShare')}
                    </span>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setDeleteId(tpl.id)}
                    >
                      {tc('actions.delete')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        </>
      ) : null}

      {shareTarget ? (
        <div className="dialog-overlay" role="presentation" onClick={() => setShareTarget(null)}>
          <div
            className="dialog card"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480, width: '100%', padding: '1rem' }}
          >
            <h3>{t('templateShare.shareDialogTitle')}</h3>
            <form onSubmit={onPublish}>
              <div className="form-field">
                <label htmlFor="share-title">{t('templateShare.fieldTitle')}</label>
                <input
                  id="share-title"
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="share-desc">{t('templateShare.fieldDescription')}</label>
                <textarea
                  id="share-desc"
                  className="input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="share-cat">{t('templateShare.fieldCategory')}</label>
                <select
                  id="share-cat"
                  className="input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TemplateShareCategory)}
                >
                  {TEMPLATE_SHARE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(`templateShare.category.${c}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="share-diff">{t('templateShare.fieldDifficulty')}</label>
                <select
                  id="share-diff"
                  className="input"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as TemplateShareDifficulty)}
                >
                  {TEMPLATE_SHARE_DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {t(`templateShare.difficulty.${d}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="share-tags">{t('templateShare.fieldTags')}</label>
                <input
                  id="share-tags"
                  className="input"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={t('templateShare.tagsPlaceholder')}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={publishMutation.isPending}
                >
                  {t('templateShare.publish')}
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShareTarget(null)}
                >
                  {tc('actions.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title={t('templateShare.deleteTitle')}
        message={t('templateShare.deleteMessage')}
        confirmLabel={tc('actions.delete')}
        confirmVariant="danger"
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate(deleteId);
        }}
      />
    </PageShell>
  );
}
