import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { notifyStandardMachineImageShown } from '@/utils/standardMachineImageOnboarding';
import './StandardMachineImageBadge.css';

/** Corner label when the thumb is a shared standard-type photo. */
export function StandardMachineImageBadge() {
  const { t } = useTranslation('machines');

  useEffect(() => {
    notifyStandardMachineImageShown();
  }, []);

  return (
    <span className="std-machine-image-badge" aria-hidden>
      {t('images.standardBadge')}
    </span>
  );
}

/** Always-visible one-line note under/near the thumb. */
export function StandardMachineImageCaption({ className }: { className?: string }) {
  const { t } = useTranslation('machines');

  useEffect(() => {
    notifyStandardMachineImageShown();
  }, []);

  return (
    <p className={`std-machine-image-caption${className ? ` ${className}` : ''}`}>
      {t('images.standardCaption')}
    </p>
  );
}
