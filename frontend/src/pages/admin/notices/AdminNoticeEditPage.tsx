import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  NOTICE_CATEGORIES,
  NOTICE_LANGUAGES,
  NOTICE_STATUSES,
  type NoticeCategory,
  type NoticeLanguage,
  type NoticeStatus,
} from '@machinefit/shared';
import { noticeApi } from '@/api/notice.api';
import { RichTextEditor } from '@/components/notices/RichTextEditor/RichTextEditor';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/notices.css';

type DraftTranslation = Record<NoticeLanguage, { title: string; content: string }>;

const emptyTranslations = (): DraftTranslation => ({
  ko: { title: '', content: '' },
  en: { title: '', content: '' },
  ja: { title: '', content: '' },
  zh: { title: '', content: '' },
});

export function AdminNoticeEditPage() {
  const { noticeId } = useParams();
  const isNew = !noticeId || noticeId === 'new';
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const [lang, setLang] = useState<NoticeLanguage>('ko');
  const [category, setCategory] = useState<NoticeCategory>('notice');
  const [status, setStatus] = useState<NoticeStatus>('DRAFT');
  const [isPinned, setIsPinned] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [isBanner, setIsBanner] = useState(false);
  const [isPopup, setIsPopup] = useState(false);
  const [publishAt, setPublishAt] = useState('');
  const [translations, setTranslations] = useState<DraftTranslation>(emptyTranslations);

  const detailQuery = useQuery({
    queryKey: ['admin', 'notices', 'detail', noticeId],
    queryFn: async () => {
      const res = await noticeApi.get(noticeId!, { admin: true, language: 'ko' });
      return res.data.data;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    const detail = detailQuery.data;
    if (!detail) return;
    setCategory(detail.category);
    setStatus(detail.status);
    setIsPinned(detail.isPinned);
    setIsImportant(detail.isImportant);
    setIsBanner(detail.isBanner);
    setIsPopup(detail.isPopup);
    setPublishAt(detail.publishAt ? detail.publishAt.slice(0, 16) : '');
    const next = emptyTranslations();
    for (const tr of detail.translations ?? []) {
      next[tr.language] = { title: tr.title, content: tr.content };
    }
    if (!detail.translations?.length) {
      next.ko = { title: detail.title, content: detail.content };
    }
    setTranslations(next);
  }, [detailQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payloadTranslations = NOTICE_LANGUAGES.filter(
        (code) => translations[code].title.trim()
      ).map((code) => ({
        language: code,
        title: translations[code].title.trim(),
        content: translations[code].content,
      }));
      if (!payloadTranslations.length) {
        throw new Error('title required');
      }
      const body = {
        category,
        status,
        isPinned,
        isImportant,
        isBanner,
        isPopup,
        publishAt: publishAt ? new Date(publishAt).toISOString() : null,
        translations: payloadTranslations,
      };
      if (isNew) {
        const res = await noticeApi.create(body);
        return res.data.data;
      }
      const res = await noticeApi.update(noticeId!, body);
      return res.data.data;
    },
    onSuccess: async (detail) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
      await queryClient.invalidateQueries({ queryKey: ['notices'] });
      showToast(t('admin:notices.saved'), 'success');
      if (isNew) {
        navigate(ROUTES.ADMIN_NOTICE_EDIT.replace(':noticeId', detail.id), { replace: true });
      }
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, inline }: { file: File; inline: boolean }) => {
      if (isNew) throw new Error('save first');
      const res = await noticeApi.uploadAttachment(noticeId!, file, inline);
      return res.data.data;
    },
    onSuccess: async (attachment, vars) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'notices', 'detail', noticeId] });
      if (vars.inline && attachment.publicUrl) {
        setTranslations((prev) => ({
          ...prev,
          [lang]: {
            ...prev[lang],
            content: `${prev[lang].content}<p><img src="${attachment.publicUrl}" alt="" /></p>`,
          },
        }));
      }
      showToast(t('admin:notices.uploaded'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const attachments = useMemo(() => detailQuery.data?.attachments ?? [], [detailQuery.data]);

  if (!isNew && detailQuery.isLoading) return <Skeleton count={4} height={64} />;
  if (!isNew && detailQuery.isError) return <QueryErrorMessage />;

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div className="admin-page__heading">
          <h1 className="admin-page__title">
            {isNew ? t('admin:notices.create') : t('admin:notices.edit')}
          </h1>
          <p className="admin-page__subtitle">{t('admin:notices.editSubtitle')}</p>
        </div>
        <div className="admin-page__actions">
          <Link to={ROUTES.ADMIN_NOTICES} className="btn btn--secondary">
            {t('common:actions.back')}
          </Link>
        </div>
      </header>

      <div className="admin-page__body">
        <div className="admin-panel admin-notice-edit">
          <div className="admin-form-grid">
            <label className="admin-form-card">
              {t('admin:notices.category')}
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value as NoticeCategory)}
              >
                {NOTICE_CATEGORIES.map((code) => (
                  <option key={code} value={code}>
                    {t(`admin:notices.categories.${code}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-form-card">
              {t('admin:notices.status')}
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value as NoticeStatus)}
              >
                {NOTICE_STATUSES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-form-card">
              {t('admin:notices.publishAt')}
              <input
                className="input"
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
              />
            </label>

            <div className="admin-form-card admin-form-card--full">
              <div className="admin-notice-flags">
                <label>
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                  />
                  {t('admin:notices.pin')}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={isImportant}
                    onChange={(e) => setIsImportant(e.target.checked)}
                  />
                  {t('admin:notices.important')}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={isBanner}
                    onChange={(e) => setIsBanner(e.target.checked)}
                  />
                  {t('admin:notices.banner')}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={isPopup}
                    onChange={(e) => setIsPopup(e.target.checked)}
                  />
                  {t('admin:notices.popup')}
                </label>
              </div>
            </div>
          </div>

          <div className="admin-notice-lang-tabs admin-tabs admin-tabs--wide">
            {NOTICE_LANGUAGES.map((code) => (
              <button
                key={code}
                type="button"
                className={`admin-tabs__btn${lang === code ? ' is-active' : ''}`}
                onClick={() => setLang(code)}
              >
                {code.toUpperCase()}
                {translations[code].title ? ' ✓' : ''}
              </button>
            ))}
          </div>

          <label className="admin-form-card admin-form-card--full">
            {t('admin:notices.fieldTitle')} ({lang})
            <input
              className="input"
              value={translations[lang].title}
              onChange={(e) =>
                setTranslations((prev) => ({
                  ...prev,
                  [lang]: { ...prev[lang], title: e.target.value },
                }))
              }
            />
          </label>

          <div className="admin-form-card admin-form-card--full">
            <p className="admin-form-card__label">
              {t('admin:notices.fieldContent')} ({lang})
            </p>
            <RichTextEditor
              value={translations[lang].content}
              onChange={(html) =>
                setTranslations((prev) => ({
                  ...prev,
                  [lang]: { ...prev[lang], content: html },
                }))
              }
              onImageSelect={
                isNew
                  ? undefined
                  : async (file) => {
                      await uploadMutation.mutateAsync({ file, inline: true });
                    }
              }
              placeholder={t('admin:notices.contentPlaceholder')}
            />
          </div>

          {!isNew ? (
            <div className="admin-form-card admin-form-card--full">
              <p className="admin-form-card__label">{t('admin:notices.attachments')}</p>
              <input
                type="file"
                accept="image/*,.pdf,.zip,application/pdf,application/zip"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) uploadMutation.mutate({ file, inline: false });
                }}
              />
              <ul className="admin-notice-attachments">
                {attachments.map((file) => (
                  <li key={file.id}>
                    <span>
                      {file.fileName} ({Math.round(file.fileSizeBytes / 1024)}KB)
                    </span>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={async () => {
                        await noticeApi.deleteAttachment(noticeId!, file.id);
                        await queryClient.invalidateQueries({
                          queryKey: ['admin', 'notices', 'detail', noticeId],
                        });
                      }}
                    >
                      {t('common:actions.delete')}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="admin-panel__desc">{t('admin:notices.saveBeforeAttach')}</p>
          )}

          <div className="admin-page__actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {t('common:actions.save')}
            </button>
            {!isNew ? (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() =>
                  noticeApi.publish(noticeId!, { status: 'PUBLISHED' }).then(async () => {
                    await queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
                    showToast(t('admin:notices.published'), 'success');
                    setStatus('PUBLISHED');
                  })
                }
              >
                {t('admin:notices.publishNow')}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
