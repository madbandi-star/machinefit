import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { isRoleCode, type NotificationType } from '@machinefit/shared';
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

const PUSH_NOTIFICATION_TYPES = new Set<NotificationType>([
  'push_general',
  'push_notice',
  'push_workout',
  'push_schedule',
  'push_trade',
  'push_event',
]);

function formatPushSenderLabel(
  payload: Record<string, unknown> | undefined,
  roleLabel: (role: string) => string
): string | null {
  if (!payload) return null;

  const loginId =
    typeof payload.senderLoginId === 'string'
      ? payload.senderLoginId
      : typeof payload.senderId === 'string'
        ? payload.senderId.slice(0, 8)
        : null;

  const role =
    typeof payload.senderRole === 'string' && isRoleCode(payload.senderRole)
      ? roleLabel(payload.senderRole)
      : null;

  if (loginId && role) return `${loginId} · ${role}`;
  if (loginId) return loginId;
  if (role) return role;
  return null;
}

function notificationPath(
  type: NotificationType,
  payload?: Record<string, unknown>
): string | null {
  if (
    type === 'machine_request' ||
    type === 'machine_request_like' ||
    type === 'machine_request_comment' ||
    type === 'machine_request_reply'
  ) {
    const requestId = typeof payload?.requestId === 'string' ? payload.requestId : null;
    if (requestId) {
      return ROUTES.MACHINE_REQUESTS_DETAIL.replace(':requestId', requestId);
    }
    return ROUTES.MACHINE_REQUESTS;
  }
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
  const { t, i18n } = useTranslation(['notifications', 'push']);
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
                  const path = notificationPath(n.type, n.payload);
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
                <div className="notification-item__footer">
                  <span className="notification-item__date">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                  {PUSH_NOTIFICATION_TYPES.has(n.type) ? (
                    <span className="notification-item__sender">
                      {formatPushSenderLabel(n.payload, (role) =>
                        t(`roles.${role}`, { ns: 'push' })
                      ) ?? t('pushSenderUnknown', { ns: 'notifications' })}
                    </span>
                  ) : null}
                </div>
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
