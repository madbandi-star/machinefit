import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { QaFeedbackValue } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { qaApi } from '@/api/qa.api';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import '@/styles/qa.css';

export function QaDetailPage() {
  const { t } = useTranslation();
  const { qaId = '' } = useParams();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const detailQuery = useQuery({
    queryKey: ['qa', 'detail', qaId],
    enabled: Boolean(qaId),
    queryFn: async () => (await qaApi.get(qaId)).data.data,
  });

  const feedbackMutation = useMutation({
    mutationFn: (value: QaFeedbackValue) => qaApi.feedback(qaId, value),
    onSuccess: async (res) => {
      queryClient.setQueryData(['qa', 'detail', qaId], res.data.data);
      showToast(t('qa.feedbackThanks'), 'success');
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  const article = detailQuery.data;

  return (
    <PageShell>
      <div className="qa-detail">
        <Link className="qa-detail__back" to={ROUTES.QA}>
          <ChevronLeft size={16} aria-hidden />
          {t('qa.backToList')}
        </Link>

        {detailQuery.isLoading ? <Skeleton count={4} height={80} /> : null}
        {detailQuery.isError ? <QueryErrorMessage /> : null}

        {article ? (
          <>
            <div className="qa-item__meta">
              <span className="qa-badge">{t(`qa.categories.${article.category}`)}</span>
              {article.priority === 0 ? (
                <span className="qa-badge qa-badge--hot">P0</span>
              ) : null}
            </div>
            <h1 className="qa-detail__title">Q. {article.title}</h1>
            <div className="qa-detail__answer">{article.answer}</div>

            <section className="qa-feedback" aria-label={t('qa.feedbackTitle')}>
              <p className="qa-feedback__q">{t('qa.feedbackTitle')}</p>
              {!isAuthenticated ? (
                <p className="qa-feedback__hint">{t('qa.feedbackLogin')}</p>
              ) : (
                <div className="qa-feedback__actions">
                  <button
                    type="button"
                    aria-pressed={article.myFeedback === 'helpful'}
                    disabled={feedbackMutation.isPending}
                    onClick={() => feedbackMutation.mutate('helpful')}
                  >
                    <ThumbsUp size={16} aria-hidden />
                    {t('qa.helpful')}
                  </button>
                  <button
                    type="button"
                    aria-pressed={article.myFeedback === 'not_helpful'}
                    disabled={feedbackMutation.isPending}
                    onClick={() => feedbackMutation.mutate('not_helpful')}
                  >
                    <ThumbsDown size={16} aria-hidden />
                    {t('qa.notHelpful')}
                  </button>
                </div>
              )}
            </section>

            <div className="qa-footer-links">
              <Link to={ROUTES.SUPPORT}>{t('qa.askSupport')}</Link>
              <Link to={ROUTES.PRIVACY_RIGHTS}>{t('qa.privacyRights')}</Link>
            </div>
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
