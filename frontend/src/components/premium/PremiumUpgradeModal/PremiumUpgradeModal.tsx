import { useTranslation } from 'react-i18next';
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

  if (!open) return null;

  const benefits = t('gyms:premium.benefits', { returnObjects: true }) as string[];

  const handleSubscribe = () => {
    showToast(t('gyms:premium.comingSoon'), 'info');
    onClose();
  };

  return (
    <div
      className="dialog-overlay"
      role="presentation"
      onClick={onClose}
    >
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
        </div>

        <ul className="premium-upgrade-modal__benefits">
          {Array.isArray(benefits)
            ? benefits.map((benefit) => (
                <li key={benefit} className="premium-upgrade-modal__benefit">
                  <span className="premium-upgrade-modal__benefit-icon" aria-hidden>✓</span>
                  {benefit}
                </li>
              ))
            : null}
        </ul>

        <div className="premium-upgrade-modal__actions">
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={handleSubscribe}
          >
            {t('gyms:premium.subscribe')}
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--block"
            onClick={onClose}
          >
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
