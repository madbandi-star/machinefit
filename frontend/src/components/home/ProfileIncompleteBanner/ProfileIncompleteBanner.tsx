import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants/routes';
import { isHeightMissing } from '@/utils/profileCompleteness';
import '@/styles/home.css';

export function ProfileIncompleteBanner() {
  const { t } = useTranslation();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  if (!isHeightMissing(user)) return null;

  return (
    <div className="profile-incomplete-banner" role="status">
      <div className="profile-incomplete-banner__text">
        <strong>{t('pages.home.profileIncomplete')}</strong>
        {t('auth.profileRequiredForRecommend')}
      </div>
      <Link
        to={ROUTES.SETTINGS}
        state={{ returnTo: location.pathname }}
        className="btn btn--primary"
        style={{ flexShrink: 0 }}
      >
        {t('pages.home.completeProfile')}
      </Link>
    </div>
  );
}
