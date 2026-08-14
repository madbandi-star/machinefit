import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FREE_OPEN_MEMBER_FEATURES_MIN_ROLE, Role, hasExactRole, hasMinRole } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Icon, type IconName } from '@/components/icons/Icon';
import { LogoutDialog } from '@/components/auth/LogoutDialog';
import { ShareAppButton } from '@/components/share/ShareAppButton/ShareAppButton';
import { WorkoutReportSection } from '@/components/my-page/WorkoutReportSection/WorkoutReportSection';
import { WorkoutMonthCalendar } from '@/components/my-page/WorkoutMonthCalendar/WorkoutMonthCalendar';
import { BannerSlot } from '@/components/banners/BannerSlot/BannerSlot';
import { MemberProfileRequests } from '@/components/my-page/MemberProfileRequests/MemberProfileRequests';
import { MemberIdEditor } from '@/components/my-page/MemberIdEditor/MemberIdEditor';
import { PowerBox } from '@/components/my-page/PowerBox/PowerBox';
import { locationApi, userApi, authApi } from '@/api';
import { pointsApi } from '@/api/points.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useActiveGym } from '@/hooks/useActiveGym';
import { resolveHomeGymName } from '@/utils/resolveHomeGymName';
import { clearLocalSession } from '@/utils/performLogout';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';
import '@/styles/community.css';

/** Hidden until gym browse is ready for My Page (set true to restore). */
const SHOW_GYMS_LINK = false;

const SHOW_MACHINE_REQUESTS_LINK = true;

function ListNavLink({ to, label, icon }: { to: string; label: string; icon: IconName }) {
  return (
    <Link to={to} className="list-nav__item">
      <Icon name={icon} size={22} className="list-nav__icon" aria-hidden />
      <span className="list-nav__label">{label}</span>
      <Icon name="chevronRight" size={18} className="list-nav__chevron" aria-hidden />
    </Link>
  );
}

