import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { noticeApi } from '@/api/notice.api';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { sanitizeNoticeHtml } from '@/utils/sanitizeNoticeHtml';
import '@/styles/notices.css';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dismissKey(noticeId: string): string {
  return `notice-popup-hide:${noticeId}:${todayKey()}`;
}

function seenKey(noticeId: string): string {
  return `notice-popup-seen:${noticeId}`;
}

export function NoticePopup() {
  const { t, i18n } = useTranslation('community');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['notices', 'popup', i18n.language],
    queryFn: async () => {
      const res = await noticeApi.popup(i18n.language.slice(0, 2));
      return res.data.data;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!isAuthenticated || !data) {
      setOpen(false);
      return;
    }
    if (localStorage.getItem(dismissKey(data.id))) {
      setOpen(false);
      return;
    }
    if (localStorage.getItem(seenKey(data.id))) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [isAuthenticated, data]);

  if (!open || !data) return null;

  const close = () => {
    localStorage.setItem(seenKey(data.id), '1');
    setOpen(false);
  };

  const hideToday = () => {
    localStorage.setItem(dismissKey(data.id), '1');
    localStorage.setItem(seenKey(data.id), '1');
    setOpen(false);
  };

  return (
    <div className="notice-popup-overlay" role="presentation" onClick={close}>
      <div
        className="notice-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notice-popup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notice-popup__flags">
          {data.isImportant ? (
            <span className="notice-badge notice-badge--important">{t('notices.important')}</span>
          ) : null}
          <span className="notice-badge notice-badge--category">
            {t(`notices.categories.${data.category}`)}
          </span>
        </div>
        <h2 id="notice-popup-title" className="notice-popup__title">
          {data.title}
        </h2>
        {data.excerpt ? (
          <div
            className="notice-popup__excerpt"
            dangerouslySetInnerHTML={{ __html: sanitizeNoticeHtml(`<p>${data.excerpt}</p>`) }}
          />
        ) : null}
        <div className="notice-popup__actions">
          <Link
            to={ROUTES.NOTICE_DETAIL.replace(':noticeId', data.id)}
            className="btn btn--primary btn--block"
            onClick={close}
          >
            {t('notices.viewDetail')}
          </Link>
          <div className="notice-popup__actions-row">
            <button type="button" className="btn btn--secondary" onClick={hideToday}>
              {t('notices.hideToday')}
            </button>
            <button type="button" className="btn btn--secondary" onClick={close}>
              {t('notices.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
