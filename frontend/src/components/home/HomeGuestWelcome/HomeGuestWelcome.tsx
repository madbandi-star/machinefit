import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import { ROUTES } from '@/constants/routes';
import '@/styles/home.css';

/** Logged-out home body — brand + one CTA group (no empty shell). */
export function HomeGuestWelcome() {
  const { t } = useTranslation();

  return (
    <section className="home-guest" aria-label={t('pages.home.guestLabel')}>
      <div className="home-guest__brand">
        <img
          className="home-guest__mark"
          src={`${import.meta.env.BASE_URL}assets/brand/machinefit-mark.svg`}
          alt=""
          width={56}
          height={56}
          decoding="async"
        />
        <p className="home-guest__name">
          Machine<span className="home-guest__name-fit">Fit</span>
        </p>
      </div>

      <h1 className="home-guest__title">{t('pages.home.guestTitle')}</h1>
      <p className="home-guest__desc">{t('pages.home.guestDesc')}</p>

      <div className="home-guest__actions">
        <Link to={ROUTES.LOGIN} className="btn btn--primary btn--block home-guest__login">
          {t('pages.home.guestLogin')}
        </Link>
        <Link to={ROUTES.MACHINES} className="home-guest__browse">
          <Icon name="search" size={18} />
          <span>{t('pages.home.guestBrowse')}</span>
          <Icon name="chevronRight" size={16} />
        </Link>
      </div>
    </section>
  );
}
