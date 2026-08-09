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
    <Link
      to={ROUTES.NOTICE_DETAIL.replace(':noticeId', data.id)}
      className={`home-notice-banner${data.isImportant ? ' home-notice-banner--important' : ''}`}
    >
      <span className="home-notice-banner__badge">
        <Icon name="bell" size={12} aria-hidden />
        {t('notices.homeBannerLabel')}
      </span>
      <span className="home-notice-banner__title">{data.title}</span>
      <span className="home-notice-banner__go" aria-hidden>
        <Icon name="chevronRight" size={16} />
      </span>
    </Link>
  );
}
