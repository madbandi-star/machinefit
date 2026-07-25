import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { NotificationType } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { notificationApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/notifications.css';

function getLocalized(text: { en?: string; ko?: string } | undefined, lang: string) {
  if (!text) return '';
  return text[lang as keyof typeof text] ?? text.en ?? text.ko ?? '';
}

function friendNotificationPath(
  type: NotificationType,
  payload?: Record<string, unknown>
): string | null {
  if (type === 'friend_request') return ROUTES.FRIENDS_INCOMING;
  if (type === 'friend_accepted' || type === 'friend_removed') {
    const userId = typeof payload?.userId === 'string' ? payload.userId : null;
    if (userId) return ROUTES.FRIEND_PROFILE.replace(':userId', userId);
    return ROUTES.FRIENDS;
  }
  if (
    type === 'friend_activity' ||
    type === 'friend_pr' ||
    type === 'friend_workout_done' ||
    type === 'friend_rank_change'
  ) {
    return ROUTES.FRIENDS_FEED;
  }
  return null;
}

export function NotificationsPage() {
  const { t, i18n } = useTranslation('notifications');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.notifications, page],
    queryFn: async () => {
      const res = await notificationApi.list({ page, limit: 15 });
      return res.data.data;
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationCount });
    },
    onError: () => showToast(t('error', { defaultValue: 'Error' }), 'error'),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationCount });
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const lang = i18n.language?.slice(0, 2) ?? 'ko';

  return (
    <PageShell
      title={t('title')}
      action={
        <button
          className="btn btn--secondary"
          onClick={() => markAllMutation.mutate()}
          disabled={markAllMutation.isPending}
        >
          {t('markAllRead')}
        </button>
      }
    >
      {isLoading ? (
        <Skeleton count={4} />
      ) : data?.items.length ? (
        <>
          <div className="notification-list">
            {data.items.map((n) => (
              <button
                key={n.id}
                type="button"
                className={`card notification-item ${n.isRead ? 'notification-item--read' : ''}`}
                onClick={() => {
                  if (!n.isRead) markReadMutation.mutate(n.id);
                  const path = friendNotificationPath(n.type, n.payload);
                  if (path) navigate(path);
                }}
              >
                <div className="notification-item__header">
                  <strong>{getLocalized(n.title, lang)}</strong>
                  {!n.isRead && <span className="notification-item__badge">{t('unread')}</span>}
                </div>
                {n.body && (
                  <p className="notification-item__body">{getLocalized(n.body, lang)}</p>
                )}
                <span className="notification-item__date">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={data.meta.totalPages}
            onPageChange={setPage}
          />
        </>
      ) : (
        <EmptyState icon="bell" title={t('empty')} compact />
      )}
    </PageShell>
  );
}
