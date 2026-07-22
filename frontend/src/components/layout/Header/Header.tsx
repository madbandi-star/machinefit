import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { LanguageSelector } from '@/components/settings/LanguageSelector/LanguageSelector';
import { MotivationMediaControls } from '@/components/motivation/MotivationMediaControls/MotivationMediaControls';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton/PwaInstallButton';
import { NotificationBell } from '@/components/navigation/NotificationBell/NotificationBell';
import './Header.css';

export function Header() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <header className="header">
      <div className="header__brand">
        <Link to={ROUTES.HOME} className="header__logo">
          <img
            className="header__logo-mark"
            src={`${import.meta.env.BASE_URL}assets/brand/machinefit-mark.svg`}
            alt=""
            width={34}
            height={34}
            decoding="async"
          />
          Machine<span className="header__logo-fit">Fit</span>
        </Link>
        <LanguageSelector variant="compact" />
      </div>

      <div className="header__actions">
        <MotivationMediaControls variant="bundle" />
        <NotificationBell />
        <PwaInstallButton variant="header" />
        {isAuthenticated ? (
          <Link to={ROUTES.MY_PAGE} className="header__link header__link--desktop">
            {t('nav.myPage')}
          </Link>
        ) : (
          <Link to={ROUTES.LOGIN} className="header__link header__link--desktop">
            {t('nav.login')}
          </Link>
        )}
      </div>
    </header>
  );
}
