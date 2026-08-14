import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  ArrowLeft,
  ExternalLink,
  Share2,
  Trash2,
} from 'lucide-react';
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
import { useUIStore } from '@/store/ui.store';
import { getApiErrorCode } from '@/utils/motivationAudio';
import { resolveApiErrorMessage, getApiValidationFieldSummary } from '@/utils/getApiErrorMessage';
import '@/styles/components.css';
import '@/styles/template-share.css';

const TITLE_MAX = 120;

function isTemplateShareApiMissing(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  if (status === 404 || status === 502 || status === 503) return true;
  const body = error.response?.data;
  return typeof body === 'string' && /Cannot (GET|POST)/i.test(body);
}

function parseShareTags(raw: string): string[] {
  return raw
    .split(/[,\s#]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((s) => s.slice(0, 30));
}

function normalizeYoutubeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return /^https?:\/\/(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\//i.test(normalized)
    ? normalized
    : null;
}

export function MyTemplatesPage() {
  const { t } = useTranslation('community');
  const { t: tc } = useTranslation('common');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [shareTarget, setShareTarget] = useState<WorkoutCardTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateShareCategory>('general');
  const [difficulty, setDifficulty] = useState<TemplateShareDifficulty>('beginner');
  const [tags, setTags] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeChannelName, setYoutubeChannelName] = useState('');
  const [instagramId, setInstagramId] = useState('');

  const templatesQuery = useQuery({
    queryKey: QUERY_KEYS.workoutCardTemplates(),
    queryFn: async () => {
      const res = await workoutCardApi.listTemplates();
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
    mutationFn: async (body: PublishTemplateShareInput) => {
      if (shareTarget?.sharePostId) {
        const { templateId: _templateId, ...updateBody } = body;
        return templateShareApi.update(shareTarget.sharePostId, updateBody);
      }
      return templateShareApi.publish(body);
    },
    onSuccess: async () => {
      setShareTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['template-shares'] });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workoutCardTemplates(),
      });
      showToast(t('templateShare.published'), 'success');
    },
    onError: (err) => {
      const code = getApiErrorCode(err);
      if (code === 'SHARE_NOT_ALLOWED') {
        showToast(t('templateShare.shareBlocked'), 'error');
        return;
      }
      if (code === 'EMPTY_TEMPLATE') {
        showToast(t('templateShare.emptyTemplate'), 'error');
        return;
      }
      if (isTemplateShareApiMissing(err)) {
        showToast(t('templateShare.apiUnavailable'), 'error');
        return;
      }
      const validation = getApiValidationFieldSummary(err);
      if (validation) {
        showToast(validation, 'error');
        return;
      }
      showToast(resolveApiErrorMessage(err, tc, 'errors.submitFailed'), 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workoutCardApi.deleteTemplate(id),
    onSuccess: async () => {
      setDeleteId(null);
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workoutCardTemplates(),
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
    setYoutubeUrl('');
    setYoutubeChannelName('');
    setInstagramId('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tpl.sharePostId) {
      void templateShareApi
        .get(tpl.sharePostId)
        .then((res) => {
          const post = res.data.data;
          if (!post) return;
          setTitle(post.title || tpl.name);
          setDescription(post.description ?? '');
          setCategory(post.category);
          setDifficulty(post.difficulty);
          setTags((post.tags ?? []).join(', '));
          setYoutubeUrl(post.youtubeUrl ?? '');
          setYoutubeChannelName(post.youtubeChannelName ?? '');
          setInstagramId(post.instagramId ?? '');
        })
        .catch(() => {
          /* keep blank social fields if post load fails */
        });
    }
  };

  const closeShare = () => {
    if (publishMutation.isPending) return;
    setShareTarget(null);
  };

  const onPublish = (e: FormEvent) => {
    e.preventDefault();
    if (!shareTarget) return;
    const nextTitle = (title.trim() || shareTarget.name).slice(0, TITLE_MAX);
    if (!nextTitle) {
      showToast(t('templateShare.fieldTitle'), 'error');
      return;
    }
    const rawYoutube = youtubeUrl.trim();
    if (rawYoutube && !normalizeYoutubeUrl(rawYoutube)) {
      showToast(t('templateShare.invalidYoutubeUrl'), 'error');
      return;
    }
    publishMutation.mutate({
      templateId: shareTarget.id,
      title: nextTitle,
      description: description.trim(),
      category,
      difficulty,
      tags: parseShareTags(tags),
      youtubeUrl: normalizeYoutubeUrl(rawYoutube),
      youtubeChannelName: youtubeChannelName.trim() || null,
      instagramId: instagramId.trim().replace(/^@+/, '') || null,
    });
  };

  if (shareTarget) {
    const isUpdate = Boolean(shareTarget.sharePostId);
    return (
      <div className="tpl-share-page tpl-share-compose-page">
        <PageShell
          title={
            isUpdate ? t('templateShare.updateShare') : t('templateShare.shareDialogTitle')
          }
          subtitle={t('templateShare.shareDialogHint')}
        >
          <button type="button" className="tpl-share-back tpl-share-back--btn" onClick={closeShare}>
            <ArrowLeft size={16} strokeWidth={2.4} aria-hidden />
            {t('templateShare.backToMyTemplates')}
          </button>

          <aside className="tpl-share-compose__target">
            <p className="tpl-share-compose__target-label">{t('templateShare.sharingTemplate')}</p>
            <p className="tpl-share-compose__target-name">{shareTarget.name}</p>
            <p className="tpl-share-compose__target-meta">
              {t('templateShare.exerciseCount', { count: shareTarget.items.length })}
            </p>
          </aside>

          <form className="tpl-share-compose" onSubmit={onPublish}>
            <section className="tpl-share-compose__section" aria-labelledby="share-basics-title">
              <h3 id="share-basics-title" className="tpl-share-compose__section-title">
                {t('templateShare.shareBasics')}
              </h3>
              <div className="tpl-share-compose__field">
                <label htmlFor="share-title">{t('templateShare.fieldTitle')}</label>
                <input
                  id="share-title"
                  className="input tpl-share-compose__title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                  maxLength={TITLE_MAX}
                  required
                  autoFocus
                />
              </div>
              <div className="tpl-share-compose__field">
                <label htmlFor="share-desc">{t('templateShare.fieldDescription')}</label>
                <textarea
                  id="share-desc"
                  className="input tpl-share-compose__textarea"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('templateShare.descriptionPlaceholder')}
                />
              </div>
              <div className="tpl-share-compose__row">
                <div className="tpl-share-compose__field">
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
                <div className="tpl-share-compose__field">
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
              <div className="tpl-share-compose__field">
                <label htmlFor="share-tags">{t('templateShare.fieldTags')}</label>
                <input
                  id="share-tags"
                  className="input"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={t('templateShare.tagsPlaceholder')}
                />
              </div>
            </section>

            <section className="tpl-share-compose__section" aria-labelledby="share-social-title">
              <h3 id="share-social-title" className="tpl-share-compose__section-title">
                {t('templateShare.shareSocial')}
              </h3>
              <p className="tpl-share-compose__section-hint">{t('templateShare.shareSocialHint')}</p>
              <div className="tpl-share-compose__field">
                <label htmlFor="share-youtube-url">{t('templateShare.fieldYoutubeUrl')}</label>
                <input
                  id="share-youtube-url"
                  className="input"
                  type="url"
                  inputMode="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder={t('templateShare.youtubeUrlPlaceholder')}
                />
              </div>
              <div className="tpl-share-compose__field">
                <label htmlFor="share-youtube-channel">
                  {t('templateShare.fieldYoutubeChannel')}
                </label>
                <input
                  id="share-youtube-channel"
                  className="input"
                  value={youtubeChannelName}
                  onChange={(e) => setYoutubeChannelName(e.target.value)}
                  placeholder={t('templateShare.youtubeChannelPlaceholder')}
                  maxLength={100}
                />
              </div>
              <div className="tpl-share-compose__field">
                <label htmlFor="share-instagram">{t('templateShare.fieldInstagramId')}</label>
                <input
                  id="share-instagram"
                  className="input"
                  value={instagramId}
                  onChange={(e) => setInstagramId(e.target.value)}
                  placeholder={t('templateShare.instagramIdPlaceholder')}
                  maxLength={64}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
            </section>

            <div className="tpl-share-compose__actions">
              <button
                type="submit"
                className="btn btn--primary tpl-share-compose__submit"
                disabled={publishMutation.isPending || !title.trim()}
              >
                {publishMutation.isPending ? '…' : t('templateShare.publish')}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={closeShare}
                disabled={publishMutation.isPending}
              >
                {tc('actions.cancel')}
              </button>
            </div>
          </form>
        </PageShell>
      </div>
    );
  }

  return (
    <PageShell
      title={t('templateShare.myTemplates')}
      subtitle={t('templateShare.myTemplatesSubtitle')}
    >
      <div className="tpl-share-page tpl-share-mine-page">
        <Link to={ROUTES.TEMPLATE_SHARE} className="tpl-share-hub-link">
          {t('templateShare.goHub')}
          <ExternalLink size={14} strokeWidth={2.3} aria-hidden />
        </Link>

        {templatesQuery.isLoading ? <Skeleton count={3} height={88} /> : null}
        {templatesQuery.isError ? (
          <QueryErrorMessage onRetry={() => void templatesQuery.refetch()} />
        ) : null}

        {!templatesQuery.isLoading && !templatesQuery.isError ? (
          <>
            <section className="tpl-mine-section" aria-labelledby="tpl-mine-heading">
              <header className="tpl-mine-section__head">
                <h3 id="tpl-mine-heading" className="tpl-mine-section__title">
                  {t('templateShare.sectionMine')}
                </h3>
                <span className="tpl-mine-section__count">{mine.length}</span>
              </header>

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
                <ul className="tpl-mine-list">
                  {mine.map((tpl) => {
                    const canShare =
                      tpl.canShare === true ||
                      (tpl.isOriginal !== false &&
                        !tpl.sourceSharePostId &&
                        !tpl.sourceTemplateId);
                    const shared = Boolean(tpl.sharePostId);
                    return (
                      <li key={tpl.id} className="tpl-mine-card">
                        <div className="tpl-mine-card__top">
                          <div className="tpl-mine-card__badges">
                            <span className="tpl-share-pill">{t('templateShare.badgeOriginal')}</span>
                            {shared ? (
                              <span className="tpl-share-pill tpl-share-pill--shared">
                                {t('templateShare.alreadyShared')}
                              </span>
                            ) : null}
                          </div>
                          <h4 className="tpl-mine-card__name">{tpl.name}</h4>
                          <p className="tpl-mine-card__meta">
                            {t('templateShare.exerciseCount', { count: tpl.items.length })}
                          </p>
                        </div>

                        <div className="tpl-mine-card__footer">
                          {canShare ? (
                            <button
                              type="button"
                              className="btn btn--primary tpl-mine-card__primary"
                              onClick={() => openShare(tpl)}
                            >
                              <Share2 size={16} strokeWidth={2.3} aria-hidden />
                              {shared
                                ? t('templateShare.updateShare')
                                : t('templateShare.share')}
                            </button>
                          ) : (
                            <span className="tpl-mine-card__locked">
                              {t('templateShare.cannotShare')}
                            </span>
                          )}
                          <div className="tpl-mine-card__links">
                            {tpl.sharePostId ? (
                              <Link
                                to={ROUTES.TEMPLATE_SHARE_DETAIL.replace(
                                  ':postId',
                                  tpl.sharePostId
                                )}
                                className="tpl-mine-card__link"
                              >
                                {t('templateShare.viewPost')}
                              </Link>
                            ) : null}
                            <button
                              type="button"
                              className="tpl-mine-card__link tpl-mine-card__link--danger"
                              onClick={() => setDeleteId(tpl.id)}
                            >
                              <Trash2 size={13} strokeWidth={2.3} aria-hidden />
                              {tc('actions.delete')}
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section
              id="received"
              className="tpl-mine-section"
              aria-labelledby="tpl-received-heading"
            >
              <header className="tpl-mine-section__head">
                <h3 id="tpl-received-heading" className="tpl-mine-section__title">
                  {t('templateShare.sectionReceived')}
                </h3>
                <span className="tpl-mine-section__count">{received.length}</span>
              </header>

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
                <ul className="tpl-mine-list">
                  {received.map((tpl) => (
                    <li key={tpl.id} className="tpl-mine-card">
                      <div className="tpl-mine-card__top">
                        <div className="tpl-mine-card__badges">
                          <span className="tpl-share-pill tpl-share-pill--received">
                            {t('templateShare.badgeReceived')}
                          </span>
                        </div>
                        <h4 className="tpl-mine-card__name">{tpl.name}</h4>
                        <p className="tpl-mine-card__meta">
                          {t('templateShare.exerciseCount', { count: tpl.items.length })}
                          {tpl.originTitle
                            ? ` · ${t('templateShare.originLine', {
                                title: tpl.originTitle,
                                author: tpl.originAuthorName || '—',
                              })}`
                            : ` · ${t('templateShare.originUnknown')}`}
                        </p>
                      </div>

                      <div className="tpl-mine-card__footer">
                        <Link
                          to={ROUTES.RECORDS}
                          className="btn btn--primary tpl-mine-card__primary"
                        >
                          {t('templateShare.useInRecords')}
                        </Link>
                        <div className="tpl-mine-card__links">
                          {tpl.sourceSharePostId ? (
                            <Link
                              to={ROUTES.TEMPLATE_SHARE_DETAIL.replace(
                                ':postId',
                                tpl.sourceSharePostId
                              )}
                              className="tpl-mine-card__link"
                            >
                              {t('templateShare.viewOriginal')}
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            className="tpl-mine-card__link tpl-mine-card__link--danger"
                            onClick={() => setDeleteId(tpl.id)}
                          >
                            <Trash2 size={13} strokeWidth={2.3} aria-hidden />
                            {tc('actions.delete')}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>

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
