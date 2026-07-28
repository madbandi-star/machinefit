import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Role, hasMinRole, type OnlinePtQuestionStatus } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Icon } from '@/components/icons/Icon';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { onlinePtApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import '@/styles/online-pt.css';

type QuestionFilter = 'all' | 'active' | 'answered' | 'closed';

const ACTIVE_STATUSES = new Set<OnlinePtQuestionStatus>(['received', 'answering', 'followup']);
const ANSWERED_STATUSES = new Set<OnlinePtQuestionStatus>(['answered']);
const CLOSED_STATUSES = new Set<OnlinePtQuestionStatus>([
  'closed',
  'auto_refunded',
  'reassigned',
]);

function statusChipClass(status: string): string {
  if (status === 'answered' || status === 'closed') return 'opt-chip opt-chip--ok';
  if (status === 'auto_refunded') return 'opt-chip opt-chip--danger';
  if (status === 'answering' || status === 'followup') return 'opt-chip opt-chip--warn';
  return 'opt-chip opt-chip--muted';
}

function matchesFilter(status: OnlinePtQuestionStatus, filter: QuestionFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'active') return ACTIVE_STATUSES.has(status);
  if (filter === 'answered') return ANSWERED_STATUSES.has(status);
  return CLOSED_STATUSES.has(status);
}

function formatQuestionDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale.startsWith('ko') ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OnlinePtQuestionsPage() {
  const { t, i18n } = useTranslation('online-pt');
  const roleCode = useAuthStore((s) => s.user?.roleCode);
  const asTrainer = hasMinRole(roleCode, Role.TRAINER);
  const [filter, setFilter] = useState<QuestionFilter>('all');

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
  const locale = i18n.language;

  const memberItems = memberQuery.data?.items ?? [];
  const filteredMemberItems = useMemo(
    () => memberItems.filter((q) => matchesFilter(q.status, filter)),
    [memberItems, filter]
  );

  const filterCounts = useMemo(
    () => ({
      all: memberItems.length,
      active: memberItems.filter((q) => ACTIVE_STATUSES.has(q.status)).length,
      answered: memberItems.filter((q) => ANSWERED_STATUSES.has(q.status)).length,
      closed: memberItems.filter((q) => CLOSED_STATUSES.has(q.status)).length,
    }),
    [memberItems]
  );

  const filters: QuestionFilter[] = ['all', 'active', 'answered', 'closed'];

  return (
    <div className="opt-page">
      <PageShell>
        <header className="opt-hero">
          <p className="opt-hero-kicker">Online PT</p>
          <h1>{t('myQuestionsTitle')}</h1>
          <p className="opt-hero-lead">{t('myQuestionsLead')}</p>
          <div className="opt-quick-actions">
            <Link to={ROUTES.ONLINE_PT} className="opt-quick-btn opt-quick-btn--primary">
              <Icon name="search" size={16} aria-hidden />
              {t('browseTrainers')}
            </Link>
          </div>
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
                <span className="opt-count">{memberItems.length}</span>
              </div>

              {memberItems.length > 0 ? (
                <div className="opt-filter-tabs" role="tablist" aria-label={t('filterLabel')}>
                  {filters.map((key) => (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={filter === key}
                      className={`opt-filter-tab${filter === key ? ' is-active' : ''}`}
                      onClick={() => setFilter(key)}
                    >
                      {t(`filter.${key}`)}
                      <span className="opt-filter-tab__count">{filterCounts[key]}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {!memberItems.length ? (
                <div className="opt-empty">
                  <div className="opt-empty-mark" aria-hidden>
                    ?
                  </div>
                  <strong>{t('emptyQuestions')}</strong>
                  <p>{t('emptyQuestionsHint')}</p>
                  <Link to={ROUTES.ONLINE_PT} className="opt-btn opt-btn-primary">
                    {t('browseTrainers')}
                  </Link>
                </div>
              ) : !filteredMemberItems.length ? (
                <div className="opt-empty opt-empty--compact">
                  <strong>{t('emptyFilter')}</strong>
                  <p>{t('emptyFilterHint')}</p>
                </div>
              ) : (
                <div className="opt-q-list">
                  {filteredMemberItems.map((q) => (
                    <Link
                      key={q.id}
                      className="opt-q-card"
                      to={ROUTES.ONLINE_PT_QUESTION.replace(':questionId', q.id)}
                    >
                      <span className="opt-q-card__main">
                        <span className="opt-q-card__row">
                          <strong>{q.title}</strong>
                          <span className={statusChipClass(q.status)}>{t(`status.${q.status}`)}</span>
                        </span>
                        <span className="opt-q-card__meta">
                          <span className="opt-q-card__person">{q.trainerName}</span>
                          <span className="opt-meta-sep" aria-hidden>
                            ·
                          </span>
                          <span>{formatQuestionDate(q.createdAt, locale)}</span>
                        </span>
                      </span>
                      <Icon name="chevronRight" size={18} className="opt-q-card__chevron" aria-hidden />
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
                  <div className="opt-empty opt-empty--compact">
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
                        <span className="opt-q-card__main">
                          <span className="opt-q-card__row">
                            <strong>{q.title}</strong>
                            <span className={statusChipClass(q.status)}>{t(`status.${q.status}`)}</span>
                          </span>
                          <span className="opt-q-card__meta">
                            <span className="opt-q-card__person">{q.memberName}</span>
                            <span className="opt-meta-sep" aria-hidden>
                              ·
                            </span>
                            <span>{formatQuestionDate(q.createdAt, locale)}</span>
                          </span>
                        </span>
                        <Icon name="chevronRight" size={18} className="opt-q-card__chevron" aria-hidden />
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
