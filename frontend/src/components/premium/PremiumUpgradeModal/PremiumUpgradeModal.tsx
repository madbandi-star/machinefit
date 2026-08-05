import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { billingApi } from '@/api';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import { usePremiumStore } from '@/store/premium.store';
import { useUIStore } from '@/store/ui.store';

interface PremiumUpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function PremiumUpgradeModal({ open, onClose }: PremiumUpgradeModalProps) {
  const { t } = useTranslation(['gyms', 'common']);
  const showToast = useUIStore((s) => s.showToast);
  const dialogRef = useModalAccessibility({ open, onClose });
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const benefits = t('gyms:premium.benefits', { returnObjects: true }) as string[];

  const handleSubscribe = async () => {
    setBusy(true);
    try {
      const res = await billingApi.createCheckout({ planCode: 'PREMIUM' });
      const url = res.data.data.checkoutUrl;
      if (!url) {
        showToast(t('common:myPage.subscription.checkoutUnavailable'), 'error');
        return;
      }
      window.location.assign(url);
    } catch {
      showToast(t('common:myPage.subscription.checkoutUnavailable'), 'info');
      onClose();
    } finally {
      setBusy(false);
    }
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
            disabled={busy}
            onClick={() => void handleSubscribe()}
          >
            {t('common:myPage.subscription.startPremium')}
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
