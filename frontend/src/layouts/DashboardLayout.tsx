import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';
import '@/styles/layout.css';

export function DashboardLayout() {
  const { t } = useTranslation();

  return (
    <div className="layout">
      <header className="header">
        <span className="header__logo">🏢 Owner</span>
        <NavLink to={ROUTES.HOME} className="header__link">{t('nav.home')}</NavLink>
      </header>
      <main className="layout__main">
        <div className="layout__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
