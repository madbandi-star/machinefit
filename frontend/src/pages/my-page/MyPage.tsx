import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { LogoutDialog } from '@/components/auth/LogoutDialog';
import { useAuthStore } from '@/store/auth.store';
import { useCredentialsStore } from '@/store/credentials.store';
import { ownerApi } from '@/api';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import '@/styles/community.css';

export function MyPage() {
  const { t } = useTranslation();
  const { t: tc } = useTranslation('community');
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const clearCredentials = useCredentialsStore((s) => s.clearCredentials);
  const showToast = useUIStore((s) => s.showToast);

  const [showApply, setShowApply] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [applying, setApplying] = useState(false);

  const isOwner = user?.roleCode === 'owner' || user?.roleCode === 'admin';
  const isAdmin = user?.roleCode === 'admin';

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

  const handleLogout = () => {
    clearCredentials();
    clearAuth();
    setShowLogout(false);
  };

  return (
    <PageShell title={t('nav.myPage')} subtitle={user?.email}>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>{user?.displayName}</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          {t('myPage.role')}: {user?.roleCode}
        </p>
      </div>

      <section style={{ marginBottom: '1.5rem' }}>
        <h3 className="form-section__title" style={{ marginBottom: '0.75rem' }}>
          {t('myPage.quickLinks')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to={`${ROUTES.RECORDS}?tab=history`} className="btn btn--secondary btn--block">
            {t('nav.records')}
          </Link>
          <Link to={ROUTES.SETTINGS} className="btn btn--secondary btn--block">
            {t('nav.settings')}
          </Link>
          <Link to={ROUTES.NOTIFICATIONS} className="btn btn--secondary btn--block">
            {t('nav.notifications')}
          </Link>
        </div>
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h3 className="form-section__title" style={{ marginBottom: '0.75rem' }}>
          {t('myPage.explore')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to={ROUTES.GYMS} className="btn btn--secondary btn--block">
            {t('nav.gyms')}
          </Link>
          <Link to={ROUTES.COMMUNITY} className="btn btn--secondary btn--block">
            {t('nav.community')}
          </Link>
          <Link to={ROUTES.BRANDS} className="btn btn--secondary btn--block">
            {t('nav.brands')}
          </Link>
        </div>
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
          <>
            <button className="btn btn--primary btn--block" onClick={() => setShowApply(!showApply)}>
              {tc('applyOwner')}
            </button>
            {showApply && (
              <form className="card" onSubmit={handleApply}>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                  {tc('applyOwnerDesc')}
                </p>
                <div className="form-row">
                  <label htmlFor="biz-name">{tc('businessName')}</label>
                  <input
                    id="biz-name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn--primary btn--block" disabled={applying}>
                  {tc('submit')}
                </button>
              </form>
            )}
          </>
        )}
        <button className="btn btn--secondary btn--block" onClick={() => setShowLogout(true)}>
          {t('nav.logout')}
        </button>
      </div>
      <LogoutDialog
        open={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
      />
    </PageShell>
  );
}
