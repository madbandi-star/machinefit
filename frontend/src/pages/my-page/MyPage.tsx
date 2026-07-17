import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Icon } from '@/components/icons/Icon';
import { LogoutDialog } from '@/components/auth/LogoutDialog';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton/PwaInstallButton';
import { useAuthStore } from '@/store/auth.store';
import { useCredentialsStore } from '@/store/credentials.store';
// import { ownerApi } from '@/api';
import { ROUTES } from '@/constants/routes';
// import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import '@/styles/community.css';

/** TODO: restore when gym browse link returns to My Page */
const SHOW_GYMS_LINK = false;

/** TODO: restore when machine request board returns to My Page */
const SHOW_MACHINE_REQUESTS_LINK = false;

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
  // const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const clearCredentials = useCredentialsStore((s) => s.clearCredentials);
  // const showToast = useUIStore((s) => s.showToast);

  // const [showApply, setShowApply] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  // const [businessName, setBusinessName] = useState('');
  // const [applying, setApplying] = useState(false);

  // const isOwner = user?.roleCode === 'owner' || user?.roleCode === 'admin';
  const isAdmin = user?.roleCode === 'admin';

  /*
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !user) return;
    setApplying(true);
    try {
      const res = await ownerApi.apply({ businessName });
      const { tokens } = res.data.data;
      if (tokens && user) {
        setAuth({ ...user, roleCode: 'owner' }, tokens);
      }
      showToast(tc('ownerApproved'), 'success');
      setShowApply(false);
    } catch {
      showToast(tc('errorGeneric'), 'error');
    } finally {
      setApplying(false);
    }
  };
  */

  const handleLogout = () => {
    clearCredentials();
    clearAuth();
    setShowLogout(false);
  };

  return (
    <div className="my-page">
      <PageShell title={t('nav.myPage')} action={<PwaInstallButton />}>
        <div className="card profile-card">
          <div className="profile-card__identity">
            <h2 className="profile-card__name">{user?.displayName}</h2>
            {user?.email ? (
              <>
                <span className="profile-card__sep" aria-hidden>
                  ·
                </span>
                <span className="profile-card__email">{user.email}</span>
              </>
            ) : null}
          </div>
          <p className="profile-card__meta">
            {t('myPage.role')}: {user?.roleCode}
          </p>
        </div>

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
          <ListNavLink to={ROUTES.BRANDS} label={t('myPage.browseByBrand')} />
          {SHOW_MACHINE_REQUESTS_LINK && (
            <ListNavLink to={ROUTES.MACHINE_REQUESTS} label={tc('machineRequests')} />
          )}
          <ListNavLink to={ROUTES.FREE_BOARD} label={tc('freeBoard')} />
          <ListNavLink to={ROUTES.GROWTH_ANALYSIS} label={t('myPage.growthAnalysis')} />
        </nav>
      </section>

      <div className="my-page__actions">
        {isAdmin && (
          <Link to={ROUTES.ADMIN} className="btn btn--primary btn--block">
            {t('myPage.adminDashboard')}
          </Link>
        )}
        {/* TODO(owner): set SHOW_OWNER_MENU true and restore block below
        {isOwner && !isAdmin && (
          <Link to={ROUTES.OWNER} className="btn btn--primary btn--block">
            {tc('ownerDashboard')}
          </Link>
        )}
        {!isOwner && (
          <>
            <button type="button" className="btn btn--primary btn--block" onClick={() => setShowApply(!showApply)}>
              {tc('applyOwner')}
            </button>
            {showApply && (
              <form className="card" onSubmit={handleApply}>
                <p className="form-section__desc">{tc('applyOwnerDesc')}</p>
                <div className="form-row">
                  <label htmlFor="biz-name">{tc('businessName')}</label>
                  <input
                    id="biz-name"
                    className="input"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn--primary btn--block" disabled={applying}>
                  {applying ? <span className="btn__spinner" aria-hidden /> : tc('submit')}
                </button>
              </form>
            )}
          </>
        )}
        */}
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
