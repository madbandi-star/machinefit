import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';

export function AdminDashboardPage() {
  const { t } = useTranslation('admin');
  const [menuSearch, setMenuSearch] = useState('');

  const { data: stats, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminDashboard,
    queryFn: async () => {
      const res = await adminApi.dashboard();
      return res.data.data;
    },
  });

  const pendingRequests = stats?.pendingRequests ?? 0;
  const pendingReports = stats?.pendingReports ?? 0;

  const attentionItems = useMemo(
    () => [
      {
        label: t('ops.nav'),
        value: null as number | null,
        to: ROUTES.ADMIN_OPS,
        urgent: true,
      },
      {
        label: t('pendingRequests'),
        value: pendingRequests,
        to: ROUTES.ADMIN_MODERATION,
        urgent: pendingRequests > 0,
      },
      {
        label: t('pendingReports'),
        value: pendingReports,
        to: ROUTES.ADMIN_MODERATION,
        urgent: pendingReports > 0,
      },
      {
        label: t('ownerApplications.nav'),
        value: null as number | null,
        to: ROUTES.ADMIN_OWNER_APPLICATIONS,
        urgent: false,
      },
      {
        label: t('trainerApplications.nav'),
        value: null as number | null,
        to: ROUTES.ADMIN_TRAINER_APPLICATIONS,
        urgent: false,
      },
    ],
    [t, pendingRequests, pendingReports],
  );

  const overviewCards = useMemo(
    () => [
      { label: t('userCount'), value: stats?.userCount ?? 0, to: ROUTES.ADMIN_USERS },
      { label: t('gymCount'), value: stats?.gymCount ?? 0, to: ROUTES.ADMIN_GYMS },
      { label: t('verifiedGyms'), value: stats?.verifiedGyms ?? 0, to: ROUTES.ADMIN_GYMS },
      { label: t('machineCount'), value: stats?.machineCount ?? 0, to: ROUTES.ADMIN_MACHINES },
      {
        label: t('pendingRequests'),
        value: pendingRequests,
        to: ROUTES.ADMIN_MODERATION,
        warn: pendingRequests > 0,
      },
      {
        label: t('pendingReports'),
        value: pendingReports,
        to: ROUTES.ADMIN_MODERATION,
        warn: pendingReports > 0,
      },
    ],
    [t, stats, pendingRequests, pendingReports],
  );

  const menus = useMemo(
    () => [
      { to: ROUTES.ADMIN_OPS, title: t('ops.nav'), desc: t('menu.opsDesc') },
      { to: ROUTES.ADMIN_BACKUP, title: t('backup.nav'), desc: t('menu.backupDesc') },
      { to: ROUTES.ADMIN_USERS, title: t('users'), desc: t('menu.usersDesc') },
      { to: ROUTES.ADMIN_SUBSCRIPTIONS, title: t('subscriptions.nav'), desc: t('menu.subscriptionsDesc') },
      { to: ROUTES.ADMIN_GYMS, title: t('gyms'), desc: t('menu.gymsDesc') },
      {
        to: ROUTES.ADMIN_OWNER_APPLICATIONS,
        title: t('ownerApplications.nav'),
        desc: t('menu.ownerDesc'),
      },
      {
        to: ROUTES.ADMIN_TRAINER_APPLICATIONS,
        title: t('trainerApplications.nav'),
        desc: t('menu.trainerDesc'),
      },
      { to: ROUTES.ADMIN_BRANDS, title: t('brands.nav'), desc: t('menu.brandsDesc') },
      { to: ROUTES.ADMIN_MACHINES, title: t('machines'), desc: t('menu.machinesDesc') },
      {
        to: ROUTES.ADMIN_MACHINE_REQUESTS,
        title: t('machineRequests.nav'),
        desc: t('menu.machineRequestsDesc'),
      },
      {
        to: ROUTES.ADMIN_MACHINE_TIPS,
        title: t('machineTips.nav'),
        desc: t('menu.machineTipsDesc'),
      },
      { to: ROUTES.ADMIN_LOCATIONS, title: t('locations.nav'), desc: t('menu.locationsDesc') },
      { to: ROUTES.ADMIN_MOTIVATION, title: t('motivation.nav'), desc: t('menu.motivationDesc') },
      {
        to: ROUTES.ADMIN_MUSCLE_IMAGES,
        title: t('muscleImages.nav'),
        desc: t('menu.muscleImagesDesc'),
      },
      {
        to: ROUTES.ADMIN_MACHINE_COVERS,
        title: t('machineCovers.nav'),
        desc: t('menu.machineCoversDesc'),
      },
      { to: ROUTES.ADMIN_MODERATION, title: t('moderation'), desc: t('menu.moderationDesc') },
      { to: ROUTES.ADMIN_COMPLIANCE, title: t('compliance.nav'), desc: t('menu.complianceDesc') },
      { to: ROUTES.ADMIN_PHOTO_BOARD, title: t('photoBoard.nav'), desc: t('menu.photoBoardDesc') },
      {
        to: ROUTES.ADMIN_MACHINE_SHOWCASE,
        title: t('machineShowcase.nav'),
        desc: t('menu.machineShowcaseDesc'),
      },
      {
        to: ROUTES.ADMIN_TEMPLATE_SHARE,
        title: t('templateShare.nav'),
        desc: t('menu.templateShareDesc'),
      },
      { to: ROUTES.ADMIN_NOTICES, title: t('notices.nav'), desc: t('menu.noticesDesc') },
      { to: ROUTES.ADMIN_BANNERS, title: t('banners.nav'), desc: t('menu.bannersDesc') },
      { to: ROUTES.ADMIN_ADS, title: t('ads.nav'), desc: t('menu.adsDesc') },
      { to: ROUTES.ADMIN_BANNER_SLOTS, title: t('banners.navSlots'), desc: t('menu.bannerSlotsDesc') },
      { to: ROUTES.ADMIN_BANNER_STATS, title: t('banners.navStats'), desc: t('menu.bannerStatsDesc') },
      { to: ROUTES.ADMIN_FORTUNE, title: t('fortuneAdmin.nav'), desc: t('menu.fortuneDesc') },
      { to: ROUTES.ADMIN_TRADES, title: t('trades.nav'), desc: t('menu.tradesDesc') },
      { to: ROUTES.ADMIN_ONLINE_PT, title: t('onlinePt.nav'), desc: t('menu.onlinePtDesc') },
      { to: ROUTES.ADMIN_PUSH, title: t('push.nav'), desc: t('menu.pushDesc') },
      { to: ROUTES.ADMIN_FRIENDS, title: t('friends.nav'), desc: t('menu.friendsDesc') },
    ],
    [t],
  );

  const filteredMenus = useMemo(() => {
    const needle = menuSearch.trim().toLowerCase();
    if (!needle) return menus;
    return menus.filter(
      (m) =>
        m.title.toLowerCase().includes(needle) || m.desc.toLowerCase().includes(needle),
    );
  }, [menus, menuSearch]);

  if (isLoading) {
    return (
      <AdminPageShell title={t('title')}>
        <Skeleton count={4} />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell title={t('title')} subtitle={t('subtitle')}>
      <div className="ag">
        <section className="ag-kpis" aria-label={t('overviewTitle')}>
          {overviewCards.map((card) => (
            <Link
              key={card.label}
              to={card.to}
              className={`ag-kpi${card.warn ? ' is-warn' : ''}`}
            >
              <span className="ag-kpi__value">{card.value}</span>
              <span className="ag-kpi__label">{card.label}</span>
            </Link>
          ))}
        </section>

        <section className="ag-panel" aria-label={t('attentionTitle')}>
          <h2 className="admin-panel__title">{t('attentionTitle')}</h2>
          <p className="admin-panel__desc">{t('attentionDesc')}</p>
          <div className="ag-queue">
            {attentionItems.map((item) => (
              <article
                key={item.label}
                className={`ag-card${item.urgent ? ' is-warn' : ''}`}
              >
                <Link to={item.to} className="ag-card__main">
                  <span className="ag-card__identity">
                    <span className="ag-card__title">{item.label}</span>
                    <span className="ag-card__meta">
                      {item.value == null ? t('openMenu') : String(item.value)}
                    </span>
                  </span>
                  {item.urgent ? (
                    <span className="ag-pill ag-pill--warn">{t('attentionTitle')}</span>
                  ) : (
                    <span className="ag-pill ag-pill--off">{t('openMenu')}</span>
                  )}
                  <span className="ag-card__chevron" aria-hidden>
                    →
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="ag-panel" aria-label={t('menuTitle')}>
          <h2 className="admin-panel__title">{t('menuTitle')}</h2>
          <p className="admin-panel__desc">{t('menuDesc')}</p>
          <div className="ag-toolbar">
            <input
              className="ag-search"
              type="search"
              value={menuSearch}
              placeholder={t('menuSearch')}
              aria-label={t('menuSearch')}
              onChange={(e) => setMenuSearch(e.target.value)}
            />
          </div>
          {filteredMenus.length === 0 ? (
            <p className="ag-empty">{t('menuSearchEmpty')}</p>
          ) : (
            <div className="ag-queue">
              {filteredMenus.map((menu) => (
                <article key={menu.to} className="ag-card">
                  <Link to={menu.to} className="ag-card__main">
                    <span className="ag-card__identity">
                      <span className="ag-card__title">{menu.title}</span>
                      <span className="ag-card__meta">{menu.desc}</span>
                    </span>
                    <span className="ag-metrics" aria-hidden />
                    <span className="ag-card__chevron" aria-hidden>
                      →
                    </span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminPageShell>
  );
}
