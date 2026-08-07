import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
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
    <div
      className={`home-notice-banner${data.isImportant ? ' home-notice-banner--important' : ''}`}
    >
      <Link
        to={ROUTES.NOTICE_DETAIL.replace(':noticeId', data.id)}
        className="home-notice-banner__main"
      >
        <span className="home-notice-banner__icon" aria-hidden>
          <Icon name="bell" size={18} />
        </span>
        <span className="home-notice-banner__copy">
          <p className="home-notice-banner__label">{t('notices.homeBannerLabel')}</p>
          <p className="home-notice-banner__title">{data.title}</p>
        </span>
      </Link>
      <Link to={ROUTES.NOTICES} className="home-notice-banner__more">
        {t('notices.more')}
      </Link>
    </div>
  );
}
