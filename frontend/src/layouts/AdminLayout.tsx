import { useEffect, useId, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/components/icons/Icon';
import { ROUTES } from '@/constants/routes';
import '@/styles/admin.css';

type AdminNavItem = {
  to: string;
  labelKey: string;
  end?: boolean;
  icon: IconName;
};

type AdminNavGroup = {
  id: string;
  labelKey: string;
  items: AdminNavItem[];
};

/** Display grouping only — routes/permissions unchanged. */
const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'overview',
    labelKey: 'navGroup.overview',
    items: [
      { to: ROUTES.ADMIN, labelKey: 'navHome', end: true, icon: 'home' },
      { to: ROUTES.ADMIN_OPS, labelKey: 'ops.nav', icon: 'monitor' },
      { to: ROUTES.ADMIN_BACKUP, labelKey: 'backup.nav', icon: 'history' },
    ],
  },
  {
    id: 'members',
    labelKey: 'navGroup.members',
    items: [
      { to: ROUTES.ADMIN_USERS, labelKey: 'users', icon: 'users' },
      { to: ROUTES.ADMIN_SUBSCRIPTIONS, labelKey: 'subscriptions.nav', icon: 'circleCheck' },
      { to: ROUTES.ADMIN_GYMS, labelKey: 'gyms', icon: 'building' },
      { to: ROUTES.ADMIN_OWNER_APPLICATIONS, labelKey: 'ownerApplications.nav', icon: 'store' },
      { to: ROUTES.ADMIN_TRAINER_APPLICATIONS, labelKey: 'trainerApplications.nav', icon: 'users' },
    ],
  },
  {
    id: 'catalog',
    labelKey: 'navGroup.catalog',
    items: [
      { to: ROUTES.ADMIN_BRANDS, labelKey: 'brands.nav', icon: 'flag' },
      { to: ROUTES.ADMIN_MACHINES, labelKey: 'machines', icon: 'machines' },
      { to: ROUTES.ADMIN_MACHINE_REQUESTS, labelKey: 'machineRequests.nav', icon: 'message' },
      { to: ROUTES.ADMIN_MACHINE_TIPS, labelKey: 'machineTips.nav', icon: 'pencil' },
      { to: ROUTES.ADMIN_LOCATIONS, labelKey: 'locations.nav', icon: 'mapPin' },
      { to: ROUTES.ADMIN_MOTIVATION, labelKey: 'motivation.nav', icon: 'flame' },
      { to: ROUTES.ADMIN_MUSCLE_IMAGES, labelKey: 'muscleImages.nav', icon: 'bodyweight' },
      { to: ROUTES.ADMIN_MACHINE_COVERS, labelKey: 'machineCovers.nav', icon: 'camera' },
    ],
  },
  {
    id: 'ads',
    labelKey: 'navGroup.ads',
    items: [
      { to: ROUTES.ADMIN_BANNERS, labelKey: 'banners.navList', end: true, icon: 'flag' },
      { to: ROUTES.ADMIN_BANNER_NEW, labelKey: 'banners.navCreate', icon: 'pencil' },
      { to: ROUTES.ADMIN_BANNER_SLOTS, labelKey: 'banners.navSlots', icon: 'mapPin' },
      { to: ROUTES.ADMIN_BANNER_STATS, labelKey: 'banners.navStats', icon: 'monitor' },
    ],
  },
  {
    id: 'community',
    labelKey: 'navGroup.community',
    items: [
      { to: ROUTES.ADMIN_MODERATION, labelKey: 'moderation', icon: 'shield' },
      { to: ROUTES.ADMIN_COMPLIANCE, labelKey: 'compliance.nav', icon: 'circleCheck' },
      {
        to: ROUTES.ADMIN_PRIVACY_RIGHTS,
        labelKey: 'compliance.rights.admin.nav',
        icon: 'shield',
      },
      { to: ROUTES.ADMIN_PHOTO_BOARD, labelKey: 'photoBoard.nav', icon: 'camera' },
      { to: ROUTES.ADMIN_TEMPLATE_SHARE, labelKey: 'templateShare.nav', icon: 'dumbbell' },
      { to: ROUTES.ADMIN_NOTICES, labelKey: 'notices.nav', icon: 'bell' },
      { to: ROUTES.ADMIN_FORTUNE, labelKey: 'fortuneAdmin.nav', icon: 'flame' },
      { to: ROUTES.ADMIN_TRADES, labelKey: 'trades.nav', icon: 'store' },
      { to: ROUTES.ADMIN_ONLINE_PT, labelKey: 'onlinePt.nav', icon: 'dumbbell' },
      { to: ROUTES.ADMIN_PUSH, labelKey: 'push.nav', icon: 'bell' },
      { to: ROUTES.ADMIN_FRIENDS, labelKey: 'friends.nav', icon: 'users' },
    ],
  },
  {
    id: 'ops-usage',
    labelKey: 'navGroup.opsUsage',
    items: [
      { to: ROUTES.ADMIN_USAGE_STATS, labelKey: 'usage.navStats', icon: 'monitor' },
      { to: ROUTES.ADMIN_USAGE_USERS, labelKey: 'usage.navUsers', icon: 'users' },
      { to: ROUTES.ADMIN_USAGE_POLICIES, labelKey: 'usage.navPolicies', icon: 'shield' },
      {
        to: ROUTES.ADMIN_USAGE_POLICY_HISTORY,
        labelKey: 'usage.navHistory',
        icon: 'history',
      },
      { to: ROUTES.ADMIN_POINTS_POLICIES, labelKey: 'points.navPolicies', icon: 'trendingUp' },
      { to: ROUTES.ADMIN_POINTS_USERS, labelKey: 'points.navUsers', icon: 'users' },
    ],
  },
  {
    id: 'data',
    labelKey: 'navGroup.data',
    items: [
      {
        to: ROUTES.ADMIN_DATA_RETENTION,
        labelKey: 'dataRetention.nav',
        icon: 'shield',
        end: true,
      },
      {
        to: ROUTES.ADMIN_DATA_RETENTION_SCHEDULED,
        labelKey: 'dataRetention.navScheduled',
        icon: 'history',
      },
      {
        to: ROUTES.ADMIN_DATA_RETENTION_LOGS,
        labelKey: 'dataRetention.navLogs',
        icon: 'monitor',
      },
      {
        to: ROUTES.ADMIN_DATA_RETENTION_AUDIT,
        labelKey: 'dataRetention.navAudit',
        icon: 'circleCheck',
      },
    ],
  },
];

