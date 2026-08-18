import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FREE_OPEN_MEMBER_FEATURES_MIN_ROLE, hasMinRole } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { CommunityBottomBanner } from '@/components/community/CommunityBottomBanner';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import '@/styles/components.css';
import '@/styles/community.css';

export function CommunityPage() {
  const { t } = useTranslation();
  const { t: tc } = useTranslation('community');
  const roleCode = useAuthStore((s) => s.user?.roleCode);
  const showPhotoBoard = hasMinRole(roleCode, FREE_OPEN_MEMBER_FEATURES_MIN_ROLE);

  return (
    <PageShell title={t('nav.community')} subtitle={tc('hubSubtitle')}>
      <div className="community-hub">
        <div className="community-hub__links">
          <Link to={ROUTES.MACHINE_REQUESTS} className="card card--interactive community-link-card">
            <strong>{tc('machineRequests')}</strong>
            <p className="community-link-card__desc">{tc('machineRequestsSubtitle')}</p>
          </Link>
          <Link to={ROUTES.NOTICES} className="card card--interactive community-link-card">
            <strong>{tc('notices.title')}</strong>
            <p className="community-link-card__desc">{tc('notices.subtitle')}</p>
          </Link>
          <Link to={ROUTES.FREE_BOARD} className="card card--interactive community-link-card">
            <strong>{tc('freeBoard')}</strong>
            <p className="community-link-card__desc">{tc('freeBoardSubtitle')}</p>
          </Link>
          <Link to={ROUTES.TEMPLATE_SHARE} className="card card--interactive community-link-card">
            <strong>{tc('templateShare.title')}</strong>
            <p className="community-link-card__desc">{tc('templateShare.subtitle')}</p>
          </Link>
          {showPhotoBoard ? (
            <Link to={ROUTES.PHOTO_BOARD} className="card card--interactive community-link-card">
              <strong>{tc('photoBoard')}</strong>
              <p className="community-link-card__desc">{tc('photoBoardSubtitle')}</p>
            </Link>
          ) : null}
          {showPhotoBoard ? (
            <Link to={ROUTES.MACHINE_SHOWCASE} className="card card--interactive community-link-card">
              <strong>{tc('showcase.title')}</strong>
              <p className="community-link-card__desc">{tc('showcase.subtitle')}</p>
            </Link>
          ) : null}
        </div>
        <CommunityBottomBanner />
      </div>
    </PageShell>
  );
}
