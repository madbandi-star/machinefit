import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { noticeApi } from '@/api/notice.api';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/notices.css';

function formatNoticeDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale || 'ko', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function AdminNoticesPage() {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [q, setQ] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'notices', q],
    queryFn: async () => {
      const res = await noticeApi.list({
        admin: true,
        includeDrafts: true,
        pageSize: 50,
        q: q || undefined,
        language: i18n.language.slice(0, 2),
      });
      return res.data.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['admin', 'notices', 'stats'],
    queryFn: async () => {
      const res = await noticeApi.stats();
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => noticeApi.remove(id),
    onSuccess: async () => {
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
      showToast(t('admin:notices.deleted'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const toggle = useMutation({
    mutationFn: async ({
      id,
      kind,
      value,
    }: {
      id: string;
      kind: 'pin' | 'important' | 'banner' | 'popup';
      value: boolean;
    }) => {
      if (kind === 'pin') return noticeApi.pin(id, value);
      if (kind === 'important') return noticeApi.important(id, value);
      if (kind === 'banner') return noticeApi.bannerFlag(id, value);
      return noticeApi.popupFlag(id, value);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
    },
  });

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1>{t('admin:notices.title')}</h1>
          <p className="admin-page__subtitle">{t('admin:notices.subtitle')}</p>
        </div>
        <Link to={ROUTES.ADMIN_NOTICE_NEW} className="btn btn--primary">
          {t('admin:notices.create')}
        </Link>
      </div>

      {stats ? (
        <div className="admin-panel" style={{ marginBottom: '1rem' }}>
          <p>
            {t('admin:notices.statsLine', {
              published: stats.totalPublished,
              views: stats.totalViews,
              views30: stats.viewsLast30Days,
            })}
          </p>
          {stats.popular.length > 0 ? (
            <ul>
              {stats.popular.map((item) => (
                <li key={item.id}>
                  {item.title} ({item.viewCount})
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="notice-list__search" style={{ marginBottom: '0.75rem' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('admin:notices.searchPlaceholder')}
        />
      </div>

      {isLoading ? <Skeleton count={3} height={48} /> : null}
      {isError ? <QueryErrorMessage /> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('admin:notices.colTitle')}</th>
              <th>{t('admin:notices.colStatus')}</th>
              <th>{t('admin:notices.colFlags')}</th>
              <th>{t('admin:notices.colViews')}</th>
              <th>{t('admin:notices.colDate')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link to={ROUTES.ADMIN_NOTICE_EDIT.replace(':noticeId', item.id)}>
                    {item.title}
                  </Link>
                </td>
                <td>{item.status}</td>
                <td>
                  <div className="admin-notice-flags">
                    <label>
                      <input
                        type="checkbox"
                        checked={item.isPinned}
                        onChange={(e) =>
                          toggle.mutate({ id: item.id, kind: 'pin', value: e.target.checked })
                        }
                      />
                      {t('admin:notices.pin')}
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={item.isImportant}
                        onChange={(e) =>
                          toggle.mutate({
                            id: item.id,
                            kind: 'important',
                            value: e.target.checked,
                          })
                        }
                      />
                      {t('admin:notices.important')}
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={item.isBanner}
                        onChange={(e) =>
                          toggle.mutate({ id: item.id, kind: 'banner', value: e.target.checked })
                        }
                      />
                      {t('admin:notices.banner')}
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={item.isPopup}
                        onChange={(e) =>
                          toggle.mutate({ id: item.id, kind: 'popup', value: e.target.checked })
                        }
                      />
                      {t('admin:notices.popup')}
                    </label>
                  </div>
                </td>
                <td>{item.viewCount}</td>
                <td>{formatNoticeDate(item.publishAt ?? item.createdAt, i18n.language)}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={() => setPendingDelete(item.id)}
                  >
                    {t('common:actions.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('admin:notices.deleteTitle')}
        message={t('admin:notices.deleteMessage')}
        confirmVariant="danger"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete)}
      />
    </div>
  );
}
