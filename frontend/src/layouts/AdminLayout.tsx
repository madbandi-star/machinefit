import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';
import '@/styles/layout.css';

const ADMIN_LINKS = [
  { to: ROUTES.ADMIN, labelKey: 'title' },
  { to: ROUTES.ADMIN_USERS, labelKey: 'users' },
  { to: ROUTES.ADMIN_GYMS, labelKey: 'gyms' },
  { to: ROUTES.ADMIN_OWNER_APPLICATIONS, labelKey: 'ownerApplications.nav' },
  { to: ROUTES.ADMIN_MACHINES, labelKey: 'machines' },
  { to: ROUTES.ADMIN_LOCATIONS, labelKey: 'locations.nav' },
  { to: ROUTES.ADMIN_MOTIVATION, labelKey: 'motivation.nav' },
  { to: ROUTES.ADMIN_MODERATION, labelKey: 'moderation' },
] as const;

export function AdminLayout() {
  const { t } = useTranslation('admin');

  return (
    <div className="layout">
      <header className="header">
        <span className="header__logo">⚙️ Admin</span>
        <nav className="header__actions" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          {ADMIN_LINKS.map(({ to, labelKey }) => (
            <NavLink key={to} to={to} className="header__link">{t(labelKey)}</NavLink>
          ))}
        </nav>
      </header>
      <main className="layout__main">
        <div className="layout__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
