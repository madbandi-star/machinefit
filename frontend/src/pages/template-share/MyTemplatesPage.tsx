import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import type {
  PublishTemplateShareInput,
  TemplateShareCategory,
  TemplateShareDifficulty,
  WorkoutCardTemplate,
} from '@machinefit/shared';
import { isAllGymsId, TEMPLATE_SHARE_CATEGORIES, TEMPLATE_SHARE_DIFFICULTIES } from '@machinefit/shared';
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

function isTemplateShareApiMissing(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  if (status === 404 || status === 502 || status === 503) return true;
  const body = error.response?.data;
  return typeof body === 'string' && /Cannot (GET|POST)/i.test(body);
}

export function MyTemplatesPage() {
  const { t } = useTranslation('community');
  const { t: tc } = useTranslation('common');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const { activeGymId } = useActiveGym();
  const templatesGymId =
    activeGymId && !isAllGymsId(activeGymId) ? activeGymId : undefined;
  const [shareTarget, setShareTarget] = useState<WorkoutCardTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateShareCategory>('general');
  const [difficulty, setDifficulty] = useState<TemplateShareDifficulty>('beginner');
  const [tags, setTags] = useState('');

  const templatesQuery = useQuery({
    queryKey: QUERY_KEYS.workoutCardTemplates(templatesGymId ?? ''),
    queryFn: async () => {
      const res = await workoutCardApi.listTemplates({
        gymId: templatesGymId,
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
    onSuccess: async () => {
      setShareTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['template-shares'] });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workoutCardTemplates(templatesGymId ?? ''),
      });
      showToast(t('templateShare.published'), 'success');
    },
    onError: (err) => {
      const code = getApiErrorCode(err);
      if (code === 'SHARE_NOT_ALLOWED') {
        showToast(t('templateShare.shareBlocked'), 'error');
        return;
      }
      if (isTemplateShareApiMissing(err)) {
        showToast(t('templateShare.apiUnavailable'), 'error');
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
        queryKey: QUERY_KEYS.workoutCardTemplates(templatesGymId ?? ''),
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
    <PageShell
      title={t('templateShare.myTemplates')}
      subtitle={t('templateShare.myTemplatesSubtitle')}
    >
      <div className="tpl-share-page">
        <Link to={ROUTES.TEMPLATE_SHARE} className="tpl-share-back">
          {t('templateShare.goHub')}
        </Link>

        {templatesQuery.isLoading ? <Skeleton count={3} height={72} /> : null}
        {templatesQuery.isError ? (
          <QueryErrorMessage onRetry={() => void templatesQuery.refetch()} />
        ) : null}

        {!templatesQuery.isLoading && !templatesQuery.isError ? (
          <>
            <section className="tpl-share-mine__section">
              <h3 className="tpl-share-mine__heading">
                <span>{t('templateShare.sectionMine')}</span>
                <span className="tpl-share-mine__heading-count">{mine.length}</span>
              </h3>
              {mine.length === 0 ? (
                <div className="tpl-share-empty-box">
                  <p className="tpl-share-empty-box__text">{t('templateShare.noMine')}</p>
                  <div className="tpl-share-empty-box__actions">
                    <Link to={ROUTES.RECORDS} className="btn btn--primary btn--sm">
                      {t('templateShare.goRecords')}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="tpl-share-mine__list">
                  {mine.map((tpl) => {
                    const canShare =
                      tpl.canShare === true ||
                      (tpl.isOriginal !== false &&
                        !tpl.sourceSharePostId &&
                        !tpl.sourceTemplateId);
                    return (
                      <div key={tpl.id} className="tpl-share-mine__item">
                        <div className="tpl-share-mine__meta">
                          <span className="tpl-share-pill">
                            {t('templateShare.badgeOriginal')}
                          </span>
                          <span className="tpl-share-mine__name">{tpl.name}</span>
                          <span className="tpl-share-mine__sub">
                            {t('templateShare.exerciseCount', { count: tpl.items.length })}
                            {tpl.sharePostId ? ` · ${t('templateShare.alreadyShared')}` : ''}
                          </span>
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
                            <span className="btn btn--ghost btn--sm tpl-share-mine__disabled">
                              {t('templateShare.cannotShare')}
                            </span>
                          )}
                          <div className="tpl-share-mine__actions-row">
                            {tpl.sharePostId ? (
                              <Link
                                to={ROUTES.TEMPLATE_SHARE_DETAIL.replace(
                                  ':postId',
                                  tpl.sharePostId
                                )}
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
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="tpl-share-mine__section">
              <h3 className="tpl-share-mine__heading">
                <span>{t('templateShare.sectionReceived')}</span>
                <span className="tpl-share-mine__heading-count">{received.length}</span>
              </h3>
              {received.length === 0 ? (
                <div className="tpl-share-empty-box">
                  <p className="tpl-share-empty-box__text">{t('templateShare.noReceived')}</p>
                  <div className="tpl-share-empty-box__actions">
                    <Link to={ROUTES.TEMPLATE_SHARE} className="btn btn--primary btn--sm">
                      {t('templateShare.browseHub')}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="tpl-share-mine__list">
                  {received.map((tpl) => (
                    <div key={tpl.id} className="tpl-share-mine__item">
                      <div className="tpl-share-mine__meta">
                        <span className="tpl-share-pill tpl-share-pill--received">
                          {t('templateShare.badgeReceived')}
                        </span>
                        <span className="tpl-share-mine__name">{tpl.name}</span>
                        <span className="tpl-share-mine__sub">
                          {tpl.originTitle
                            ? t('templateShare.originLine', {
                                title: tpl.originTitle,
                                author: tpl.originAuthorName || '—',
                              })
                            : t('templateShare.originUnknown')}
                        </span>
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
                        <div className="tpl-share-mine__actions-row">
                          <span className="btn btn--ghost btn--sm tpl-share-mine__disabled">
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
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>

      {shareTarget ? (
        <div className="dialog-overlay" role="presentation" onClick={() => setShareTarget(null)}>
          <div
            className="dialog card tpl-share-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tpl-share-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="tpl-share-dialog-title" className="tpl-share-dialog__title">
              {t('templateShare.shareDialogTitle')}
            </h3>
            <p className="tpl-share-dialog__hint">{t('templateShare.shareDialogHint')}</p>
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
              <div className="tpl-share-dialog__row">
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
              <div className="tpl-share-dialog__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShareTarget(null)}
                >
                  {tc('actions.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={publishMutation.isPending}
                >
                  {t('templateShare.publish')}
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
