import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';
import '@/styles/layout.css';
import '@/styles/inspection.css';

const EQUIPMENT_LINK_KEYS = [
  { to: ROUTES.OWNER_EQUIPMENT, key: 'links.hub', end: true },
  { to: ROUTES.OWNER_EQUIPMENT_INVENTORY, key: 'links.inventory', end: false },
  { to: ROUTES.OWNER_EQUIPMENT_INSPECTIONS, key: 'links.inspections', end: false },
  { to: ROUTES.OWNER_EQUIPMENT_PM, key: 'links.pm', end: false },
  { to: ROUTES.OWNER_EQUIPMENT_FAULTS, key: 'links.faults', end: false },
  { to: ROUTES.OWNER_EQUIPMENT_REPAIRS, key: 'links.repairs', end: false },
  { to: ROUTES.OWNER_EQUIPMENT_PARTS, key: 'links.parts', end: false },
  { to: ROUTES.OWNER_EQUIPMENT_STATS, key: 'links.stats', end: false },
  { to: ROUTES.OWNER_EQUIPMENT_SETTINGS, key: 'links.settings', end: false },
] as const;

export function DashboardLayout() {
  const { t } = useTranslation('equipment');

  return (
    <div className="layout inspection-shell">
      <header className="header inspection-shell__header">
        <Link to={ROUTES.OWNER} className="header__logo">
          Owner
        </Link>
        <nav className="inspection-shell__top-nav" aria-label="Owner">
          <NavLink to={ROUTES.OWNER} end className="header__link">
            {t('dashboard')}
          </NavLink>
          <NavLink to={ROUTES.OWNER_EQUIPMENT} className="header__link">
            {t('equipment')}
          </NavLink>
          <NavLink to={ROUTES.HOME} className="header__link">
            {t('home')}
          </NavLink>
        </nav>
      </header>

      <nav className="inspection-shell__subnav" aria-label={t('navAria')}>
        <div className="inspection-shell__subnav-track">
          {EQUIPMENT_LINK_KEYS.map(({ to, key, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `inspection-shell__subnav-link${isActive ? ' is-active' : ''}`
              }
            >
              {t(key)}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="layout__main">
        <div className="layout__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
