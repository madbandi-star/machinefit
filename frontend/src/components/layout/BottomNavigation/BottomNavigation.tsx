import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/components/icons/Icon';
import { ROUTES } from '@/constants/routes';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { queryClient } from '@/app/providers/QueryProvider';
import { brandApi, favoriteApi, historyApi, machineApi } from '@/api';
import { useGymStore } from '@/store/gym.store';
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
  { to: ROUTES.MY_PAGE, icon: 'user', labelKey: 'nav.myPage', requireAuth: true },
];

function prefetchForRoute(to: string, gymId: string | null, memberId: string | null, isAuthenticated: boolean) {
  if (to === ROUTES.MACHINES) {
    void queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.brands,
      queryFn: async () => (await brandApi.list()).data.data,
      staleTime: 10 * 60_000,
    });
    void queryClient.prefetchQuery({
      queryKey: [...QUERY_KEYS.machines, '', null, null, 'machines_only'],
      queryFn: async () => {
        const res = await machineApi.list({ limit: 100 });
        return res.data.data.items;
      },
      staleTime: 60_000,
    });
  }

  if (!isAuthenticated || !gymId) return;

  if (to === ROUTES.RECORDS || to === ROUTES.HOME) {
    void queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.historyList(gymId, memberId ?? '', { limit: 100 }),
      queryFn: async () =>
        (
          await historyApi.list(gymId, {
            limit: 100,
            memberId: memberId ?? undefined,
          })
        ).data.data,
      staleTime: 60_000,
    });
    void queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.favorites(gymId, memberId ?? ''),
      queryFn: async () => (await favoriteApi.list(gymId, memberId ?? undefined)).data.data,
      staleTime: 60_000,
    });
  }
}

export function BottomNavigation() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const gymId = useGymStore((s) => s.activeGymId);
  const memberId = useGymStore((s) => s.activeMemberId);

  const handleNavClick = (
    event: MouseEvent<HTMLAnchorElement>,
    requireAuth: boolean,
    to: string
  ) => {
    prefetchForRoute(to, gymId, memberId, isAuthenticated);
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
          onClick={(e) => handleNavClick(e, requireAuth, to)}
          onMouseEnter={() => prefetchForRoute(to, gymId, memberId, isAuthenticated)}
          onTouchStart={() => prefetchForRoute(to, gymId, memberId, isAuthenticated)}
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
