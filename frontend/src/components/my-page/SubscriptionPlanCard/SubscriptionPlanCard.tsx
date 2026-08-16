import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { billingApi } from '@/api';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { usePremium } from '@/providers/PremiumProvider';
import { useUIStore } from '@/store/ui.store';
import { createIdempotencyKey, resolveApiErrorMessage } from '@/utils/apiErrorCatalog';
import { ROUTES } from '@/constants/routes';
import './SubscriptionPlanCard.css';

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
  const showToast = useUIStore((s) => s.showToast);
  const { status, isPremium, isLoading, refresh } = usePremium();
  const { run, isBlocked, isPending, cooldownSeconds } = useAsyncAction();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const billing = searchParams.get('billing');
    if (!billing) return;
    if (billing === 'success') {
      showToast(t('myPage.subscription.toastSuccess'), 'success');
      void refresh();
    } else if (billing === 'cancel') {
      showToast(t('myPage.subscription.toastPayCancel'), 'info');
    } else if (billing === 'refunded') {
      showToast(t('myPage.subscription.toastRefunded'), 'info');
    }
    const next = new URLSearchParams(searchParams);
    next.delete('billing');
    next.delete('checkout_id');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, showToast, t, refresh]);

  const startCheckout = () => {
    void run(async () => {
      try {
        const res = await billingApi.createCheckout(
          { planCode: 'PREMIUM' },
          createIdempotencyKey('checkout')
        );
        const url = res.data.data.checkoutUrl;
        if (!url) {
          showToast(t('myPage.subscription.checkoutUnavailable'), 'error');
          throw new Error('checkout_unavailable');
        }
        window.location.assign(url);
      } catch (error) {
        if ((error as Error)?.message !== 'checkout_unavailable') {
          showToast(resolveApiErrorMessage(error, t, 'myPage.subscription.checkoutUnavailable'), 'error');
        }
        throw error;
      }
    }).catch(() => undefined);
  };

  const cancelSub = () => {
    if (!window.confirm(t('myPage.subscription.cancelConfirm'))) return;
    void run(async () => {
      try {
        await billingApi.cancel();
        showToast(t('myPage.subscription.toastCancelled'), 'success');
        await refresh();
      } catch (error) {
        showToast(resolveApiErrorMessage(error, t), 'error');
        throw error;
      }
    }).catch(() => undefined);
  };

  const resumeSub = () => {
    void run(async () => {
      try {
        await billingApi.resume();
        await refresh();
        showToast(t('myPage.subscription.toastResumed'), 'success');
      } catch (error) {
        showToast(resolveApiErrorMessage(error, t), 'error');
        throw error;
      }
    }).catch(() => undefined);
  };

  const startTrial = () => {
    void run(async () => {
      try {
        await billingApi.startTrial({ planCode: 'PREMIUM' }, createIdempotencyKey('trial'));
        await refresh();
        showToast(t('myPage.subscription.toastSuccess'), 'success');
      } catch (error) {
        showToast(resolveApiErrorMessage(error, t), 'error');
        throw error;
      }
    }).catch(() => undefined);
  };

  const benefits = t('myPage.subscription.benefits', { returnObjects: true });
  const benefitList = Array.isArray(benefits) ? (benefits as string[]) : [];
  const busyLabel =
    isPending
      ? t('processing')
      : cooldownSeconds > 0
        ? t('retryInSeconds', { seconds: cooldownSeconds })
        : t('processing');

  return (
    <section className="my-page-section premium-card" aria-labelledby="subscription-plan-heading">
      <div className="premium-card__panel">
        <header className="premium-card__header">
          <p className="premium-card__eyebrow">{t('myPage.subscription.memberGrade')}</p>
          <div className="premium-card__title-row">
            <h3 id="subscription-plan-heading" className="premium-card__title">
              {isPremium ? (
                <>
                  MachineFit{' '}
                  <span className="premium-card__title-accent">
                    {t('myPage.subscription.gradePremium')}
                  </span>
                </>
              ) : (
                t('myPage.subscription.gradeFree')
              )}
            </h3>
            {isPremium && !isLoading ? (
              <span className="premium-card__status">{t('myPage.subscription.activeBadge')}</span>
            ) : null}
          </div>
          <p className="premium-card__price">
            <span className="premium-card__price-em">
              {t('myPage.subscription.priceAmount')}
            </span>
            <span> · {t('myPage.subscription.priceCancelAnytime')}</span>
          </p>
        </header>

        {isLoading ? (
          <p className="premium-card__muted">…</p>
        ) : isPremium ? (
          <>
            <dl className="premium-card__meta">
              <div>
                <dt>{t('myPage.subscription.nextBilling')}</dt>
                <dd>{formatDate(status?.nextBillingAt ?? status?.expireAt)}</dd>
              </div>
              <div>
                <dt>{t('myPage.subscription.daysLeft')}</dt>
                <dd>
                  {status?.daysRemaining != null
                    ? t('myPage.subscription.daysLeftValue', { count: status.daysRemaining })
                    : '—'}
                </dd>
              </div>
              <div>
                <dt>{t('myPage.subscription.autoRenew')}</dt>
                <dd>
                  {status?.autoRenew
                    ? t('myPage.subscription.autoRenewOn')
                    : t('myPage.subscription.autoRenewOff')}
                </dd>
              </div>
              <div>
                <dt>{t('myPage.subscription.status')}</dt>
                <dd>{status?.subscriptionStatus ?? status?.status ?? '—'}</dd>
              </div>
            </dl>
            <div className="premium-card__actions">
              {status?.cancelAt || status?.subscriptionStatus === 'cancelled' ? (
                <button
                  type="button"
                  className="btn btn--primary btn--block premium-card__cta"
                  disabled={isBlocked}
                  onClick={() => void resumeSub()}
                >
                  {isBlocked ? busyLabel : t('myPage.subscription.resume')}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--secondary btn--block"
                  disabled={isBlocked}
                  onClick={() => void cancelSub()}
                >
                  {isBlocked ? busyLabel : t('myPage.subscription.cancel')}
                </button>
              )}
              <Link to={ROUTES.PAYMENT_HISTORY} className="btn btn--secondary btn--block">
                {t('myPage.subscription.history')}
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="premium-card__lead">{t('myPage.subscription.freeHint')}</p>
            {benefitList.length > 0 ? (
              <ul className="premium-card__benefits">
                {benefitList.map((item) => (
                  <li key={item} className="premium-card__benefit">
                    <span className="premium-card__benefit-mark" aria-hidden>
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="premium-card__actions">
              <button
                type="button"
                className="btn btn--primary btn--block premium-card__cta"
                disabled={isBlocked || status?.paymentReady === false}
                onClick={() => void startCheckout()}
              >
                {status?.paymentReady === false
                  ? t('myPage.subscription.payComingSoon')
                  : isBlocked
                    ? busyLabel
                    : t('myPage.subscription.startPremium')}
              </button>
              {!status?.trialConsumed ? (
                <button
                  type="button"
                  className="btn btn--secondary btn--block"
                  disabled={isBlocked}
                  onClick={() => void startTrial()}
                >
                  {isBlocked ? busyLabel : t('myPage.subscription.startTrial')}
                </button>
              ) : null}
              <Link to={ROUTES.PAYMENT_HISTORY} className="premium-card__history-link">
                {t('myPage.subscription.history')}
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

