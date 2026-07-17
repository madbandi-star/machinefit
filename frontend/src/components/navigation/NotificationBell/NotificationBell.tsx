import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import { notificationApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { useAuthStore } from '@/store/auth.store';
import './NotificationBell.css';

export function NotificationBell() {
  const { t } = useTranslation('notifications');
  const authHydrated = useAuthHydration();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data } = useQuery({
    queryKey: QUERY_KEYS.notificationCount,
    queryFn: async () => {
      const res = await notificationApi.unreadCount();
      return res.data.data.count;
    },
    enabled: authHydrated && isAuthenticated,
    refetchInterval: 60_000,
  });

  if (!authHydrated) {
    return <span className="notification-bell notification-bell--placeholder" aria-hidden />;
  }

  if (!isAuthenticated) return null;

  const count = data ?? 0;

  return (
    <Link to={ROUTES.NOTIFICATIONS} className="notification-bell" aria-label={t('title')}>
      <Icon name="bell" size={17} />
      {count > 0 && <span className="notification-bell__badge">{count > 9 ? '9+' : count}</span>}
    </Link>
  );
}