export function MyPage() {
  const { t } = useTranslation();
  const { t: tc } = useTranslation('community');
  const { t: tf } = useTranslation('fortune');
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const showToast = useUIStore((s) => s.showToast);
  const { activeGym, gyms } = useActiveGym();

  const [showLogout, setShowLogout] = useState(false);
  const [labExpanded, setLabExpanded] = useState(true);

  const roleCode = user?.roleCode;
  const isOwner = hasMinRole(roleCode, Role.OWNER);
  const isAdmin = hasMinRole(roleCode, Role.ADMIN);
  const isTrainer = hasMinRole(roleCode, Role.TRAINER);
  /** Hidden for plain `member`; visible for premium_member and above. */
  const showAboveMember = hasMinRole(roleCode, Role.PREMIUM_MEMBER);
  const showPhotoBoardAndBackup = hasMinRole(
    roleCode,
    FREE_OPEN_MEMBER_FEATURES_MIN_ROLE
  );

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

  const pointsQuery = useQuery({
    queryKey: QUERY_KEYS.pointsBalance,
    queryFn: async () => (await pointsApi.getMine()).data.data,
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  useEffect(() => {
    const balance = pointsQuery.data?.balance;
    if (balance == null || !user?.id) return;
    const key = `mf-points-balance:${user.id}`;
    try {
      const prevRaw = sessionStorage.getItem(key);
      const prev = prevRaw == null ? null : Number(prevRaw);
      if (prev != null && Number.isFinite(prev) && balance > prev) {
        const delta = balance - prev;
        showToast(t('points.earnedToast', { points: delta }), 'success');
      }
      sessionStorage.setItem(key, String(balance));
    } catch {
      /* ignore storage */
    }
  }, [pointsQuery.data?.balance, showToast, t, user?.id]);

  const homeGymDisplay =
    resolveHomeGymName(meQuery.data ?? user, activeGym, gyms) || t('myPage.homeGymUnset');
  const locationDisplay = activeGym?.locationSet
    ? activeGym.location?.label?.path || t('location.unset')
    : locationQuery.data?.isSet
      ? locationQuery.data.label?.path || t('location.unset')
      : t('location.unset');
  const showMemberLevel = Boolean(roleCode && !hasExactRole(roleCode, Role.MEMBER));

  const handleLogout = () => {
    setShowLogout(false);
    // Clear local session + go home in the same turn so AuthGuard cannot
    // bounce /my-page → /login → /home (that flash loop felt like flicker).
    void authApi.logout().catch(() => undefined);
    clearLocalSession();
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <div className="my-page">
      <PageShell>
        <div className="card profile-card profile-card--compact">
          <dl className="profile-card__fields">
            <div className="profile-card__row profile-card__row--full">
              <dt>{t('myPage.memberId')}</dt>
              <MemberIdEditor displayName={user?.displayName ?? ''} />
            </div>
            {showMemberLevel ? (
              <div className="profile-card__row profile-card__row--full">
                <dt>{t('myPage.memberLevel')}</dt>
                <dd>{user?.roleCode || '—'}</dd>
              </div>
            ) : null}

            <div className="profile-card__row profile-card__row--full">
              <dt>{t('myPage.location')}</dt>
              <dd>{locationDisplay}</dd>
            </div>
            <div className="profile-card__row profile-card__row--full">
              <dt>{t('myPage.homeGym')}</dt>
              <dd>{homeGymDisplay}</dd>
            </div>
            <div className="profile-card__row profile-card__row--full profile-card__row--power">
              <dt>{t('points.myPoints')}</dt>
              <dd className="profile-card__power-dd">
                <Link to={ROUTES.POINTS} className="profile-card__email-value profile-card__power-link">
                  {(pointsQuery.data?.balance ?? 0).toLocaleString()}
                  {t('points.unit')}
                </Link>
                <PowerBox />
              </dd>
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

      <WorkoutMonthCalendar />

      <section className="my-page-section">
        <h3 className="my-page-section__title">{t('myPage.quickLinks')}</h3>
        <nav className="list-nav" aria-label={t('myPage.quickLinks')}>
          <ListNavLink to={ROUTES.FORTUNE_TODAY} label={tf('title')} icon="flame" />
          <ListNavLink to={ROUTES.LIFTER_DNA} label={t('myPage.lifterDna')} icon="dna" />
          {showAboveMember ? (
            <>
              <ListNavLink
                to={ROUTES.LIFTED_WEIGHT}
                label={t('myPage.liftedWeight')}
                icon="weightStack"
              />
              <ListNavLink
                to={ROUTES.ACHIEVEMENTS}
                label={t('myPage.achievements')}
                icon="trophy"
              />
              <WorkoutReportSection />
            </>
          ) : null}
        </nav>
      </section>

      <section className="my-page-section">
        <h3 className="my-page-section__title">{t('myPage.explore')}</h3>
        <nav className="list-nav" aria-label={t('myPage.explore')}>
          {SHOW_GYMS_LINK && (
            <ListNavLink to={ROUTES.GYMS} label={t('nav.gyms')} icon="mapPin" />
          )}
          {SHOW_MACHINE_REQUESTS_LINK && (
            <ListNavLink
              to={ROUTES.MACHINE_REQUESTS}
              label={tc('machineRequests')}
              icon="dumbbell"
            />
          )}
          <ListNavLink to={ROUTES.FREE_BOARD} label={tc('freeBoard')} icon="message" />
          {showPhotoBoardAndBackup ? (
            <ListNavLink to={ROUTES.PHOTO_BOARD} label={tc('photoBoard')} icon="camera" />
          ) : null}
          <ListNavLink
            to={ROUTES.TEMPLATE_SHARE}
            label={tc('templateShare.title')}
            icon="share"
          />
        </nav>
      </section>

      <section className="my-page-section">
        <h3 className="my-page-section__title">{t('myPage.personalSettings')}</h3>
        <nav className="list-nav" aria-label={t('myPage.personalSettings')}>
          <ListNavLink
            to={ROUTES.MY_TEMPLATES}
            label={tc('templateShare.myTemplates')}
            icon="history"
          />
          <ListNavLink
            to={ROUTES.POINTS}
            label={t('points.myPoints')}
            icon="trendingUp"
          />
          <ListNavLink to={ROUTES.SETTINGS} label={t('nav.settings')} icon="sliders" />
          {showAboveMember ? (
            <ListNavLink
              to={ROUTES.MY_GYMS}
              label={t(
                isTrainer ? 'myPage.gymMemberManage' : 'myPage.gymMemberManageMember'
              )}
              icon="building"
            />
          ) : null}
          {showAboveMember ? (
            <ListNavLink to={ROUTES.FRIENDS} label={t('myPage.friendsManage')} icon="users" />
          ) : null}
          {showAboveMember ? (
            <ListNavLink to={ROUTES.PUSH} label={t('myPage.pushCompose')} icon="bell" />
          ) : null}
        </nav>
      </section>

      <section className="my-page-section">
        <h3 className="my-page-section__title">{t('myPage.customerCenter')}</h3>
        <nav className="list-nav" aria-label={t('myPage.customerCenter')}>
          <ListNavLink to={ROUTES.QA} label={t('myPage.qa')} icon="message" />
          <ListNavLink
            to={ROUTES.PRIVACY_RIGHTS}
            label={t('compliance.rights.title')}
            icon="shield"
          />
        </nav>
      </section>

      {showAboveMember ? (
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
              <ListNavLink
                to={ROUTES.LIVE_DASHBOARD}
                label={t('myPage.liveDashboard')}
                icon="monitor"
              />
              <ListNavLink
                to={ROUTES.GROWTH_TIMELINE}
                label={t('myPage.growthTimeline')}
                icon="calendar"
              />
              <ListNavLink
                to={ROUTES.GROWTH_ANALYSIS}
                label={t('myPage.growthAnalysis')}
                icon="growthAnalysis"
              />
              <ListNavLink to={ROUTES.ONLINE_PT} label={t('myPage.onlinePt')} icon="user" />
            </nav>
          ) : null}
        </section>
      ) : null}

      {isTrainer ? (
        <section className="my-page-section">
          <h3 className="my-page-section__title">{t('myPage.onlinePtManage')}</h3>
          <nav className="list-nav" aria-label={t('myPage.onlinePtManage')}>
            <ListNavLink
              to={ROUTES.ONLINE_PT_MANAGE}
              label={t('myPage.onlinePtManage')}
              icon="shield"
            />
          </nav>
        </section>
      ) : null}

      {isOwner ? (
        <section className="my-page-section">
          <h3 className="my-page-section__title">{t('myPage.ownerOnly')}</h3>
          <nav className="list-nav" aria-label={t('myPage.ownerOnly')}>
            <ListNavLink to={ROUTES.TRADE_HUB} label={t('myPage.tradeHub')} icon="store" />
            <ListNavLink to={ROUTES.TRADE_REPORTS} label={t('myPage.tradeReports')} icon="flag" />
            <ListNavLink to={ROUTES.TRADE_STATS} label={t('myPage.tradeStats')} icon="trendingUp" />
          </nav>
        </section>
      ) : null}

      {isAdmin ? (
        <section className="my-page-section">
          <h3 className="my-page-section__title">{t('myPage.adminTools')}</h3>
          <nav className="list-nav" aria-label={t('myPage.adminTools')}>
            <ListNavLink
              to={ROUTES.ADMIN}
              label={t('myPage.adminDashboard')}
              icon="shield"
            />
          </nav>
        </section>
      ) : null}

      <BannerSlot slot="MY_BOTTOM" />

      <div className="my-page__actions">
        <ShareAppButton />
        {isOwner && !isAdmin && (
          <Link to={ROUTES.OWNER} className="btn btn--primary btn--block">
            {tc('ownerDashboard')}
          </Link>
        )}
        {showAboveMember && !isOwner && (
          <div className="my-page__cta">
            <Link to={ROUTES.OWNER_APPLY} className="btn btn--primary btn--block">
              {tc('applyOwner')}
            </Link>
            <p className="my-page__cta-desc">{tc('applyOwnerDesc')}</p>
          </div>
        )}
        {showAboveMember && !isTrainer && (
          <div className="my-page__cta">
            <Link to={ROUTES.TRAINER_APPLY} className="btn btn--primary btn--block">
              {tc('applyTrainer')}
            </Link>
            <p className="my-page__cta-desc">{tc('applyTrainerDesc')}</p>
          </div>
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
