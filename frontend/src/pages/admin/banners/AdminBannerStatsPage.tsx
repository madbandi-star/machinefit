import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { bannerApi } from '@/api/banner.api';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { ROUTES } from '@/constants/routes';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';
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
  const [q, setQ] = useState('');
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [expandedBanner, setExpandedBanner] = useState<string | null>(null);

  const statsQuery = useQuery({
    queryKey: ['admin', 'banners', 'stats'],
    queryFn: async () => (await bannerApi.stats()).data.data,
  });

  const rowsQuery = useQuery({
    queryKey: ['admin', 'banners', 'stats-rows'],
    queryFn: async () => (await bannerApi.statsRows()).data.data,
  });

  const stats = statsQuery.data;
  const rows = rowsQuery.data ?? [];

  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => row.name.toLowerCase().includes(needle));
  }, [rows, q]);

  return (
    <AdminPageShell
      title={t('admin:banners.statsTitle')}
      subtitle={t('admin:banners.statsSubtitle')}
      actions={
        <Link to={ROUTES.ADMIN_BANNERS} className="btn btn--secondary btn--sm">
          {t('admin:banners.backToList')}
        </Link>
      }
    >
      <div className="ag">
        {statsQuery.isLoading ? <Skeleton count={1} height={72} /> : null}
        {statsQuery.isError ? <QueryErrorMessage /> : null}

        {stats ? (
          <section className="ag-kpis" aria-label={t('admin:banners.statsOverview')}>
            <div className="ag-kpi">
              <span className="ag-kpi__value">{stats.totalBanners}</span>
              <span className="ag-kpi__label">{t('admin:banners.totalBanners')}</span>
            </div>
            <div className="ag-kpi">
              <span className="ag-kpi__value">{stats.activeBanners}</span>
              <span className="ag-kpi__label">{t('admin:banners.activeBanners')}</span>
            </div>
            <div className="ag-kpi">
              <span className="ag-kpi__value">{stats.totalImpressions}</span>
              <span className="ag-kpi__label">{t('admin:banners.colImpressions')}</span>
            </div>
            <div className="ag-kpi">
              <span className="ag-kpi__value">{stats.totalClicks}</span>
              <span className="ag-kpi__label">{t('admin:banners.colClicks')}</span>
            </div>
            <div className="ag-kpi">
              <span className="ag-kpi__value">{stats.overallCtr.toFixed(2)}%</span>
              <span className="ag-kpi__label">{t('admin:banners.colCtr')}</span>
            </div>
          </section>
        ) : null}

        {stats?.bySlot?.length ? (
          <section className="ag-panel">
            <h2 className="admin-panel__title">{t('admin:banners.statsBySlot')}</h2>
            <div className="ag-queue">
              {stats.bySlot.map((row) => {
                const open = expandedSlot === row.slotKey;
                return (
                  <article
                    key={row.slotKey}
                    className={['ag-card', open ? 'is-selected' : ''].filter(Boolean).join(' ')}
                  >
                    <button
                      type="button"
                      className="ag-card__main"
                      onClick={() =>
                        setExpandedSlot((prev) => (prev === row.slotKey ? null : row.slotKey))
                      }
                    >
                      <span className="ag-card__identity">
                        <span className="ag-card__title">
                          <code>{row.slotKey}</code>
                          {' · '}
                          {row.slotName}
                        </span>
                        <span className="ag-card__meta">
                          {t('admin:banners.assignedCount')}: {row.bannerCount}
                        </span>
                      </span>
                      <span className="ag-metrics">
                        <span>
                          {row.impressions} / {row.clicks}
                        </span>
                      </span>
                      <span className="ag-card__chevron" aria-hidden>
                        {open ? '▾' : '▸'}
                      </span>
                    </button>
                    {open ? (
                      <div className="ag-card__detail">
                        <p className="ag-card__excerpt">
                          {t('admin:banners.colImpressions')}: {row.impressions}
                          {' · '}
                          {t('admin:banners.colClicks')}: {row.clicks}
                          {' · '}
                          {t('admin:banners.assignedCount')}: {row.bannerCount}
                        </p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="ag-panel">
          <h2 className="admin-panel__title">{t('admin:banners.statsPerBanner')}</h2>
          <div className="ag-toolbar">
            <input
              type="search"
              className="ag-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('admin:banners.statsSearchPlaceholder')}
              aria-label={t('admin:banners.statsSearchPlaceholder')}
            />
          </div>

          {rowsQuery.isLoading ? <Skeleton count={4} height={52} /> : null}
          {rowsQuery.isError ? <QueryErrorMessage /> : null}

          {!rowsQuery.isLoading && !rowsQuery.isError ? (
            <div className="ag-queue">
              {filteredRows.length === 0 ? (
                <p className="ag-empty">{t('admin:banners.empty')}</p>
              ) : (
                filteredRows.map((row) => {
                  const open = expandedBanner === row.id;
                  return (
                    <article
                      key={row.id}
                      className={[
                        'ag-card',
                        row.status !== 'active' ? 'is-off' : '',
                        open ? 'is-selected' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <button
                        type="button"
                        className="ag-card__main"
                        onClick={() =>
                          setExpandedBanner((prev) => (prev === row.id ? null : row.id))
                        }
                      >
                        <span className="ag-card__identity">
                          <span className="ag-card__title">{row.name}</span>
                          <span className="ag-card__meta">
                            {row.advertiserName || '—'}
                            {' · '}
                            {row.slots.length
                              ? row.slots.map((s) => s.slotName).join(', ')
                              : '—'}
                          </span>
                        </span>
                        <span
                          className={`ag-pill ${
                            row.status === 'active' ? 'ag-pill--on' : 'ag-pill--off'
                          }`}
                        >
                          {row.status === 'active'
                            ? t('admin:banners.statusActive')
                            : t('admin:banners.statusInactive')}
                        </span>
                        <span className="ag-metrics">
                          <span>
                            {row.impressionCount} / {row.clickCount}
                          </span>
                          <span>{row.ctr.toFixed(2)}%</span>
                        </span>
                        <span className="ag-card__chevron" aria-hidden>
                          {open ? '▾' : '▸'}
                        </span>
                      </button>
                      {open ? (
                        <div className="ag-card__detail">
                          <p className="ag-card__excerpt">
                            {t('admin:banners.colImpressions')}: {row.impressionCount}
                            {' · '}
                            {t('admin:banners.colClicks')}: {row.clickCount}
                            {' · '}
                            {t('admin:banners.colCtr')}: {row.ctr.toFixed(2)}%
                          </p>
                          <p className="ag-card__excerpt">
                            {t('admin:banners.lastImpressed')}:{' '}
                            {fmtDate(row.lastImpressedAt, i18n.language)}
                            {' · '}
                            {t('admin:banners.lastClicked')}:{' '}
                            {fmtDate(row.lastClickedAt, i18n.language)}
                          </p>
                          <div className="ag-card__actions">
                            <Link
                              to={ROUTES.ADMIN_BANNER_EDIT.replace(':bannerId', row.id)}
                              className="btn btn--secondary btn--sm"
                            >
                              {t('admin:banners.edit')}
                            </Link>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          ) : null}
        </section>
      </div>
    </AdminPageShell>
  );
}
