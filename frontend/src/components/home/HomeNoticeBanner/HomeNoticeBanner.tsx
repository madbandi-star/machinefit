import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { noticeApi } from '@/api/notice.api';
import { ROUTES } from '@/constants/routes';
import '@/styles/notices.css';

export function HomeNoticeBanner() {
  const { t, i18n } = useTranslation('community');
  const { data } = useQuery({
    queryKey: ['notices', 'banner', i18n.language],
    queryFn: async () => {
      const res = await noticeApi.banner(i18n.language.slice(0, 2));
      return res.data.data;
    },
    staleTime: 60_000,
  });

  if (!data) return null;

  return (
    <div className="home-notice-banner">
      <Link
        to={ROUTES.NOTICE_DETAIL.replace(':noticeId', data.id)}
        style={{ textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}
      >
        <p className="home-notice-banner__label">{t('notices.homeBannerLabel')}</p>
        <p className="home-notice-banner__title">
          {data.isImportant ? '⚠ ' : ''}
          {data.title}
        </p>
      </Link>
      <Link to={ROUTES.NOTICES} className="btn btn--secondary">
        {t('notices.more')}
      </Link>
    </div>
  );
}
