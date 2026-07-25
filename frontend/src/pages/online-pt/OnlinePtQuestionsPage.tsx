import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Role, hasMinRole } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { onlinePtApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import '@/styles/online-pt.css';

function statusChipClass(status: string): string {
  if (status === 'answered' || status === 'closed') return 'opt-chip opt-chip--ok';
  if (status === 'auto_refunded') return 'opt-chip opt-chip--danger';
  if (status === 'answering' || status === 'followup') return 'opt-chip opt-chip--warn';
  return 'opt-chip opt-chip--muted';
}

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
    <div className="opt-shell">
      <PageShell>
        <header className="opt-hero">
          <p className="opt-hero-kicker">Online PT</p>
          <h1>{t('myQuestionsTitle')}</h1>
          <p className="opt-hero-lead">{t('myQuestionsLead')}</p>
        </header>

        {loading ? (
          <Skeleton count={3} />
        ) : (
          <>
            <section className="opt-panel">
              <div className="opt-panel-head">
                <div>
                  <h2>{t('myQuestions')}</h2>
                  <p className="opt-panel-desc">{t('myQuestionsSectionLead')}</p>
                </div>
                <span className="opt-count">{memberQuery.data?.items.length ?? 0}</span>
              </div>

              {!memberQuery.data?.items.length ? (
                <div className="opt-empty">
                  <div className="opt-empty-mark" aria-hidden>
                    ?
                  </div>
                  <strong>{t('emptyQuestions')}</strong>
                  <p>{t('emptyQuestionsHint')}</p>
                </div>
              ) : (
                <div className="opt-q-list">
                  {memberQuery.data.items.map((q) => (
                    <Link
                      key={q.id}
                      className="opt-q-card"
                      to={ROUTES.ONLINE_PT_QUESTION.replace(':questionId', q.id)}
                    >
                      <div className="opt-q-card__row">
                        <strong>{q.title}</strong>
                        <span className={statusChipClass(q.status)}>{t(`status.${q.status}`)}</span>
                      </div>
                      <p className="opt-q-card__meta">
                        {q.trainerName} · {new Date(q.createdAt).toLocaleString()}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {asTrainer ? (
              <section className="opt-panel">
                <div className="opt-panel-head">
                  <div>
                    <h2>{t('trainerInbox')}</h2>
                    <p className="opt-panel-desc">{t('trainerInboxLead')}</p>
                  </div>
                  <span className="opt-count">{trainerQuery.data?.items.length ?? 0}</span>
                </div>

                {!trainerQuery.data?.items.length ? (
                  <div className="opt-empty">
                    <div className="opt-empty-mark" aria-hidden>
                      ·
                    </div>
                    <strong>{t('emptyQuestions')}</strong>
                    <p>{t('emptyTrainerInboxHint')}</p>
                  </div>
                ) : (
                  <div className="opt-q-list">
                    {trainerQuery.data.items.map((q) => (
                      <Link
                        key={q.id}
                        className="opt-q-card"
                        to={ROUTES.ONLINE_PT_QUESTION.replace(':questionId', q.id)}
                      >
                        <div className="opt-q-card__row">
                          <strong>{q.title}</strong>
                          <span className={statusChipClass(q.status)}>{t(`status.${q.status}`)}</span>
                        </div>
                        <p className="opt-q-card__meta">
                          {q.memberName} · {new Date(q.createdAt).toLocaleString()}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            ) : null}
          </>
        )}
      </PageShell>
    </div>
  );
}
