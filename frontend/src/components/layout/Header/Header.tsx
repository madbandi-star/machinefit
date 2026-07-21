import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
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
      <Link to={ROUTES.HOME} className="header__logo">
        <span className="header__logo-icon" aria-hidden>
          <Icon name="dumbbell" size={18} />
        </span>
        Machine<span className="header__logo-fit">Fit</span>
      </Link>
      <div className="header__actions">
        <div className="header__lang-stack">
          <LanguageSelector />
          <MotivationMediaControls />
        </div>
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
