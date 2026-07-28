import { useEffect, useRef, useState } from 'react';
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

const SPARKLE_MS = 4_500;

export function NotificationBell() {
  const { t } = useTranslation('notifications');
  const authHydrated = useAuthHydration();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const prevCountRef = useRef<number | null>(null);
  const [sparkle, setSparkle] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: QUERY_KEYS.notificationCount,
    queryFn: async () => {
      const res = await notificationApi.unreadCount();
      return res.data.data.count;
    },
    enabled: authHydrated && isAuthenticated,
    refetchInterval: () => (document.visibilityState === 'visible' ? 120_000 : false),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (data === undefined) return;

    const prev = prevCountRef.current;
    if (prev !== null && data > prev) {
      setSparkle(true);
      const timer = window.setTimeout(() => setSparkle(false), SPARKLE_MS);
      prevCountRef.current = data;
      return () => window.clearTimeout(timer);
    }

    prevCountRef.current = data;
    return undefined;
  }, [data]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const refresh = () => {
      if (document.visibilityState === 'visible') {
        void refetch();
      }
    };

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [isAuthenticated, refetch]);

  if (!authHydrated) {
    return <span className="notification-bell notification-bell--placeholder" aria-hidden />;
  }

  if (!isAuthenticated) return null;

  const count = data ?? 0;
  const hasUnread = count > 0;

  return (
    <Link
      to={ROUTES.NOTIFICATIONS}
      className={[
        'notification-bell',
        hasUnread ? ' notification-bell--unread' : '',
        sparkle ? ' notification-bell--sparkle' : '',
      ].join('')}
      aria-label={hasUnread ? t('titleWithUnread', { count }) : t('title')}
    >
      <Icon name="bell" size={17} className="notification-bell__icon" />
      {hasUnread && (
        <span className="notification-bell__badge">{count > 9 ? '9+' : count}</span>
      )}
    </Link>
  );
}
