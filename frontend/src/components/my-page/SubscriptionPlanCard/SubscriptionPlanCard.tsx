import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { billingApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

export function SubscriptionPlanCard() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const statusQuery = useQuery({
    queryKey: QUERY_KEYS.subscriptionStatus,
    queryFn: async () => (await billingApi.getStatus()).data.data,
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  const status = statusQuery.data;

  return (
    <section className="my-page-section" aria-labelledby="subscription-plan-heading">
      <div className="card" style={{ padding: '1rem' }}>
        <h3
          id="subscription-plan-heading"
          className="my-page-section__title"
          style={{ marginTop: 0 }}
        >
          {t('myPage.subscription.title')}
        </h3>
        {statusQuery.isLoading ? (
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>…</p>
        ) : (
          <dl className="profile-card__fields" style={{ margin: 0 }}>
            <div className="profile-card__row profile-card__row--full">
              <dt>{t('myPage.subscription.currentPlan')}</dt>
              <dd>{status?.planLabel ?? status?.planCode ?? 'FREE'}</dd>
            </div>
            <div className="profile-card__row profile-card__row--full">
              <dt>{t('myPage.subscription.status')}</dt>
              <dd>{status?.status ?? 'NONE'}</dd>
            </div>
            <div className="profile-card__row profile-card__row--full">
              <dt>{t('myPage.subscription.trial')}</dt>
              <dd>
                {status?.isTrial
                  ? t('myPage.subscription.trialActive')
                  : status?.trialConsumed
                    ? t('myPage.subscription.trialUsed')
                    : t('myPage.subscription.trialAvailable')}
              </dd>
            </div>
            <div className="profile-card__row profile-card__row--full">
              <dt>{t('myPage.subscription.trialEnd')}</dt>
              <dd>{formatDate(status?.trialEndAt)}</dd>
            </div>
            <div className="profile-card__row profile-card__row--full">
              <dt>{t('myPage.subscription.start')}</dt>
              <dd>{formatDate(status?.startAt)}</dd>
            </div>
            <div className="profile-card__row profile-card__row--full">
              <dt>{t('myPage.subscription.expire')}</dt>
              <dd>{formatDate(status?.expireAt)}</dd>
            </div>
          </dl>
        )}
        <button
          type="button"
          className="btn btn--secondary btn--block"
          style={{ marginTop: '0.85rem' }}
          disabled
          aria-disabled="true"
        >
          {t('myPage.subscription.payComingSoon')}
        </button>
      </div>
    </section>
  );
}
