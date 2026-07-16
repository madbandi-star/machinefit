import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import './BottomNavigation.css';

const NAV_ITEMS = [
  { to: ROUTES.HOME, icon: '🏠', labelKey: 'nav.home', fab: false, requireAuth: false },
  { to: ROUTES.MACHINES, icon: '🔧', labelKey: 'nav.machines', fab: true, requireAuth: false },
  { to: ROUTES.RECORDS, icon: '📋', labelKey: 'nav.records', fab: false, requireAuth: true },
  { to: ROUTES.MY_PAGE, icon: '👤', labelKey: 'nav.myPage', fab: false, requireAuth: true },
] as const;

export function BottomNavigation() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handleNavClick = (
    event: MouseEvent<HTMLAnchorElement>,
    requireAuth: boolean
  ) => {
    if (requireAuth && !isAuthenticated) {
      event.preventDefault();
      navigate(ROUTES.LOGIN, { state: { from: location } });
    }
  };

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ to, icon, labelKey, fab, requireAuth }) => (
        <NavLink
          key={to}
          to={to}
          onClick={(e) => handleNavClick(e, requireAuth)}
          className={({ isActive }) =>
            [
              'bottom-nav__item',
              isActive ? 'bottom-nav__item--active' : '',
              fab ? 'bottom-nav__item--fab' : '',
            ]
              .filter(Boolean)
              .join(' ')
          }
        >
          <span className="bottom-nav__icon">{icon}</span>
          <span>{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
