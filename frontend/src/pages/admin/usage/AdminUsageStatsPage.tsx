import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminUsageApi } from '@/api/usage.api';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoKey(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function AdminUsageStatsPage() {
  const { t } = useTranslation('admin');
  const [range, setRange] = useState<'7' | '30' | 'month'>('7');

  const fromTo = useMemo(() => {
    if (range === '30') return { from: daysAgoKey(29), to: todayKey() };
    if (range === 'month') {
      const now = new Date();
      const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      return { from, to: todayKey() };
    }
    return { from: daysAgoKey(6), to: todayKey() };
  }, [range]);

  const summaryQuery = useQuery({
    queryKey: ['admin-usage-summary'],
    queryFn: async () => (await adminUsageApi.summary()).data.data,
  });

  const seriesQuery = useQuery({
    queryKey: ['admin-usage-timeseries', fromTo.from, fromTo.to],
    queryFn: async () => (await adminUsageApi.timeseries(fromTo)).data.data,
  });

  if (summaryQuery.isLoading) {
    return (
      <AdminPageShell title={t('usage.statsTitle')} subtitle={t('usage.statsSubtitle')}>
        <Skeleton count={4} />
      </AdminPageShell>
    );
  }

  const s = summaryQuery.data;
  const series = seriesQuery.data ?? [];
  const maxCard = Math.max(1, ...series.map((p) => p.exerciseCardCreateCount));
  const maxActive = Math.max(1, ...series.map((p) => p.activeUsers));

  return (
    <AdminPageShell title={t('usage.statsTitle')} subtitle={t('usage.statsSubtitle')}>
      <div className="ag">
        <section className="ag-kpis" aria-label={t('usage.overview')}>
          <div className="ag-kpi">
            <span className="ag-kpi__value">{s?.totalUsers ?? 0}</span>
            <span className="ag-kpi__label">{t('usage.kpiTotalUsers')}</span>
          </div>
          <div className="ag-kpi">
            <span className="ag-kpi__value">{s?.activeUsersToday ?? 0}</span>
            <span className="ag-kpi__label">{t('usage.kpiActiveToday')}</span>
          </div>
          <div className="ag-kpi">
            <span className="ag-kpi__value">{s?.activeUsersMonth ?? 0}</span>
            <span className="ag-kpi__label">{t('usage.kpiActiveMonth')}</span>
          </div>
          <div className="ag-kpi">
            <span className="ag-kpi__value">{s?.today.exerciseCardCreateCount ?? 0}</span>
            <span className="ag-kpi__label">{t('usage.kpiCardsToday')}</span>
          </div>
          <div className="ag-kpi">
            <span className="ag-kpi__value">{s?.today.templateUseCount ?? 0}</span>
            <span className="ag-kpi__label">{t('usage.kpiTemplatesToday')}</span>
          </div>
          <div className="ag-kpi">
            <span className="ag-kpi__value">{s?.today.voiceCountCount ?? 0}</span>
            <span className="ag-kpi__label">{t('usage.kpiVoiceToday')}</span>
          </div>
        </section>

        <section className="ag-panel">
          <div className="ag-toolbar">
            <div className="ag-chips" role="group" aria-label={t('usage.timeseries')}>
              {(['7', '30', 'month'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`ag-chip${range === key ? ' is-active' : ''}`}
                  onClick={() => setRange(key)}
                >
                  {t(`usage.range.${key}`)}
                </button>
              ))}
            </div>
          </div>

          {seriesQuery.isLoading ? <Skeleton count={2} height={80} /> : null}

          {!seriesQuery.isLoading ? (
            <>
              <p className="ag-chart-hint">
                {t('usage.chartMaxHint', { cards: maxCard, active: maxActive })}
              </p>
              <div className="ag-chart" aria-label={t('usage.chartCards')}>
                {series.map((p) => (
                  <div key={p.date} className="ag-bar-col" title={p.date}>
                    <div
                      className="ag-bar ag-bar--a"
                      style={{ height: `${(p.exerciseCardCreateCount / maxCard) * 100}%` }}
                    />
                    <div
                      className="ag-bar ag-bar--b"
                      style={{ height: `${(p.activeUsers / maxActive) * 100}%` }}
                    />
                    <span className="ag-bar-label">{p.date.slice(5)}</span>
                  </div>
                ))}
                {series.length === 0 ? <p className="ag-empty">{t('usage.noSeries')}</p> : null}
              </div>
              <p className="ag-legend">
                <span className="ag-legend__item">
                  <span className="ag-legend__swatch ag-legend__swatch--a" aria-hidden />
                  {t('usage.chartCards')}
                </span>
                <span className="ag-legend__item">
                  <span className="ag-legend__swatch ag-legend__swatch--b" aria-hidden />
                  {t('usage.chartActive')}
                </span>
              </p>
            </>
          ) : null}
        </section>
      </div>
    </AdminPageShell>
  );
}
