import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { notifyStandardMachineImageShown } from '@/utils/standardMachineImageOnboarding';
import './StandardMachineImageBadge.css';

/** Bottom-of-thumb label when the image is a shared standard-type photo. */
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
