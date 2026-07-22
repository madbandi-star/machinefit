import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';
import '@/styles/admin.css';

const ADMIN_LINKS = [
  { to: ROUTES.ADMIN, labelKey: 'navHome', end: true },
  { to: ROUTES.ADMIN_USERS, labelKey: 'users', end: false },
  { to: ROUTES.ADMIN_GYMS, labelKey: 'gyms', end: false },
  { to: ROUTES.ADMIN_OWNER_APPLICATIONS, labelKey: 'ownerApplications.nav', end: false },
  { to: ROUTES.ADMIN_MACHINES, labelKey: 'machines', end: false },
  { to: ROUTES.ADMIN_LOCATIONS, labelKey: 'locations.nav', end: false },
  { to: ROUTES.ADMIN_MOTIVATION, labelKey: 'motivation.nav', end: false },
  { to: ROUTES.ADMIN_MODERATION, labelKey: 'moderation', end: false },
] as const;

export function AdminLayout() {
  const { t } = useTranslation('admin');

  return (
    <div className="admin-shell">
      <div className="admin-shell__chrome">
        <header className="admin-shell__top">
          <div className="admin-shell__brand">
            <strong>{t('shellTitle')}</strong>
            <span className="admin-shell__brand-sub">{t('shellSubtitle')}</span>
          </div>
          <Link to={ROUTES.MY_PAGE} className="admin-shell__exit">
            {t('backToApp')}
          </Link>
        </header>

        <nav className="admin-shell__nav" aria-label={t('shellTitle')}>
          <div className="admin-shell__nav-track">
            {ADMIN_LINKS.map(({ to, labelKey, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `admin-shell__nav-link${isActive ? ' is-active' : ''}`
                }
              >
                {t(labelKey)}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      <main className="admin-shell__main">
        <div className="admin-shell__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
