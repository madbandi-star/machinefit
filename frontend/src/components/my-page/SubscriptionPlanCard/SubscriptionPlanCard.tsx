import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { billingApi } from '@/api';
import { usePremium } from '@/providers/PremiumProvider';
import { useUIStore } from '@/store/ui.store';
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
  const [busy, setBusy] = useState(false);
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

  const startCheckout = async () => {
    setBusy(true);
    try {
      const res = await billingApi.createCheckout({ planCode: 'PREMIUM' });
      const url = res.data.data.checkoutUrl;
      if (!url) {
        showToast(t('myPage.subscription.checkoutUnavailable'), 'error');
        return;
      }
      window.location.assign(url);
    } catch {
      showToast(t('myPage.subscription.checkoutUnavailable'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const cancelSub = async () => {
    if (!window.confirm(t('myPage.subscription.cancelConfirm'))) return;
    setBusy(true);
    try {
      await billingApi.cancel();
      showToast(t('myPage.subscription.toastCancelled'), 'success');
      await refresh();
    } catch {
      showToast(t('errors.submitFailed'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const resumeSub = async () => {
    setBusy(true);
    try {
      await billingApi.resume();
      await refresh();
      showToast(t('myPage.subscription.toastResumed'), 'success');
    } catch {
      showToast(t('errors.submitFailed'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const gradeLabel = isPremium
    ? t('myPage.subscription.gradePremium')
    : t('myPage.subscription.gradeFree');

  return (
    <section className="my-page-section premium-card" aria-labelledby="subscription-plan-heading">
      <div className="premium-card__panel">
        <header className="premium-card__header">
          <p className="premium-card__eyebrow">{t('myPage.subscription.memberGrade')}</p>
          <h3 id="subscription-plan-heading" className="premium-card__title">
            {gradeLabel}
          </h3>
          <p className="premium-card__price">{t('myPage.subscription.priceLine')}</p>
        </header>

        {isLoading ? (
          <p className="premium-card__muted">…</p>
        ) : isPremium ? (
          <>
            <p className="premium-card__status-pill">{t('myPage.subscription.activeBadge')}</p>
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
                  className="btn btn--primary btn--block"
                  disabled={busy}
                  onClick={() => void resumeSub()}
                >
                  {t('myPage.subscription.resume')}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--secondary btn--block"
                  disabled={busy}
                  onClick={() => void cancelSub()}
                >
                  {t('myPage.subscription.cancel')}
                </button>
              )}
              <Link
                to={ROUTES.PAYMENT_HISTORY}
                className="btn btn--secondary btn--block"
              >
                {t('myPage.subscription.history')}
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="premium-card__muted">{t('myPage.subscription.freeHint')}</p>
            <button
              type="button"
              className="btn btn--primary btn--block"
              disabled={busy || status?.paymentReady === false}
              onClick={() => void startCheckout()}
            >
              {status?.paymentReady === false
                ? t('myPage.subscription.payComingSoon')
                : t('myPage.subscription.startPremium')}
            </button>
            {!status?.trialConsumed ? (
              <button
                type="button"
                className="btn btn--secondary btn--block"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void billingApi
                    .startTrial({ planCode: 'PREMIUM' })
                    .then(() => refresh())
                    .then(() => showToast(t('myPage.subscription.toastSuccess'), 'success'))
                    .catch(() => showToast(t('errors.submitFailed'), 'error'))
                    .finally(() => setBusy(false));
                }}
              >
                {t('myPage.subscription.startTrial')}
              </button>
            ) : null}
            <Link to={ROUTES.PAYMENT_HISTORY} className="premium-card__history-link">
              {t('myPage.subscription.history')}
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
