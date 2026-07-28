import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Role, hasExactRole, hasMinRole } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Icon } from '@/components/icons/Icon';
import { LogoutDialog } from '@/components/auth/LogoutDialog';
import { ShareAppButton } from '@/components/share/ShareAppButton/ShareAppButton';
import { WorkoutReportSection } from '@/components/my-page/WorkoutReportSection/WorkoutReportSection';
import { MemberProfileRequests } from '@/components/my-page/MemberProfileRequests/MemberProfileRequests';
import { authApi, locationApi, userApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { clearGymScope } from '@/utils/syncGymScope';
import { useCredentialsStore } from '@/store/credentials.store';
import { useUIStore } from '@/store/ui.store';
import { useActiveGym } from '@/hooks/useActiveGym';
import { resolveHomeGymName } from '@/utils/resolveHomeGymName';
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
  const updateUser = useAuthStore((s) => s.updateUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const clearCredentials = useCredentialsStore((s) => s.clearCredentials);
  const showToast = useUIStore((s) => s.showToast);
  const { activeGym, gyms } = useActiveGym();

  const [showLogout, setShowLogout] = useState(false);
  const [labExpanded, setLabExpanded] = useState(false);

  const roleCode = user?.roleCode;
  const isOwner = hasMinRole(roleCode, Role.OWNER);
  const isAdmin = hasMinRole(roleCode, Role.ADMIN);
  const isTrainer = hasMinRole(roleCode, Role.TRAINER);
  const isMember = hasMinRole(roleCode, Role.MEMBER);

  const meQuery = useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: async () => (await userApi.getMe()).data.data,
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!meQuery.data) return;
    updateUser(meQuery.data);
  }, [meQuery.data, updateUser]);

  const locationQuery = useQuery({
    queryKey: QUERY_KEYS.userLocation,
    queryFn: async () => (await locationApi.getMine()).data.data,
    enabled: Boolean(user),
    staleTime: 60_000,
  });

  const homeGymDisplay =
    resolveHomeGymName(meQuery.data ?? user, activeGym, gyms) || t('myPage.homeGymUnset');
  const locationDisplay = activeGym?.locationSet
    ? activeGym.location?.label?.path || t('location.unset')
    : locationQuery.data?.isSet
      ? locationQuery.data.label?.path || t('location.unset')
      : t('location.unset');
  const showMemberLevel = Boolean(roleCode && !hasExactRole(roleCode, Role.MEMBER));

  const handleLogout = () => {
    void authApi.logout().catch(() => undefined);
    clearCredentials();
    clearAuth();
    clearGymScope();
    setShowLogout(false);
  };

  const handleCopyEmail = async () => {
    const email = user?.email?.trim();
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      showToast(t('myPage.emailCopied'), 'success');
    } catch {
      showToast(t('myPage.emailCopyFailed'), 'error');
    }
  };

  return (
    <div className="my-page">
      <PageShell>
        <div className="card profile-card profile-card--compact">
          <dl className="profile-card__fields">
            {showMemberLevel ? (
              <div className="profile-card__pair">
                <div className="profile-card__row">
                  <dt>{t('myPage.memberId')}</dt>
                  <dd>{user?.displayName || '—'}</dd>
                </div>
                <div className="profile-card__row">
                  <dt>{t('myPage.memberLevel')}</dt>
                  <dd>{user?.roleCode || '—'}</dd>
                </div>
              </div>
            ) : (
              <div className="profile-card__row profile-card__row--full">
                <dt>{t('myPage.memberId')}</dt>
                <dd>{user?.displayName || '—'}</dd>
              </div>
            )}

            <div className="profile-card__row profile-card__row--full">
              <dt>{t('myPage.email')}</dt>
              <dd className="profile-card__email">
                {user?.email ? (
                  <>
                    <button
                      type="button"
                      className="profile-card__email-value"
                      onClick={() => void handleCopyEmail()}
                      title={t('myPage.copyEmail')}
                    >
                      {user.email}
                    </button>
                    <button
                      type="button"
                      className="profile-card__email-copy"
                      onClick={() => void handleCopyEmail()}
                      aria-label={t('myPage.copyEmail')}
                    >
                      {t('myPage.copyEmail')}
                    </button>
                  </>
                ) : (
                  '—'
                )}
              </dd>
            </div>

            <div className="profile-card__row profile-card__row--full">
              <dt>{t('myPage.location')}</dt>
              <dd>{locationDisplay}</dd>
            </div>
            <div className="profile-card__row profile-card__row--full">
              <dt>{t('myPage.homeGym')}</dt>
              <dd>{homeGymDisplay}</dd>
            </div>
          </dl>
        </div>

      {user && locationQuery.isFetched && !locationQuery.data?.isSet ? (
        <section className="my-page-section">
          <div className="card" style={{ padding: '1rem' }}>
            <h3 className="my-page-section__title" style={{ marginTop: 0 }}>
              {t('location.myPageNudgeTitle')}
            </h3>
            <p style={{ margin: '0.35rem 0 0.85rem', color: 'var(--color-text-muted)' }}>
              {t('location.myPageNudgeDesc')}
            </p>
            <Link
              to={`${ROUTES.SETTINGS}#location-settings`}
              className="btn btn--primary btn--block"
            >
              {t('myPage.locationNudgeCta')}
            </Link>
          </div>
        </section>
      ) : null}

      <MemberProfileRequests />

      <section className="my-page-section">
        <h3 className="my-page-section__title">{t('myPage.quickLinks')}</h3>
        <nav className="list-nav" aria-label={t('myPage.quickLinks')}>
          <ListNavLink to={ROUTES.LIFTER_DNA} label={t('myPage.lifterDna')} />
          <ListNavLink to={ROUTES.LIFTED_WEIGHT} label={t('myPage.liftedWeight')} />
          <ListNavLink to={ROUTES.ACHIEVEMENTS} label={t('myPage.achievements')} />
          <WorkoutReportSection />
        </nav>
      </section>

      <section className="my-page-section">
        <h3 className="my-page-section__title">{t('myPage.personalSettings')}</h3>
        <nav className="list-nav" aria-label={t('myPage.personalSettings')}>
          <ListNavLink to={ROUTES.SETTINGS} label={t('nav.settings')} />
          <ListNavLink
            to={ROUTES.MY_GYMS}
            label={t(
              isTrainer ? 'myPage.gymMemberManage' : 'myPage.gymMemberManageMember'
            )}
          />
          {isMember ? (
            <ListNavLink to={ROUTES.FRIENDS} label={t('myPage.friendsManage')} />
          ) : null}
          {isMember ? (
            <ListNavLink to={ROUTES.PUSH} label={t('myPage.pushCompose')} />
          ) : null}
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
          <ListNavLink to={ROUTES.PHOTO_BOARD} label={tc('photoBoard')} />
        </nav>
      </section>

      <section
        className={`my-page-section my-page-section--collapsible${
          labExpanded ? ' my-page-section--expanded' : ''
        }`}
      >
        <button
          type="button"
          className="my-page-section__toggle"
          onClick={() => setLabExpanded((value) => !value)}
          aria-expanded={labExpanded}
          aria-controls="my-page-lab-body"
        >
          <h3 className="my-page-section__title">{t('myPage.lab')}</h3>
          <Icon
            name="chevronDown"
            size={18}
            className={`my-page-section__chevron${labExpanded ? ' my-page-section__chevron--open' : ''}`}
            aria-hidden
          />
          <span className="visually-hidden">{labExpanded ? t('collapse') : t('expand')}</span>
        </button>
        {labExpanded ? (
          <nav id="my-page-lab-body" className="list-nav" aria-label={t('myPage.lab')}>
            <ListNavLink to={ROUTES.LIVE_DASHBOARD} label={t('myPage.liveDashboard')} />
            <ListNavLink to={ROUTES.GROWTH_TIMELINE} label={t('myPage.growthTimeline')} />
            <ListNavLink to={ROUTES.GROWTH_ANALYSIS} label={t('myPage.growthAnalysis')} />
            {isMember ? <ListNavLink to={ROUTES.ONLINE_PT} label={t('myPage.onlinePt')} /> : null}
          </nav>
        ) : null}
      </section>

      {isTrainer ? (
        <section className="my-page-section">
          <h3 className="my-page-section__title">{t('myPage.onlinePtManage')}</h3>
          <nav className="list-nav" aria-label={t('myPage.onlinePtManage')}>
            <ListNavLink to={ROUTES.ONLINE_PT_MANAGE} label={t('myPage.onlinePtManage')} />
          </nav>
        </section>
      ) : null}

      {isOwner ? (
        <section className="my-page-section">
          <h3 className="my-page-section__title">{t('myPage.ownerOnly')}</h3>
          <nav className="list-nav" aria-label={t('myPage.ownerOnly')}>
            <ListNavLink to={ROUTES.TRADE_HUB} label={t('myPage.tradeHub')} />
            <ListNavLink to={ROUTES.TRADE_REPORTS} label={t('myPage.tradeReports')} />
            <ListNavLink to={ROUTES.TRADE_STATS} label={t('myPage.tradeStats')} />
          </nav>
        </section>
      ) : null}

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
