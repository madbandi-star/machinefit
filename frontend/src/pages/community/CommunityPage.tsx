import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Role, hasMinRole } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { BannerSlot } from '@/components/banners/BannerSlot/BannerSlot';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import '@/styles/components.css';
import '@/styles/community.css';

export function CommunityPage() {
  const { t } = useTranslation();
  const { t: tc } = useTranslation('community');
  const roleCode = useAuthStore((s) => s.user?.roleCode);
  /** Hidden for plain `member`; visible for premium_member and above. */
  const showPhotoBoard = hasMinRole(roleCode, Role.PREMIUM_MEMBER);

  return (
    <PageShell title={t('nav.community')} subtitle="Connect with the MachineFit community">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
      </div>
      <BannerSlot slot="COMMUNITY_BOTTOM" />
    </PageShell>
  );
}