function AdminNavLinks({
  onNavigate,
  idPrefix,
}: {
  onNavigate?: () => void;
  idPrefix: string;
}) {
  const { t } = useTranslation('admin');

  return (
    <>
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.id} className="admin-shell__nav-group">
          <p className="admin-shell__nav-group-label" id={`${idPrefix}-${group.id}`}>
            {t(group.labelKey)}
          </p>
          <ul className="admin-shell__nav-list" aria-labelledby={`${idPrefix}-${group.id}`}>
            {group.items.map(({ to, labelKey, end, icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `admin-shell__nav-link${isActive ? ' is-active' : ''}`
                  }
                  onClick={onNavigate}
                >
                  <Icon name={icon} size={16} className="admin-shell__nav-icon" aria-hidden />
                  <span className="admin-shell__nav-text">{t(labelKey)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

export function AdminLayout() {
  const { t } = useTranslation('admin');
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const drawerTitleId = useId();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen]);

  return (
    <div className={`admin-shell${mobileNavOpen ? ' admin-shell--nav-open' : ''}`}>
      <aside className="admin-shell__sidebar" aria-label={t('shellTitle')}>
        <div className="admin-shell__sidebar-brand">
          <Link to={ROUTES.ADMIN} className="admin-shell__brand-link">
            <strong>{t('shellTitle')}</strong>
            <span className="admin-shell__brand-sub">{t('shellSubtitle')}</span>
          </Link>
        </div>
        <nav className="admin-shell__sidebar-nav">
          <AdminNavLinks idPrefix="admin-side" />
        </nav>
        <div className="admin-shell__sidebar-foot">
          <Link to={ROUTES.MY_PAGE} className="admin-shell__back">
            <span aria-hidden="true">←</span>
            {t('backToMyPage')}
          </Link>
        </div>
      </aside>

      <div className="admin-shell__frame">
        <header className="admin-shell__top">
          <button
            type="button"
            className="admin-shell__menu-btn"
            aria-expanded={mobileNavOpen}
            aria-controls="admin-mobile-drawer"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <span className="admin-shell__menu-glyph" aria-hidden="true">
              {mobileNavOpen ? '×' : '☰'}
            </span>
            <span>{t('navMenu')}</span>
          </button>

          <div className="admin-shell__brand admin-shell__brand--header">
            <strong>{t('shellTitle')}</strong>
            <span className="admin-shell__brand-sub">{t('shellSubtitle')}</span>
          </div>

          <Link to={ROUTES.MY_PAGE} className="admin-shell__back admin-shell__back--header">
            <span aria-hidden="true">←</span>
            {t('backToMyPage')}
          </Link>
        </header>

        <main className="admin-shell__main">
          <div className="admin-shell__content">
            <Outlet />
          </div>
        </main>
      </div>

      <div
        className={`admin-shell__drawer-root${mobileNavOpen ? ' is-open' : ''}`}
        aria-hidden={!mobileNavOpen}
      >
        <button
          type="button"
          className="admin-shell__drawer-backdrop"
          tabIndex={mobileNavOpen ? 0 : -1}
          aria-label={t('navClose')}
          onClick={() => setMobileNavOpen(false)}
        />
        <aside
          id="admin-mobile-drawer"
          className="admin-shell__drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby={drawerTitleId}
        >
          <div className="admin-shell__drawer-head">
            <div>
              <strong id={drawerTitleId}>{t('shellTitle')}</strong>
              <span className="admin-shell__brand-sub">{t('shellSubtitle')}</span>
            </div>
            <button
              type="button"
              className="admin-shell__drawer-close"
              onClick={() => setMobileNavOpen(false)}
              aria-label={t('navClose')}
            >
              <Icon name="close" size={18} aria-hidden />
            </button>
          </div>
          <nav className="admin-shell__drawer-nav">
            <AdminNavLinks idPrefix="admin-drawer" onNavigate={() => setMobileNavOpen(false)} />
          </nav>
          <div className="admin-shell__drawer-foot">
            <Link
              to={ROUTES.MY_PAGE}
              className="admin-shell__back"
              onClick={() => setMobileNavOpen(false)}
            >
              <span aria-hidden="true">←</span>
              {t('backToMyPage')}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
