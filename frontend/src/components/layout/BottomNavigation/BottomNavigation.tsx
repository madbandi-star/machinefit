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
  requireAuth: boolean;
}[] = [
  { to: ROUTES.HOME, icon: 'home', labelKey: 'nav.home', requireAuth: false },
  { to: ROUTES.MACHINES, icon: 'search', labelKey: 'nav.search', requireAuth: false },
  { to: ROUTES.RECORDS, icon: 'records', labelKey: 'nav.records', requireAuth: true },
  {
    to: ROUTES.GROWTH_ANALYSIS,
    icon: 'growthAnalysis',
    labelKey: 'nav.growthAnalysis',
    requireAuth: true,
  },
  { to: ROUTES.MY_PAGE, icon: 'user', labelKey: 'nav.myPage', requireAuth: true },
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
      {NAV_ITEMS.map(({ to, icon, labelKey, requireAuth }) => (
        <NavLink
          key={to}
          to={to}
          onClick={(e) => handleNavClick(e, requireAuth)}
          className={({ isActive }) =>
            ['bottom-nav__item', isActive ? 'bottom-nav__item--active' : '']
              .filter(Boolean)
              .join(' ')
          }
        >
          <span className="bottom-nav__icon-wrap">
            <Icon name={icon} size={20} />
          </span>
          <span className="bottom-nav__label">{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
