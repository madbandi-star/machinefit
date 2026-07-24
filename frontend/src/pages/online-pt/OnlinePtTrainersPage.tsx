import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ONLINE_PT_TRAINER_SORTS, type OnlinePtTrainerSort } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState';
import { onlinePtApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import '@/styles/online-pt.css';

export function OnlinePtTrainersPage() {
  const { t } = useTranslation('online-pt');
  const [sort, setSort] = useState<OnlinePtTrainerSort>('popular');

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.onlinePtTrainers({ sort, acceptingOnly: true }),
    queryFn: async () =>
      (await onlinePtApi.listTrainers({ sort, acceptingOnly: true, limit: 30 })).data.data,
  });

  return (
    <PageShell title={t('title')} subtitle={t('subtitle')}>
      <div className="opt-sort">
        {ONLINE_PT_TRAINER_SORTS.map((s) => (
          <button
            key={s}
            type="button"
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
        <EmptyState title={t('noTrainers')} />
      ) : (
        <div className="opt-trainer-list">
          {data.items.map((tr) => (
            <Link
              key={tr.userId}
              className="opt-trainer"
              to={ROUTES.ONLINE_PT_TRAINER.replace(':trainerId', tr.userId)}
            >
              <div className="opt-trainer__row">
                <strong>{tr.displayName}</strong>
                <span>{t('price', { price: tr.ticketPrice.toLocaleString() })}</span>
              </div>
              <p className="opt-meta">
                {tr.acceptingQuestions ? t('accepting') : t('offline')} ·{' '}
                {t('rating', { avg: tr.ratingAvg.toFixed(1), count: tr.reviewCount })} ·{' '}
                {t('answers', { count: tr.answerCount })}
              </p>
              {tr.specialties.length ? (
                <p className="opt-meta">{tr.specialties.join(' · ')}</p>
              ) : null}
              {tr.intro ? <p style={{ margin: '0.35rem 0 0' }}>{tr.intro.slice(0, 120)}</p> : null}
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
