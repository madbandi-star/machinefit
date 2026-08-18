import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FREE_OPEN_MEMBER_FEATURES_MIN_ROLE, hasMinRole } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { CommunityBottomBanner } from '@/components/community/CommunityBottomBanner';
import { Icon, type IconName } from '@/components/icons/Icon';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import '@/styles/components.css';
import '@/styles/community.css';

export function CommunityPage() {
  const { t } = useTranslation();
  const { t: tc } = useTranslation('community');
  const roleCode = useAuthStore((s) => s.user?.roleCode);
  const showPhotoBoard = hasMinRole(roleCode, FREE_OPEN_MEMBER_FEATURES_MIN_ROLE);

  const links: Array<{
    to: string;
    title: string;
    desc: string;
    icon: IconName;
  }> = [
    {
      to: ROUTES.MACHINE_REQUESTS,
      title: tc('machineRequests'),
      desc: tc('machineRequestsSubtitle'),
      icon: 'dumbbell',
    },
    {
      to: ROUTES.NOTICES,
      title: tc('notices.title'),
      desc: tc('notices.subtitle'),
      icon: 'flag',
    },
    {
      to: ROUTES.FREE_BOARD,
      title: tc('freeBoard'),
      desc: tc('freeBoardSubtitle'),
      icon: 'message',
    },
    {
      to: ROUTES.TEMPLATE_SHARE,
      title: tc('templateShare.title'),
      desc: tc('templateShare.subtitle'),
      icon: 'records',
    },
  ];

  if (showPhotoBoard) {
    links.push(
      {
        to: ROUTES.PHOTO_BOARD,
        title: tc('photoBoard'),
        desc: tc('photoBoardSubtitle'),
        icon: 'camera',
      },
      {
        to: ROUTES.MACHINE_SHOWCASE,
        title: tc('showcase.title'),
        desc: tc('showcase.subtitle'),
        icon: 'machines',
      }
    );
  }

  return (
    <PageShell
      title={
        <span className="page-hero-title">
          <span className="page-hero-title__icon" aria-hidden>
            <Icon name="users" size={18} />
          </span>
          {t('nav.community')}
        </span>
      }
      subtitle={tc('hubSubtitle')}
    >
      <div className="community-hub">
        <div className="community-hub__links">
          {links.map((item) => (
            <Link key={item.to} to={item.to} className="card card--interactive community-link-card">
              <span className="community-link-card__icon" aria-hidden>
                <Icon name={item.icon} size={20} />
              </span>
              <span className="community-link-card__copy">
                <strong>{item.title}</strong>
                <p className="community-link-card__desc">{item.desc}</p>
              </span>
              <Icon name="chevronRight" size={18} className="community-link-card__chevron" aria-hidden />
            </Link>
          ))}
        </div>
        <CommunityBottomBanner />
      </div>
    </PageShell>
  );
}
