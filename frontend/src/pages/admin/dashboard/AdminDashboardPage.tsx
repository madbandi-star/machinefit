import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import '@/styles/admin.css';

export function AdminDashboardPage() {
  const { t } = useTranslation('admin');

  const { data: stats, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminDashboard,
    queryFn: async () => {
      const res = await adminApi.dashboard();
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <AdminPageShell title={t('title')}>
        <Skeleton count={4} />
      </AdminPageShell>
    );
  }

  const pendingRequests = stats?.pendingRequests ?? 0;
  const pendingReports = stats?.pendingReports ?? 0;
  const attentionItems = [
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
  ];

  const overviewCards = [
    { label: t('userCount'), value: stats?.userCount ?? 0, to: ROUTES.ADMIN_USERS },
    { label: t('gymCount'), value: stats?.gymCount ?? 0, to: ROUTES.ADMIN_GYMS },
    { label: t('verifiedGyms'), value: stats?.verifiedGyms ?? 0, to: ROUTES.ADMIN_GYMS },
    { label: t('machineCount'), value: stats?.machineCount ?? 0, to: ROUTES.ADMIN_MACHINES },
    { label: t('pendingRequests'), value: pendingRequests, to: ROUTES.ADMIN_MODERATION },
    { label: t('pendingReports'), value: pendingReports, to: ROUTES.ADMIN_MODERATION },
  ];

  const menus = [
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
    { to: ROUTES.ADMIN_NOTICES, title: t('notices.nav'), desc: t('menu.noticesDesc') },
    { to: ROUTES.ADMIN_FORTUNE, title: t('fortuneAdmin.nav'), desc: t('menu.fortuneDesc') },
    { to: ROUTES.ADMIN_TRADES, title: t('trades.nav'), desc: t('menu.tradesDesc') },
    { to: ROUTES.ADMIN_ONLINE_PT, title: t('onlinePt.nav'), desc: t('menu.onlinePtDesc') },
    { to: ROUTES.ADMIN_PUSH, title: t('push.nav'), desc: t('menu.pushDesc') },
    { to: ROUTES.ADMIN_FRIENDS, title: t('friends.nav'), desc: t('menu.friendsDesc') },
  ];

  return (
    <AdminPageShell title={t('title')} subtitle={t('subtitle')}>
      <section className="admin-panel" aria-label={t('overviewTitle')}>
        <h2 className="admin-panel__title">{t('overviewTitle')}</h2>
        <div className="admin-stats">
          {overviewCards.map((card) => (
            <Link key={card.label} to={card.to} className="admin-stat">
              <div className="admin-stat__value">{card.value}</div>
              <div className="admin-stat__label">{card.label}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-panel" aria-label={t('attentionTitle')}>
        <h2 className="admin-panel__title">{t('attentionTitle')}</h2>
        <p className="admin-panel__desc">{t('attentionDesc')}</p>
        <div className="admin-attention">
          {attentionItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`admin-attention__item${item.urgent ? ' is-urgent' : ''}`}
            >
              <span className="admin-attention__label">{item.label}</span>
              <span className="admin-attention__value">
                {item.value == null ? t('openMenu') : item.value}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-panel" aria-label={t('menuTitle')}>
        <h2 className="admin-panel__title">{t('menuTitle')}</h2>
        <p className="admin-panel__desc">{t('menuDesc')}</p>
        <div className="admin-menu">
          {menus.map((menu) => (
            <Link key={menu.to} to={menu.to} className="admin-menu__item">
              <span className="admin-menu__copy">
                <span className="admin-menu__title">{menu.title}</span>
                <span className="admin-menu__desc">{menu.desc}</span>
              </span>
              <span className="admin-menu__cta" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}
