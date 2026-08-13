import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { QA_CATEGORIES, type QaCategory, type QaPriority } from '@machinefit/shared';
import { adminQaApi } from '@/api/qa.api';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';

export function AdminQaEditPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { qaId } = useParams();
  const isNew = !qaId || qaId === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const [category, setCategory] = useState<QaCategory>('getting_started');
  const [priority, setPriority] = useState<QaPriority>(2);
  const [title, setTitle] = useState('');
  const [answer, setAnswer] = useState('');
  const [keywords, setKeywords] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(true);
  const [needsImplReview, setNeedsImplReview] = useState(false);
  const [slug, setSlug] = useState('');

  const detailQuery = useQuery({
    queryKey: ['admin', 'qa', 'detail', qaId],
    enabled: !isNew && Boolean(qaId),
    queryFn: async () => (await adminQaApi.get(qaId!)).data.data,
  });

  useEffect(() => {
    const data = detailQuery.data;
    if (!data) return;
    setCategory(data.category);
    setPriority(data.priority);
    setTitle(data.title);
    setAnswer(data.answer);
    setKeywords(data.keywords.join(', '));
    setDisplayOrder(data.displayOrder);
    setIsPublished(data.isPublished);
    setNeedsImplReview(data.needsImplReview);
    setSlug(data.slug ?? '');
  }, [detailQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        category,
        priority,
        title: title.trim(),
        answer: answer.trim(),
        keywords: keywords
          .split(/[,，]/)
          .map((k) => k.trim())
          .filter(Boolean),
        displayOrder,
        isPublished,
        needsImplReview,
        slug: slug.trim() || null,
      };
      if (isNew) return adminQaApi.create(body);
      return adminQaApi.update(qaId!, body);
    },
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'qa'] });
      showToast(t('admin:qa.saved'), 'success');
      navigate(ROUTES.ADMIN_QA_EDIT.replace(':qaId', res.data.data.id));
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2 || answer.trim().length < 10) return;
    saveMutation.mutate();
  };

  if (!isNew && detailQuery.isLoading) {
    return (
      <div className="admin-page">
        <Skeleton count={6} height={48} />
      </div>
    );
  }

  if (!isNew && detailQuery.isError) {
    return (
      <div className="admin-page">
        <QueryErrorMessage />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div className="admin-page__heading">
          <h1 className="admin-page__title">
            {isNew ? t('admin:qa.create') : t('admin:qa.edit')}
          </h1>
          <p className="admin-page__subtitle">{t('admin:qa.editSubtitle')}</p>
        </div>
        <div className="admin-page__actions">
          <Link to={ROUTES.ADMIN_QA} className="btn btn--ghost">
            {t('admin:qa.back')}
          </Link>
        </div>
      </header>

      <form className="admin-page__body" onSubmit={onSubmit}>
        <label className="field">
          <span>{t('admin:qa.fieldCategory')}</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as QaCategory)}
          >
            {QA_CATEGORIES.map((code) => (
              <option key={code} value={code}>
                {t(`common:qa.categories.${code}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>{t('admin:qa.fieldPriority')}</span>
          <select
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value) as QaPriority)}
          >
            <option value={0}>P0</option>
            <option value={1}>P1</option>
            <option value={2}>P2</option>
            <option value={3}>P3</option>
          </select>
        </label>

        <label className="field">
          <span>{t('admin:qa.fieldTitle')}</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <label className="field">
          <span>{t('admin:qa.fieldAnswer')}</span>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={12}
            required
          />
        </label>

        <label className="field">
          <span>{t('admin:qa.fieldKeywords')}</span>
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder={t('admin:qa.keywordsPlaceholder')}
          />
        </label>

        <label className="field">
          <span>{t('admin:qa.fieldOrder')}</span>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
          />
        </label>

        <label className="field">
          <span>{t('admin:qa.fieldSlug')}</span>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </label>

        <label className="field field--inline">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          <span>{t('admin:qa.published')}</span>
        </label>

        <label className="field field--inline">
          <input
            type="checkbox"
            checked={needsImplReview}
            onChange={(e) => setNeedsImplReview(e.target.checked)}
          />
          <span>{t('admin:qa.needsReview')}</span>
        </label>

        <div className="admin-page__actions">
          <button type="submit" className="btn btn--primary" disabled={saveMutation.isPending}>
            {t('admin:qa.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
