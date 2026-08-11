import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { bannerApi } from '@/api/banner.api';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { ROUTES } from '@/constants/routes';
import '@/styles/admin.css';
import '@/styles/banners.css';

function fmtDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(locale || 'ko', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminBannerStatsPage() {
  const { t, i18n } = useTranslation(['admin', 'common']);

  const statsQuery = useQuery({
    queryKey: ['admin', 'banners', 'stats'],
    queryFn: async () => (await bannerApi.stats()).data.data,
  });

  const rowsQuery = useQuery({
    queryKey: ['admin', 'banners', 'stats-rows'],
    queryFn: async () => (await bannerApi.statsRows()).data.data,
  });

  const stats = statsQuery.data;

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div className="admin-page__heading">
          <h1 className="admin-page__title">{t('admin:banners.statsTitle')}</h1>
          <p className="admin-page__subtitle">{t('admin:banners.statsSubtitle')}</p>
        </div>
        <div className="admin-page__actions">
          <Link to={ROUTES.ADMIN_BANNERS} className="btn btn--secondary">
            {t('admin:banners.backToList')}
          </Link>
        </div>
      </header>

      <div className="admin-page__body">
        {statsQuery.isLoading ? <Skeleton count={2} height={80} /> : null}
        {statsQuery.isError ? <QueryErrorMessage /> : null}

        {stats ? (
          <section className="admin-panel" style={{ marginBottom: '1rem' }}>
            <h2 className="admin-panel__title">{t('admin:banners.statsOverview')}</h2>
            <div className="admin-stats">
              <div className="admin-stat">
                <span className="admin-stat__label">{t('admin:banners.totalBanners')}</span>
                <strong className="admin-stat__value">{stats.totalBanners}</strong>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__label">{t('admin:banners.activeBanners')}</span>
                <strong className="admin-stat__value">{stats.activeBanners}</strong>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__label">{t('admin:banners.colImpressions')}</span>
                <strong className="admin-stat__value">{stats.totalImpressions}</strong>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__label">{t('admin:banners.colClicks')}</span>
                <strong className="admin-stat__value">{stats.totalClicks}</strong>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__label">{t('admin:banners.colCtr')}</span>
                <strong className="admin-stat__value">{stats.overallCtr.toFixed(2)}%</strong>
              </div>
            </div>
          </section>
        ) : null}

        {stats?.bySlot?.length ? (
          <section className="admin-panel" style={{ marginBottom: '1rem', overflowX: 'auto' }}>
            <h2 className="admin-panel__title">{t('admin:banners.statsBySlot')}</h2>
            <table className="admin-banners-table">
              <thead>
                <tr>
                  <th>{t('admin:banners.fieldSlotKey')}</th>
                  <th>{t('admin:banners.fieldSlotName')}</th>
                  <th>{t('admin:banners.assignedCount')}</th>
                  <th>{t('admin:banners.colImpressions')}</th>
                  <th>{t('admin:banners.colClicks')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.bySlot.map((row) => (
                  <tr key={row.slotKey}>
                    <td>
                      <code>{row.slotKey}</code>
                    </td>
                    <td>{row.slotName}</td>
                    <td>{row.bannerCount}</td>
                    <td>{row.impressions}</td>
                    <td>{row.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {rowsQuery.isLoading ? <Skeleton count={3} height={64} /> : null}
        {rowsQuery.isError ? <QueryErrorMessage /> : null}
        {!rowsQuery.isLoading && !rowsQuery.isError ? (
          <section className="admin-panel" style={{ overflowX: 'auto' }}>
            <h2 className="admin-panel__title">{t('admin:banners.statsPerBanner')}</h2>
            <table className="admin-banners-table">
              <thead>
                <tr>
                  <th>{t('admin:banners.colName')}</th>
                  <th>{t('admin:banners.colAdvertiser')}</th>
                  <th>{t('admin:banners.colStatus')}</th>
                  <th>{t('admin:banners.colSlots')}</th>
                  <th>{t('admin:banners.colImpressions')}</th>
                  <th>{t('admin:banners.colClicks')}</th>
                  <th>{t('admin:banners.colCtr')}</th>
                  <th>{t('admin:banners.lastImpressed')}</th>
                  <th>{t('admin:banners.lastClicked')}</th>
                </tr>
              </thead>
              <tbody>
                {(rowsQuery.data ?? []).map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link to={ROUTES.ADMIN_BANNER_EDIT.replace(':bannerId', row.id)}>
                        {row.name}
                      </Link>
                    </td>
                    <td>{row.advertiserName || '—'}</td>
                    <td>
                      {row.status === 'active'
                        ? t('admin:banners.statusActive')
                        : t('admin:banners.statusInactive')}
                    </td>
                    <td>
                      {row.slots.length
                        ? row.slots.map((s) => s.slotName).join(', ')
                        : '—'}
                    </td>
                    <td>{row.impressionCount}</td>
                    <td>{row.clickCount}</td>
                    <td>{row.ctr.toFixed(2)}%</td>
                    <td>{fmtDate(row.lastImpressedAt, i18n.language)}</td>
                    <td>{fmtDate(row.lastClickedAt, i18n.language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
      </div>
    </div>
  );
}
