import { useTranslation } from 'react-i18next';
import { billingApi } from '@/api';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import { usePremiumStore } from '@/store/premium.store';
import { useUIStore } from '@/store/ui.store';
import { createIdempotencyKey, resolveApiErrorMessage } from '@/utils/apiErrorCatalog';

interface PremiumUpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function PremiumUpgradeModal({ open, onClose }: PremiumUpgradeModalProps) {
  const { t } = useTranslation(['gyms', 'common']);
  const showToast = useUIStore((s) => s.showToast);
  const dialogRef = useModalAccessibility({ open, onClose });
  const { run, isBlocked, isPending, cooldownSeconds } = useAsyncAction();

  if (!open) return null;

  const benefits = t('gyms:premium.benefits', { returnObjects: true }) as string[];
  const busyLabel = isPending
    ? t('common:processing')
    : cooldownSeconds > 0
      ? t('common:retryInSeconds', { seconds: cooldownSeconds })
      : t('common:processing');

  const handleSubscribe = () => {
    void run(async () => {
      try {
        const res = await billingApi.createCheckout(
          { planCode: 'PREMIUM' },
          createIdempotencyKey('checkout')
        );
        const url = res.data.data.checkoutUrl;
        if (!url) {
          showToast(t('common:myPage.subscription.checkoutUnavailable'), 'error');
          throw new Error('checkout_unavailable');
        }
        window.location.assign(url);
      } catch (error) {
        if ((error as Error)?.message !== 'checkout_unavailable') {
          showToast(
            resolveApiErrorMessage(error, t, 'common:myPage.subscription.checkoutUnavailable'),
            'info'
          );
          onClose();
        }
        throw error;
      }
    }).catch(() => undefined);
  };

  return (
    <div className="dialog-overlay" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="dialog card premium-upgrade-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="premium-upgrade-modal__header">
          <span className="premium-upgrade-modal__badge">{t('gyms:premium.badge')}</span>
          <h3 id="premium-modal-title" className="premium-upgrade-modal__title">
            {t('gyms:premium.title')}
          </h3>
          <p className="premium-upgrade-modal__subtitle">{t('gyms:premium.subtitle')}</p>
          <p className="premium-upgrade-modal__subtitle">
            {t('common:myPage.subscription.priceLine')}
          </p>
        </div>

        <ul className="premium-upgrade-modal__benefits">
          {Array.isArray(benefits)
            ? benefits.map((benefit) => (
                <li key={benefit} className="premium-upgrade-modal__benefit">
                  <span className="premium-upgrade-modal__benefit-icon" aria-hidden>
                    ✓
                  </span>
                  {benefit}
                </li>
              ))
            : null}
        </ul>

        <div className="premium-upgrade-modal__actions">
          <button
            type="button"
            className="btn btn--primary btn--block"
            disabled={isBlocked}
            onClick={() => void handleSubscribe()}
          >
            {isBlocked ? busyLabel : t('common:myPage.subscription.startPremium')}
          </button>
          <button type="button" className="btn btn--secondary btn--block" onClick={onClose}>
            {t('gyms:premium.later')}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Renders the modal driven by the premium store — mount once at app root. */
export function PremiumUpgradeModalGlobal() {
  const open = usePremiumStore((s) => s.premiumModalOpen);
  const close = usePremiumStore((s) => s.closePremiumModal);
  return <PremiumUpgradeModal open={open} onClose={close} />;
}
