import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';
import './BottomNavigation.css';

const NAV_ITEMS = [
  { to: ROUTES.HOME, icon: '🏠', labelKey: 'nav.home' },
  { to: ROUTES.MACHINES, icon: '🔧', labelKey: 'nav.machines' },
  { to: ROUTES.GYMS, icon: '📍', labelKey: 'nav.gyms' },
  { to: ROUTES.COMMUNITY, icon: '💬', labelKey: 'nav.community' },
  { to: ROUTES.MY_PAGE, icon: '👤', labelKey: 'nav.myPage' },
] as const;

export function BottomNavigation() {
  const { t } = useTranslation();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ to, icon, labelKey }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
          }
        >
          <span className="bottom-nav__icon">{icon}</span>
          <span>{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
