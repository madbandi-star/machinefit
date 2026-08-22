import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  markStandardMachineImageHintSeen,
  subscribeStandardMachineImageOnboarding,
} from '@/utils/standardMachineImageOnboarding';
import './StandardMachineImageOnboarding.css';

/** First-time dialog when a common/standard machine photo appears. */
export function StandardMachineImageOnboarding() {
  const { t } = useTranslation('machines');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return subscribeStandardMachineImageOnboarding(() => setOpen(true));
  }, []);

  if (!open) return null;

  const close = () => {
    markStandardMachineImageHintSeen();
    setOpen(false);
  };

  return (
    <div className="std-machine-image-onboarding-overlay" role="presentation" onClick={close}>
      <div
        className="std-machine-image-onboarding"
        role="dialog"
        aria-modal="true"
        aria-labelledby="std-machine-image-onboarding-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="std-machine-image-onboarding__eyebrow">{t('images.standardBadge')}</p>
        <h2 id="std-machine-image-onboarding-title" className="std-machine-image-onboarding__title">
          {t('images.standardOnboardingTitle')}
        </h2>
        <p className="std-machine-image-onboarding__body">{t('images.standardOnboardingBody')}</p>
        <button type="button" className="btn btn--primary btn--block" onClick={close}>
          {t('images.standardOnboardingConfirm')}
        </button>
      </div>
    </div>
  );
}
