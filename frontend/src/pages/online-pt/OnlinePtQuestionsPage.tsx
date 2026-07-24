import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Role, hasMinRole } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState';
import { onlinePtApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import '@/styles/online-pt.css';

export function OnlinePtQuestionsPage() {
  const { t } = useTranslation('online-pt');
  const roleCode = useAuthStore((s) => s.user?.roleCode);
  const asTrainer = hasMinRole(roleCode, Role.TRAINER);

  const memberQuery = useQuery({
    queryKey: QUERY_KEYS.onlinePtQuestions({ role: 'member' }),
    queryFn: async () =>
      (await onlinePtApi.listQuestions({ role: 'member', limit: 50 })).data.data,
  });

  const trainerQuery = useQuery({
    queryKey: QUERY_KEYS.onlinePtQuestions({ role: 'trainer' }),
    queryFn: async () =>
      (await onlinePtApi.listQuestions({ role: 'trainer', limit: 50 })).data.data,
    enabled: asTrainer,
  });

  const loading = memberQuery.isLoading || (asTrainer && trainerQuery.isLoading);

  return (
    <PageShell title={t('myQuestions')} subtitle={t('title')}>
      {loading ? (
        <Skeleton count={3} />
      ) : (
        <>
          <h3>{t('myQuestions')}</h3>
          {!memberQuery.data?.items.length ? (
            <EmptyState title={t('emptyQuestions')} />
          ) : (
            <div className="opt-trainer-list">
              {memberQuery.data.items.map((q) => (
                <Link
                  key={q.id}
                  className="opt-trainer"
                  to={ROUTES.ONLINE_PT_QUESTION.replace(':questionId', q.id)}
                >
                  <div className="opt-trainer__row">
                    <strong>{q.title}</strong>
                    <span>{t(`status.${q.status}`)}</span>
                  </div>
                  <p className="opt-meta">
                    {q.trainerName} · {new Date(q.createdAt).toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {asTrainer ? (
            <>
              <h3 style={{ marginTop: '1.5rem' }}>{t('trainerInbox')}</h3>
              {!trainerQuery.data?.items.length ? (
                <EmptyState title={t('emptyQuestions')} />
              ) : (
                <div className="opt-trainer-list">
                  {trainerQuery.data.items.map((q) => (
                    <Link
                      key={q.id}
                      className="opt-trainer"
                      to={ROUTES.ONLINE_PT_QUESTION.replace(':questionId', q.id)}
                    >
                      <div className="opt-trainer__row">
                        <strong>{q.title}</strong>
                        <span>{t(`status.${q.status}`)}</span>
                      </div>
                      <p className="opt-meta">
                        {q.memberName} · {new Date(q.createdAt).toLocaleString()}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </>
      )}
    </PageShell>
  );
}
