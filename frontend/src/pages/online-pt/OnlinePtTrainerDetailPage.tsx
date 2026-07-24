import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { onlinePtApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { useAuthStore } from '@/store/auth.store';
import '@/styles/online-pt.css';

export function OnlinePtTrainerDetailPage() {
  const { trainerId = '' } = useParams();
  const { t } = useTranslation('online-pt');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const [qty, setQty] = useState(1);

  const { data: trainer, isLoading } = useQuery({
    queryKey: QUERY_KEYS.onlinePtTrainer(trainerId),
    queryFn: async () => (await onlinePtApi.getTrainer(trainerId)).data.data,
    enabled: Boolean(trainerId),
  });

  const buyMutation = useMutation({
    mutationFn: () => onlinePtApi.purchase({ trainerId, quantity: qty }),
    onSuccess: () => {
      showToast(t('buyDone'), 'success');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onlinePtTickets });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onlinePtTrainer(trainerId) });
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('error')), 'error'),
  });

  if (isLoading || !trainer) {
    return (
      <PageShell title={t('title')}>
        <Skeleton count={4} />
      </PageShell>
    );
  }

  return (
    <PageShell title={trainer.displayName} subtitle={t('title')}>
      <p className="opt-meta">
        {trainer.acceptingQuestions ? t('accepting') : t('offline')} ·{' '}
        {t('price', { price: trainer.ticketPrice.toLocaleString() })} ·{' '}
        {t('avgAnswer', { hours: trainer.avgAnswerTargetHours })}
      </p>
      <p>
        {t('rating', { avg: trainer.ratingAvg.toFixed(1), count: trainer.reviewCount })} ·{' '}
        {t('answers', { count: trainer.answerCount })}
      </p>
      {trainer.myTicketBalance != null ? (
        <p>
          <strong>{t('myTickets', { count: trainer.myTicketBalance })}</strong>
        </p>
      ) : null}

      {trainer.specialties.length ? (
        <section>
          <h3>{t('specialties')}</h3>
          <p>{trainer.specialties.join(', ')}</p>
        </section>
      ) : null}
      {trainer.intro ? (
        <section>
          <h3>{t('intro')}</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{trainer.intro}</p>
        </section>
      ) : null}
      {trainer.career ? (
        <section>
          <h3>{t('career')}</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{trainer.career}</p>
        </section>
      ) : null}
      {trainer.certifications.length ? (
        <section>
          <h3>{t('certs')}</h3>
          <p>{trainer.certifications.join(', ')}</p>
        </section>
      ) : null}
      <p className="opt-meta">
        {t('region')}: {trainer.regionLabel || '—'} · {t('gym')}: {trainer.gymName || '—'}
      </p>

      {user ? (
        <div className="opt-form" style={{ marginTop: '1rem' }}>
          <div>
            <label htmlFor="opt-qty">{t('buyQty')}</label>
            <input
              id="opt-qty"
              type="number"
              min={1}
              max={20}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <button
            type="button"
            className="btn btn--primary"
            disabled={buyMutation.isPending || !trainer.acceptingQuestions}
            onClick={() => buyMutation.mutate()}
          >
            {t('buy')} (
            {(trainer.ticketPrice * qty).toLocaleString()}원)
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() =>
              navigate(ROUTES.ONLINE_PT_ASK.replace(':trainerId', trainerId))
            }
          >
            {t('ask')}
          </button>
          <Link to={ROUTES.ONLINE_PT_QUESTIONS}>{t('myQuestions')}</Link>
        </div>
      ) : (
        <Link to={ROUTES.LOGIN} className="btn btn--primary btn--block">
          {t('buy')}
        </Link>
      )}
    </PageShell>
  );
}
