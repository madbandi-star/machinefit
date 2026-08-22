import { useTranslation } from 'react-i18next';
import './StandardMachineImageBadge.css';

/** Corner label when the thumb is a shared standard-type photo (may differ from brand SKU). */
export function StandardMachineImageBadge() {
  const { t } = useTranslation('machines');
  return (
    <span className="std-machine-image-badge" title={t('images.standardHint')}>
      {t('images.standardBadge')}
    </span>
  );
}
