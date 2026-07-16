import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/components/icons/Icon';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import './BottomNavigation.css';

const NAV_ITEMS: {
  to: string;
  icon: IconName;
  labelKey: string;
  fab: boolean;
  requireAuth: boolean;
}[] = [
  { to: ROUTES.HOME, icon: 'home', labelKey: 'nav.home', fab: false, requireAuth: false },
  { to: ROUTES.MACHINES, icon: 'machines', labelKey: 'nav.machines', fab: true, requireAuth: false },
  { to: ROUTES.RECORDS, icon: 'records', labelKey: 'nav.records', fab: false, requireAuth: true },
  { to: ROUTES.MY_PAGE, icon: 'user', labelKey: 'nav.myPage', fab: false, requireAuth: true },
];

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
    <nav className="bottom-nav" aria-label={t('nav.main')}>
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
          <span
            className={`bottom-nav__icon-wrap${fab ? ' bottom-nav__icon-wrap--fab' : ''}`}
          >
            <Icon name={icon} size={fab ? 24 : 20} />
          </span>
          <span className="bottom-nav__label">{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
