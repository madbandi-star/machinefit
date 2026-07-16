import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { notificationApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import '@/styles/notifications.css';

function getLocalized(text: { en?: string; ko?: string } | undefined, lang: string) {
  if (!text) return '';
  return text[lang as keyof typeof text] ?? text.en ?? text.ko ?? '';
}

export function NotificationsPage() {
  const { t, i18n } = useTranslation('notifications');
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
  });

  const lang = i18n.language?.slice(0, 2) ?? 'en';

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
                onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
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
        <p style={{ color: 'var(--color-text-muted)' }}>{t('empty')}</p>
      )}
    </PageShell>
  );
}
