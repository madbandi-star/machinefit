import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Icon } from '@/components/icons/Icon';
import { LogoutDialog } from '@/components/auth/LogoutDialog';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton/PwaInstallButton';
import { ShareAppButton } from '@/components/share/ShareAppButton/ShareAppButton';
import { WorkoutReportSection } from '@/components/my-page/WorkoutReportSection/WorkoutReportSection';
import { MemberProfileRequests } from '@/components/my-page/MemberProfileRequests/MemberProfileRequests';
import { useAuthStore } from '@/store/auth.store';
import { useCredentialsStore } from '@/store/credentials.store';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';
import '@/styles/community.css';

/** Hidden until gym browse is ready for My Page (set true to restore). */
const SHOW_GYMS_LINK = false;

const SHOW_MACHINE_REQUESTS_LINK = true;

function ListNavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="list-nav__item">
      {label}
      <Icon name="chevronRight" size={18} className="list-nav__chevron" />
    </Link>
  );
}

export function MyPage() {
  const { t } = useTranslation();
  const { t: tc } = useTranslation('community');
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const clearCredentials = useCredentialsStore((s) => s.clearCredentials);

  const [showLogout, setShowLogout] = useState(false);

  const isOwner = user?.roleCode === 'owner' || user?.roleCode === 'admin';
  const isAdmin = user?.roleCode === 'admin';

  const handleLogout = () => {
    clearCredentials();
    clearAuth();
    setShowLogout(false);
  };

  return (
    <div className="my-page">
      <PageShell
        title={t('nav.myPage')}
        action={<PwaInstallButton />}
      >
        <div className="card profile-card">
          <p className="profile-card__identity">
            <strong className="profile-card__name">{user?.displayName}</strong>
            {user?.email ? (
              <>
                <span className="profile-card__sep" aria-hidden>
                  ·
                </span>
                <span className="profile-card__email">{user.email}</span>
              </>
            ) : null}
            {user?.roleCode ? (
              <>
                <span className="profile-card__sep" aria-hidden>
                  ·
                </span>
                <span className="profile-card__role">{user.roleCode}</span>
              </>
            ) : null}
          </p>
        </div>

      <section className="my-page-section">
        <WorkoutReportSection />
      </section>

      <MemberProfileRequests />

      <section className="my-page-section">
        <h3 className="my-page-section__title">{t('myPage.quickLinks')}</h3>
        <nav className="list-nav" aria-label={t('myPage.quickLinks')}>
          <ListNavLink to={ROUTES.SETTINGS} label={t('nav.settings')} />
          <ListNavLink to={ROUTES.NOTIFICATIONS} label={t('nav.notifications')} />
        </nav>
      </section>

      <section className="my-page-section">
        <h3 className="my-page-section__title">{t('myPage.explore')}</h3>
        <nav className="list-nav" aria-label={t('myPage.explore')}>
          {SHOW_GYMS_LINK && <ListNavLink to={ROUTES.GYMS} label={t('nav.gyms')} />}
          {SHOW_MACHINE_REQUESTS_LINK && (
            <ListNavLink to={ROUTES.MACHINE_REQUESTS} label={tc('machineRequests')} />
          )}
          <ListNavLink to={ROUTES.FREE_BOARD} label={tc('freeBoard')} />
        </nav>
      </section>

      <div className="my-page__actions">
        <ShareAppButton />
        {isAdmin && (
          <Link to={ROUTES.ADMIN} className="btn btn--primary btn--block">
            {t('myPage.adminDashboard')}
          </Link>
        )}
        {isOwner && !isAdmin && (
          <Link to={ROUTES.OWNER} className="btn btn--primary btn--block">
            {tc('ownerDashboard')}
          </Link>
        )}
        {!isOwner && (
          <Link to={ROUTES.OWNER_APPLY} className="btn btn--primary btn--block">
            {tc('applyOwner')}
          </Link>
        )}
        <button type="button" className="btn btn--secondary btn--block" onClick={() => setShowLogout(true)}>
          {t('nav.logout')}
        </button>
      </div>
      <LogoutDialog
        open={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
      />
      </PageShell>
    </div>
  );
}
