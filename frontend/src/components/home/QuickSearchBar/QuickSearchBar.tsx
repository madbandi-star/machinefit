import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import { ROUTES } from '@/constants/routes';
import '@/styles/home.css';

export function QuickSearchBar() {
  const { t } = useTranslation();

  return (
    <div className="home-quick-actions" role="group" aria-label={t('pages.home.quickActionsLabel')}>
      <Link to={ROUTES.MACHINES} className="home-quick-actions__btn home-quick-actions__btn--search">
        <span className="home-quick-actions__icon" aria-hidden>
          <Icon name="search" size={28} />
        </span>
        <span className="home-quick-actions__label">{t('pages.home.quickSearch')}</span>
      </Link>
      <Link to={ROUTES.SCAN} className="home-quick-actions__btn home-quick-actions__btn--scan">
        <span className="home-quick-actions__icon" aria-hidden>
          <Icon name="qr" size={28} />
        </span>
        <span className="home-quick-actions__label">{t('pages.home.quickScan')}</span>
      </Link>
    </div>
  );
}
