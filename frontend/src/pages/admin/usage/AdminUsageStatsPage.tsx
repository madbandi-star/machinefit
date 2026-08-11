import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminUsageApi } from '@/api/usage.api';
import '@/styles/admin.css';
import '@/styles/admin-usage.css';

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
      <div className="admin-usage">
        <AdminPanel title={t('usage.overview')}>
          <div className="admin-stats">
            <div className="admin-stat">
              <div className="admin-stat__value">{s?.totalUsers ?? 0}</div>
              <div className="admin-stat__label">{t('usage.kpiTotalUsers')}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat__value">{s?.activeUsersToday ?? 0}</div>
              <div className="admin-stat__label">{t('usage.kpiActiveToday')}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat__value">{s?.activeUsersMonth ?? 0}</div>
              <div className="admin-stat__label">{t('usage.kpiActiveMonth')}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat__value">{s?.today.exerciseCardCreateCount ?? 0}</div>
              <div className="admin-stat__label">{t('usage.kpiCardsToday')}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat__value">{s?.month.exerciseCardCreateCount ?? 0}</div>
              <div className="admin-stat__label">{t('usage.kpiCardsMonth')}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat__value">{s?.today.templateUseCount ?? 0}</div>
              <div className="admin-stat__label">{t('usage.kpiTemplatesToday')}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat__value">{s?.month.templateUseCount ?? 0}</div>
              <div className="admin-stat__label">{t('usage.kpiTemplatesMonth')}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat__value">{s?.today.timerStartCount ?? 0}</div>
              <div className="admin-stat__label">{t('usage.kpiTimersToday')}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat__value">{s?.month.timerStartCount ?? 0}</div>
              <div className="admin-stat__label">{t('usage.kpiTimersMonth')}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat__value">{s?.today.voiceCountCount ?? 0}</div>
              <div className="admin-stat__label">{t('usage.kpiVoiceToday')}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat__value">{s?.month.voiceCountCount ?? 0}</div>
              <div className="admin-stat__label">{t('usage.kpiVoiceMonth')}</div>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel
          title={t('usage.timeseries')}
          actions={
            <div className="admin-usage__range">
              {(['7', '30', 'month'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`btn btn--sm ${range === key ? 'btn--primary' : 'btn--secondary'}`}
                  onClick={() => setRange(key)}
                >
                  {t(`usage.range.${key}`)}
                </button>
              ))}
            </div>
          }
        >
          <div className="admin-usage__chart" aria-label={t('usage.chartCards')}>
            {series.map((p) => (
              <div key={p.date} className="admin-usage__bar-col" title={p.date}>
                <div
                  className="admin-usage__bar admin-usage__bar--cards"
                  style={{ height: `${(p.exerciseCardCreateCount / maxCard) * 100}%` }}
                />
                <div
                  className="admin-usage__bar admin-usage__bar--active"
                  style={{ height: `${(p.activeUsers / maxActive) * 100}%` }}
                />
                <span className="admin-usage__bar-label">{p.date.slice(5)}</span>
              </div>
            ))}
            {series.length === 0 ? <p className="admin-muted">{t('usage.noSeries')}</p> : null}
          </div>
          <p className="admin-usage__legend">
            <span className="admin-usage__legend-item is-cards">{t('usage.chartCards')}</span>
            <span className="admin-usage__legend-item is-active">{t('usage.chartActive')}</span>
          </p>
        </AdminPanel>
      </div>
    </AdminPageShell>
  );
}
