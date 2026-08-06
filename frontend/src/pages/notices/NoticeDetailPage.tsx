import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { noticeApi } from '@/api/notice.api';
import { ROUTES } from '@/constants/routes';
import { sanitizeNoticeHtml } from '@/utils/sanitizeNoticeHtml';
import { apiClient } from '@/services/http/axios-client';
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

export function NoticeDetailPage() {
  const { noticeId = '' } = useParams();
  const { t, i18n } = useTranslation(['community', 'common']);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notices', 'detail', noticeId, i18n.language],
    queryFn: async () => {
      const res = await noticeApi.get(noticeId, { language: i18n.language.slice(0, 2) });
      return res.data.data;
    },
    enabled: Boolean(noticeId),
  });

  if (isLoading) {
    return (
      <PageShell title={t('community:notices.title')}>
        <Skeleton count={3} height={80} />
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell title={t('community:notices.title')}>
        <QueryErrorMessage />
      </PageShell>
    );
  }

  return (
    <PageShell title={data.title}>
      <div className="notice-row__title-row" style={{ marginBottom: '0.35rem' }}>
        {data.isImportant ? (
          <span className="notice-badge notice-badge--important">
            {t('community:notices.important')}
          </span>
        ) : null}
        {data.isPinned ? (
          <span className="notice-badge notice-badge--pinned">{t('community:notices.pinned')}</span>
        ) : null}
        <span className="notice-badge notice-badge--category">
          {t(`community:notices.categories.${data.category}`)}
        </span>
      </div>

      <div className="notice-detail__meta">
        <span>{formatNoticeDate(data.publishAt ?? data.createdAt, i18n.language)}</span>
        <span>{t('community:notices.views', { count: data.viewCount })}</span>
      </div>

      <div
        className="notice-detail__body"
        dangerouslySetInnerHTML={{ __html: sanitizeNoticeHtml(data.content) }}
      />

      {data.attachments.filter((a) => !a.isInlineImage).length > 0 ? (
        <div className="notice-detail__attachments">
          <strong>{t('community:notices.attachments')}</strong>
          {data.attachments
            .filter((a) => !a.isInlineImage)
            .map((file) => (
              <button
                key={file.id}
                type="button"
                className="btn btn--secondary"
                onClick={async () => {
                  const url = noticeApi.downloadUrl(data.id, file.id);
                  const res = await apiClient.get(url, { responseType: 'blob' });
                  const blobUrl = URL.createObjectURL(res.data as Blob);
                  const a = document.createElement('a');
                  a.href = blobUrl;
                  a.download = file.fileName;
                  a.click();
                  URL.revokeObjectURL(blobUrl);
                }}
              >
                {file.fileName}
              </button>
            ))}
        </div>
      ) : null}

      <div className="notice-detail__nav">
        {data.prevId ? (
          <Link
            className="btn btn--secondary"
            to={ROUTES.NOTICE_DETAIL.replace(':noticeId', data.prevId)}
          >
            {t('community:notices.prev')}
          </Link>
        ) : (
          <span />
        )}
        <Link className="btn btn--secondary" to={ROUTES.NOTICES}>
          {t('community:notices.backToList')}
        </Link>
        {data.nextId ? (
          <Link
            className="btn btn--secondary"
            to={ROUTES.NOTICE_DETAIL.replace(':noticeId', data.nextId)}
          >
            {t('community:notices.next')}
          </Link>
        ) : (
          <span />
        )}
      </div>
    </PageShell>
  );
}
