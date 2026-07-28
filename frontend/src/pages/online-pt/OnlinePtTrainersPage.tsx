import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ONLINE_PT_TRAINER_SORTS, type OnlinePtTrainerSort } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Icon } from '@/components/icons/Icon';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { onlinePtApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import '@/styles/online-pt.css';

function trainerInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : '?';
}

export function OnlinePtTrainersPage() {
  const { t } = useTranslation('online-pt');
  const [sort, setSort] = useState<OnlinePtTrainerSort>('popular');

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.onlinePtTrainers({ sort, acceptingOnly: true }),
    queryFn: async () =>
      (await onlinePtApi.listTrainers({ sort, acceptingOnly: true, limit: 30 })).data.data,
  });

  return (
    <div className="opt-page">
      <PageShell>
        <header className="opt-hero">
          <p className="opt-hero-kicker">Online PT</p>
          <h1>{t('title')}</h1>
          <p className="opt-hero-lead">{t('subtitle')}</p>
          <div className="opt-quick-actions">
            <Link to={ROUTES.ONLINE_PT_QUESTIONS} className="opt-quick-btn">
              <Icon name="history" size={16} aria-hidden />
              {t('myQuestions')}
            </Link>
          </div>
        </header>

        <section className="opt-panel">
          <div className="opt-panel-head">
            <div>
              <h2>{t('trainers')}</h2>
              <p className="opt-panel-desc">{t('trainersSectionLead')}</p>
            </div>
            <span className="opt-count">{data?.items.length ?? 0}</span>
          </div>

          <div className="opt-sort opt-sort--segment" role="tablist" aria-label={t('trainers')}>
            {ONLINE_PT_TRAINER_SORTS.map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={sort === s}
                className={`opt-sort__btn${sort === s ? ' is-active' : ''}`}
                onClick={() => setSort(s)}
              >
                {t(`sort.${s}`)}
              </button>
            ))}
          </div>

          {isLoading ? (
            <Skeleton count={4} />
          ) : !data?.items.length ? (
            <div className="opt-empty">
              <div className="opt-empty-mark" aria-hidden>
                ·
              </div>
              <strong>{t('noTrainers')}</strong>
              <p>{t('noTrainersHint')}</p>
            </div>
          ) : (
            <div className="opt-trainer-list">
              {data.items.map((tr) => (
                <Link
                  key={tr.userId}
                  className="opt-trainer"
                  to={ROUTES.ONLINE_PT_TRAINER.replace(':trainerId', tr.userId)}
                >
                  <span className="opt-trainer__avatar" aria-hidden>
                    {trainerInitial(tr.displayName)}
                  </span>
                  <span className="opt-trainer__body">
                    <span className="opt-trainer__row">
                      <strong>{tr.displayName}</strong>
                      <span className="opt-trainer__price">
                        {t('price', { price: tr.ticketPrice.toLocaleString() })}
                      </span>
                    </span>
                    <span className="opt-trainer__meta-row">
                      <span
                        className={`opt-status-dot${
                          tr.acceptingQuestions ? ' opt-status-dot--live' : ''
                        }`}
                        aria-hidden
                      />
                      <span className="opt-meta">
                        {tr.acceptingQuestions ? t('accepting') : t('offline')}
                      </span>
                      <span className="opt-meta-sep" aria-hidden>
                        ·
                      </span>
                      <span className="opt-meta">
                        {t('rating', { avg: tr.ratingAvg.toFixed(1), count: tr.reviewCount })}
                      </span>
                      <span className="opt-meta-sep" aria-hidden>
                        ·
                      </span>
                      <span className="opt-meta">{t('answers', { count: tr.answerCount })}</span>
                    </span>
                    {tr.specialties.length ? (
                      <span className="opt-trainer__tags">
                        {tr.specialties.slice(0, 3).map((tag) => (
                          <span key={tag} className="opt-tag">
                            {tag}
                          </span>
                        ))}
                      </span>
                    ) : null}
                    {tr.intro ? (
                      <span className="opt-trainer__intro">{tr.intro.slice(0, 100)}</span>
                    ) : null}
                  </span>
                  <Icon name="chevronRight" size={18} className="opt-trainer__chevron" aria-hidden />
                </Link>
              ))}
            </div>
          )}
        </section>
      </PageShell>
    </div>
  );
}
