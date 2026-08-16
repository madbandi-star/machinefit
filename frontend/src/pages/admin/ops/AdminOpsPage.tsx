import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { OpsRange, OpsSeriesPoint, OpsStatusColor } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { ScrollCarousel } from '@/components/navigation/ScrollCarousel/ScrollCarousel';
import { opsApi } from '@/api/ops.api';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';
import '@/styles/admin-ops.css';

type TabId =
  | 'overview'
  | 'errors'
  | 'server'
  | 'api'
  | 'users'
  | 'pages'
  | 'features'
  | 'db'
  | 'logs'
  | 'audit'
  | 'alerts'
  | 'reports'
  | 'security';

const TABS: TabId[] = [
  'overview',
  'errors',
  'logs',
  'alerts',
  'server',
  'api',
  'users',
  'pages',
  'features',
  'db',
  'audit',
  'reports',
  'security',
];

function statusClass(color: OpsStatusColor | string | undefined): string {
  if (color === 'green' || color === 'yellow' || color === 'red') return `is-${color}`;
  return 'is-yellow';
}

function fmtNum(n: number | null | undefined, digits = 0): string {
  if (n == null || Number.isNaN(n)) return '—';
  return digits > 0 ? n.toFixed(digits) : Math.round(n).toLocaleString();
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

function fmtMs(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${Math.round(n)}ms`;
}

/** Always include hour:minute:second for ops timestamps. */
function fmtDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function SeriesBars({
  points,
  tone,
}: {
  points: OpsSeriesPoint[];
  tone?: 'default' | 'warn' | 'danger';
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div className="admin-ops__bars" aria-hidden="true">
      {points.map((p) => (
        <div
          key={p.date}
          className={`admin-ops__bar${tone === 'warn' ? ' is-warn' : ''}${tone === 'danger' ? ' is-danger' : ''}`}
          style={{ height: `${Math.max(4, (p.value / max) * 100)}%` }}
          title={`${p.date}: ${p.value}`}
        />
      ))}
    </div>
  );
}

function speedClass(ms: number): string {
  if (ms < 300) return 'is-green';
  if (ms < 1000) return 'is-yellow';
  return 'is-red';
}

function sevPill(severity: string | undefined): string {
  const s = (severity ?? '').toLowerCase();
  if (s === 'critical' || s === 'error' || s === 'high' || s === 'fatal') return 'ag-pill--danger';
  if (s === 'warn' || s === 'warning' || s === 'medium') return 'ag-pill--warn';
  if (s === 'ok' || s === 'info' || s === 'low') return 'ag-pill--on';
  return 'ag-pill--off';
}

function isFailSeverity(severity: string | undefined): boolean {
  const s = (severity ?? '').toLowerCase();
  return s === 'critical' || s === 'error' || s === 'high' || s === 'fatal';
}

function statusPill(color: OpsStatusColor | string | undefined): string {
  if (color === 'green') return 'ag-pill--on';
  if (color === 'red') return 'ag-pill--danger';
  return 'ag-pill--warn';
}

export function AdminOpsPage() {
  const { t } = useTranslation('admin');
  const showToast = useUIStore((s) => s.showToast);
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>('overview');
  const [range, setRange] = useState<OpsRange>('30d');
  const [apiRange, setApiRange] = useState<OpsRange>('today');
  const [logKind, setLogKind] = useState('');
  const [logQ, setLogQ] = useState('');
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const dashQ = useQuery({
    queryKey: ['admin-ops-dashboard', range],
    queryFn: async () => (await opsApi.dashboard(range)).data.data,
    refetchInterval: () => (document.visibilityState === 'visible' ? 45_000 : false),
  });

  const errorsQ = useQuery({
    queryKey: ['admin-ops-errors'],
    queryFn: async () => (await opsApi.errors({ unresolvedOnly: true })).data.data,
    enabled: tab === 'errors' || tab === 'overview',
    refetchInterval: () => (document.visibilityState === 'visible' ? 45_000 : false),
  });

  const apiQ = useQuery({
    queryKey: ['admin-ops-api', apiRange],
    queryFn: async () => (await opsApi.apiStats(apiRange)).data.data,
    enabled: tab === 'api',
    refetchInterval: () => (document.visibilityState === 'visible' ? 45_000 : false),
  });

  const pagesQ = useQuery({
    queryKey: ['admin-ops-pages', range],
    queryFn: async () => (await opsApi.pages(range)).data.data,
    enabled: tab === 'pages',
  });

  const featuresQ = useQuery({
    queryKey: ['admin-ops-features', range],
    queryFn: async () => (await opsApi.features(range)).data.data,
    enabled: tab === 'features',
  });

  const logsQ = useQuery({
    queryKey: ['admin-ops-logs', logKind, logQ],
    queryFn: async () =>
      (
        await opsApi.logs({
          kind: logKind || undefined,
          q: logQ || undefined,
          limit: 100,
        })
      ).data.data,
    enabled: tab === 'logs',
  });

  const auditsQ = useQuery({
    queryKey: ['admin-ops-audits'],
    queryFn: async () => (await opsApi.audits(80)).data.data,
    enabled: tab === 'audit',
  });

  const alertsQ = useQuery({
    queryKey: ['admin-ops-alerts'],
    queryFn: async () => (await opsApi.alerts()).data.data,
    enabled: tab === 'alerts' || tab === 'overview',
    refetchInterval: () => (document.visibilityState === 'visible' ? 30_000 : false),
  });

  const dbQ = useQuery({
    queryKey: ['admin-ops-db'],
    queryFn: async () => (await opsApi.slowQueries()).data.data,
    enabled: tab === 'db' || tab === 'server',
    refetchInterval: () => (document.visibilityState === 'visible' ? 45_000 : false),
  });

  const securityQ = useQuery({
    queryKey: ['admin-ops-security'],
    queryFn: async () => (await opsApi.security(80)).data.data,
    enabled: tab === 'security',
  });

  const reportQ = useQuery({
    queryKey: ['admin-ops-report', reportPeriod],
    queryFn: async () => (await opsApi.report(reportPeriod)).data.data,
    enabled: tab === 'reports',
  });

  const resolveErr = useMutation({
    mutationFn: (id: string) => opsApi.resolveError(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-ops-errors'] });
      void qc.invalidateQueries({ queryKey: ['admin-ops-dashboard'] });
      showToast(t('ops.resolved'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const ackAlert = useMutation({
    mutationFn: (id: string) => opsApi.ackAlert(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-ops-alerts'] });
      void qc.invalidateQueries({ queryKey: ['admin-ops-dashboard'] });
      showToast(t('ops.acked'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const d = dashQ.data;
  const kpi = d?.kpi;
  const health = d?.health;

  const apiSorted = useMemo(() => {
    const items = apiQ.data ?? [];
    return {
      slow: [...items].sort((a, b) => b.avgMs - a.avgMs).slice(0, 20),
      fail: [...items].sort((a, b) => b.failRate - a.failRate).slice(0, 20),
      hot: [...items].sort((a, b) => b.callCount - a.callCount).slice(0, 20),
    };
  }, [apiQ.data]);

  const pageSorted = useMemo(() => {
    const items = pagesQ.data ?? [];
    return {
      popular: [...items].sort((a, b) => b.pageViews - a.pageViews).slice(0, 20),
      dwell: [...items].sort((a, b) => b.avgDwellMs - a.avgDwellMs).slice(0, 20),
      bounce: [...items]
        .filter((p) => p.bounceRate != null)
        .sort((a, b) => (b.bounceRate ?? 0) - (a.bounceRate ?? 0))
        .slice(0, 20),
    };
  }, [pagesQ.data]);

  if (dashQ.isLoading && !d) {
    return (
      <AdminPageShell title={t('ops.title')} subtitle={t('ops.subtitle')}>
        <Skeleton count={6} />
      </AdminPageShell>
    );
  }

  const errorCount = errorsQ.data?.length ?? kpi?.errorCountToday ?? 0;
  const alertCount = (alertsQ.data ?? d?.openAlerts ?? []).length;
  const ranges: OpsRange[] = ['today', '7d', '30d', '90d', '1y'];
  const rangeLabel = (r: OpsRange) =>
    r === 'today'
      ? t('ops.rangeToday')
      : r === '7d'
        ? t('ops.range7d')
        : r === '30d'
          ? t('ops.range30d')
          : r === '90d'
            ? t('ops.range90d')
            : t('ops.range1y');

  const tabBadge = (id: TabId): number | null => {
    if (id === 'errors') return errorCount;
    if (id === 'alerts') return alertCount;
    return null;
  };

  return (
    <AdminPageShell
      title={t('ops.title')}
      subtitle={t('ops.subtitle')}
      actions={
        <span className="admin-ops__refresh">
          {t('ops.autoRefresh')} · {range}
        </span>
      }
    >
      <div className="admin-ops ag">
        <div className="ag-toolbar">
          <ScrollCarousel
            className="chip-carousel"
            scrollerClassName="ag-chips"
            scrollerProps={{ role: 'group', 'aria-label': t('ops.range') }}
          >
            {ranges.map((r) => (
              <button
                key={r}
                type="button"
                className={`ag-chip${range === r ? ' is-active' : ''}`}
                onClick={() => setRange(r)}
              >
                {rangeLabel(r)}
              </button>
            ))}
          </ScrollCarousel>
          <ScrollCarousel
            className="chip-carousel"
            scrollerClassName="ag-chips"
            scrollerProps={{ role: 'navigation', 'aria-label': t('ops.title') }}
          >
            {TABS.map((id) => {
              const count = tabBadge(id);
              return (
                <button
                  key={id}
                  type="button"
                  className={`ag-chip${tab === id ? ' is-active' : ''}`}
                  onClick={() => {
                    setTab(id);
                    setExpandedId(null);
                  }}
                >
                  {t(`ops.tabs.${id}`)}
                  {count != null && count > 0 ? (
                    <span className="ag-chip__count">{count}</span>
                  ) : null}
                </button>
              );
            })}
          </ScrollCarousel>
        </div>

        {tab === 'overview' && kpi && health && (
          <>
            <section className="ag-kpis" aria-label={t('ops.kpi')}>
              <button type="button" className="ag-kpi" onClick={() => setTab('users')}>
                <span className="ag-kpi__value">{fmtNum(kpi.currentOnline)}</span>
                <span className="ag-kpi__label">{t('ops.currentOnline')}</span>
              </button>
              <button type="button" className="ag-kpi" onClick={() => setTab('users')}>
                <span className="ag-kpi__value">{fmtNum(kpi.todaySignups)}</span>
                <span className="ag-kpi__label">{t('ops.todaySignups')}</span>
              </button>
              <button type="button" className="ag-kpi" onClick={() => setTab('users')}>
                <span className="ag-kpi__value">{fmtNum(kpi.dau)}</span>
                <span className="ag-kpi__label">DAU</span>
              </button>
              <button
                type="button"
                className={`ag-kpi${speedClass(kpi.apiAvgMs ?? 0) === 'is-red' ? ' is-danger' : speedClass(kpi.apiAvgMs ?? 0) === 'is-yellow' ? ' is-warn' : ''}`}
                onClick={() => setTab('api')}
              >
                <span className="ag-kpi__value">{fmtMs(kpi.apiAvgMs)}</span>
                <span className="ag-kpi__label">{t('ops.apiAvg')}</span>
              </button>
              <button
                type="button"
                className={`ag-kpi${statusClass(kpi.serverStatus) === 'is-red' ? ' is-danger' : statusClass(kpi.serverStatus) === 'is-yellow' ? ' is-warn' : ''}`}
                onClick={() => setTab('server')}
              >
                <span className="ag-kpi__value">{kpi.serverStatus}</span>
                <span className="ag-kpi__label">{t('ops.serverStatus')}</span>
              </button>
              <button
                type="button"
                className={`ag-kpi${(kpi.errorCountToday ?? 0) > 0 ? ' is-danger' : ''}`}
                onClick={() => setTab('errors')}
              >
                <span className="ag-kpi__value">{fmtNum(kpi.errorCountToday)}</span>
                <span className="ag-kpi__label">{t('ops.errorsToday')}</span>
              </button>
              <button
                type="button"
                className={`ag-kpi${alertCount > 0 ? ' is-warn' : ''}`}
                onClick={() => setTab('alerts')}
              >
                <span className="ag-kpi__value">{fmtNum(alertCount)}</span>
                <span className="ag-kpi__label">{t('ops.tabs.alerts')}</span>
              </button>
              <button type="button" className="ag-kpi" onClick={() => setTab('server')}>
                <span className="ag-kpi__value">{health.server}</span>
                <span className="ag-kpi__label">{t('ops.healthPanel')}</span>
              </button>
            </section>

            <section className="admin-ops__charts">
              <div className="admin-ops__chart">
                <h3 className="admin-ops__chart-title">{t('ops.chartVisitors')}</h3>
                <SeriesBars points={d.visitorsSeries} />
              </div>
              <div className="admin-ops__chart">
                <h3 className="admin-ops__chart-title">{t('ops.chartSignups')}</h3>
                <SeriesBars points={d.signupsSeries} />
              </div>
              <div className="admin-ops__chart">
                <h3 className="admin-ops__chart-title">{t('ops.chartDau')}</h3>
                <SeriesBars points={d.dauSeries} />
              </div>
              <div className="admin-ops__chart">
                <h3 className="admin-ops__chart-title">{t('ops.chartApi')}</h3>
                <SeriesBars points={d.apiLatencySeries} tone="warn" />
              </div>
              <div className="admin-ops__chart">
                <h3 className="admin-ops__chart-title">{t('ops.chartErrors')}</h3>
                <SeriesBars points={d.errorSeries} tone="danger" />
              </div>
              <div className="admin-ops__chart">
                <h3 className="admin-ops__chart-title">{t('ops.chartCpuMem')}</h3>
                <SeriesBars points={d.cpuSeries} tone="warn" />
                <div style={{ height: 8 }} />
                <SeriesBars points={d.memorySeries} tone="danger" />
              </div>
            </section>

            <section className="admin-ops__widgets">
              <div className="admin-panel">
                <h2 className="admin-panel__title">{t('ops.topPages')}</h2>
                <ul className="admin-ops__list">
                  {d.topPages.map((p) => (
                    <li key={p.pathKey}>
                      <span className="admin-ops__mono">{p.pathKey}</span>
                      <span className="admin-ops__list-meta">{p.pageViews}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="admin-panel">
                <h2 className="admin-panel__title">{t('ops.topFeatures')}</h2>
                <ul className="admin-ops__list">
                  {d.topFeatures.map((f) => (
                    <li key={f.featureKey}>
                      <span>{f.featureKey}</span>
                      <span className="admin-ops__list-meta">{f.eventCount}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="admin-panel">
                <h2 className="admin-panel__title">{t('ops.slowApis')}</h2>
                <ul className="admin-ops__list">
                  {d.slowApis.slice(0, 10).map((a) => (
                    <li key={`${a.method}:${a.routeKey}`}>
                      <span className="admin-ops__mono">
                        {a.method} {a.routeKey}
                      </span>
                      <span className={`admin-ops__list-meta admin-ops__status ${a.speedColor}`}>
                        {fmtMs(a.avgMs)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="admin-panel">
                <h2 className="admin-panel__title">{t('ops.recentErrors')}</h2>
                <ul className="admin-ops__list">
                  {d.recentErrors.map((e) => (
                    <li key={e.id}>
                      <span>
                        <span className={`admin-ops__sev is-${e.severity}`}>{e.severity}</span>{' '}
                        {e.title}
                      </span>
                      <span className="admin-ops__list-meta">{e.occurrenceCount}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="admin-panel">
                <h2 className="admin-panel__title">{t('ops.recentAudits')}</h2>
                <ul className="admin-ops__list">
                  {d.recentAudits.map((a) => (
                    <li key={a.id}>
                      <span>
                        {a.action} · {a.targetType}
                      </span>
                      <span className="admin-ops__list-meta">
                        {new Date(a.createdAt).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="admin-panel">
                <h2 className="admin-panel__title">{t('ops.recentSignups')}</h2>
                <ul className="admin-ops__list">
                  {d.recentSignups.map((u) => (
                    <li key={u.id}>
                      <span>{u.displayName || u.id.slice(0, 8)}</span>
                      <span className="admin-ops__list-meta">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="admin-panel">
                <h2 className="admin-panel__title">{t('ops.healthPanel')}</h2>
                <div className="admin-stats">
                  <div className="admin-stat">
                    <div className="admin-stat__value">{health.server}</div>
                    <div className="admin-stat__label">Server</div>
                  </div>
                  <div className="admin-stat">
                    <div className="admin-stat__value">{health.database}</div>
                    <div className="admin-stat__label">Database</div>
                  </div>
                  <div className="admin-stat">
                    <div className="admin-stat__value">{health.storage}</div>
                    <div className="admin-stat__label">Storage</div>
                  </div>
                  <div className="admin-stat">
                    <div className="admin-stat__value">{health.version}</div>
                    <div className="admin-stat__label">Version</div>
                  </div>
                </div>
              </div>
              <div className="admin-panel">
                <h2 className="admin-panel__title">{t('ops.dbPanel')}</h2>
                <ul className="admin-ops__list">
                  {d.dbSlowQueries.map((q) => (
                    <li key={q.id}>
                      <span className="admin-ops__mono">{q.queryPreview.slice(0, 80)}</span>
                      <span className="admin-ops__list-meta">{fmtMs(q.durationMs)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        )}

        {tab === 'errors' && (
          <section className="ag-panel">
            <h2 className="admin-panel__title">{t('ops.unresolvedErrors')}</h2>
            {(errorsQ.data ?? []).length === 0 ? (
              <p className="ag-empty">{t('ops.unresolvedErrors')}</p>
            ) : (
              <div className="ag-queue">
                {(errorsQ.data ?? []).map((e) => {
                  const open = expandedId === e.id;
                  return (
                    <article
                      key={e.id}
                      className={[
                        'ag-card',
                        isFailSeverity(e.severity) ? 'is-fail' : 'is-warn',
                        open ? 'is-selected' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <button
                        type="button"
                        className="ag-card__main"
                        onClick={() =>
                          setExpandedId((prev) => (prev === e.id ? null : e.id))
                        }
                      >
                        <span className="ag-card__identity">
                          <span className="ag-card__title">{e.title}</span>
                          <span className="ag-card__meta">
                            {t('ops.count')}: {e.occurrenceCount} ·{' '}
                            {fmtDateTime(e.lastSeenAt)}
                          </span>
                        </span>
                        <span className={`ag-pill ${sevPill(e.severity)}`}>{e.severity}</span>
                        <span className="ag-metrics">{e.occurrenceCount}</span>
                        <span className="ag-card__chevron" aria-hidden>
                          {open ? '▾' : '▸'}
                        </span>
                      </button>
                      {open ? (
                        <div className="ag-card__detail">
                          <p className="ag-card__excerpt admin-ops__mono">{e.sampleUrl}</p>
                          <p className="ag-card__excerpt">
                            {t('ops.firstSeen')}: {fmtDateTime(e.firstSeenAt)} ·{' '}
                            {t('ops.lastSeen')}: {fmtDateTime(e.lastSeenAt)}
                          </p>
                          <div className="ag-card__actions">
                            <button
                              type="button"
                              className="btn btn--secondary"
                              onClick={() => resolveErr.mutate(e.id)}
                            >
                              {t('ops.resolve')}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === 'server' && health && (
          <section className="admin-panel">
            <h2 className="admin-panel__title">{t('ops.serverStatus')}</h2>
            <div className="admin-stats">
              <div className="admin-stat">
                <div className={`admin-stat__value admin-ops__status ${statusClass(health.statusColor)}`}>
                  {health.statusColor}
                </div>
                <div className="admin-stat__label">{t('ops.overall')}</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtNum(health.cpuPct, 1)}%</div>
                <div className="admin-stat__label">CPU</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtNum(health.memoryPct, 1)}%</div>
                <div className="admin-stat__label">Memory</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtNum(health.diskPct, 1)}%</div>
                <div className="admin-stat__label">Disk</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtNum(health.uptimeSec / 3600, 1)}h</div>
                <div className="admin-stat__label">Uptime</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{health.restartCount}</div>
                <div className="admin-stat__label">{t('ops.restarts')}</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{health.supabase}</div>
                <div className="admin-stat__label">Supabase</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">
                  {health.dbPool.total ?? '—'}/{health.dbPool.idle ?? '—'}
                </div>
                <div className="admin-stat__label">DB Pool</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{health.version}</div>
                <div className="admin-stat__label">Build</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value" style={{ fontSize: '0.85rem' }}>
                  {new Date(health.buildTime).toLocaleString()}
                </div>
                <div className="admin-stat__label">Build Time</div>
              </div>
            </div>
          </section>
        )}

        {tab === 'api' && (
          <section className="ag-panel">
            <div className="ag-toolbar">
              <div className="ag-chips" role="group" aria-label={t('ops.range')}>
                {(['today', '7d', '30d'] as OpsRange[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`ag-chip${apiRange === r ? ' is-active' : ''}`}
                    onClick={() => setApiRange(r)}
                  >
                    {rangeLabel(r)}
                  </button>
                ))}
              </div>
            </div>
            <h2 className="admin-panel__title">{t('ops.slowApis')}</h2>
            <div className="ag-queue">
              {apiSorted.slow.map((a) => (
                <article key={`s-${a.method}-${a.routeKey}`} className="ag-card">
                  <div className="ag-card__main" style={{ cursor: 'default' }}>
                    <span className="ag-card__identity">
                      <span className="ag-card__title admin-ops__mono">
                        {a.method} {a.routeKey}
                      </span>
                      <span className="ag-card__meta">
                        P95 {fmtMs(a.p95Ms)} · P99 {fmtMs(a.p99Ms)} · {t('ops.calls')}{' '}
                        {a.callCount}
                      </span>
                    </span>
                    <span className={`ag-pill ${statusPill(a.speedColor)}`}>{fmtMs(a.avgMs)}</span>
                    <span className="ag-metrics">{fmtPct(a.failRate)}</span>
                    <span className="ag-card__chevron" aria-hidden />
                  </div>
                </article>
              ))}
            </div>
            <h2 className="admin-panel__title">{t('ops.failApis')}</h2>
            <div className="ag-queue">
              {apiSorted.fail.map((a) => (
                <article key={`f-${a.method}-${a.routeKey}`} className="ag-card is-warn">
                  <div className="ag-card__main" style={{ cursor: 'default' }}>
                    <span className="ag-card__identity">
                      <span className="ag-card__title admin-ops__mono">
                        {a.method} {a.routeKey}
                      </span>
                      <span className="ag-card__meta">
                        {fmtMs(a.avgMs)} · {t('ops.calls')} {a.callCount}
                      </span>
                    </span>
                    <span className="ag-pill ag-pill--danger">{fmtPct(a.failRate)}</span>
                    <span className="ag-card__chevron" aria-hidden />
                  </div>
                </article>
              ))}
            </div>
            <h2 className="admin-panel__title">{t('ops.hotApis')}</h2>
            <div className="ag-queue">
              {apiSorted.hot.map((a) => (
                <article key={`h-${a.method}-${a.routeKey}`} className="ag-card">
                  <div className="ag-card__main" style={{ cursor: 'default' }}>
                    <span className="ag-card__identity">
                      <span className="ag-card__title admin-ops__mono">
                        {a.method} {a.routeKey}
                      </span>
                      <span className="ag-card__meta">{fmtMs(a.avgMs)}</span>
                    </span>
                    <span className="ag-pill ag-pill--off">{a.callCount}</span>
                    <span className="ag-card__chevron" aria-hidden />
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'users' && kpi && (
          <section className="ag-panel">
            <h2 className="admin-panel__title">{t('ops.userStats')}</h2>
            <section className="ag-kpis" aria-label={t('ops.userStats')}>
              <div className="ag-kpi">
                <span className="ag-kpi__value">{fmtNum(kpi.currentOnline)}</span>
                <span className="ag-kpi__label">{t('ops.currentOnline')}</span>
              </div>
              <div className="ag-kpi">
                <span className="ag-kpi__value">{fmtNum(kpi.todayVisitors)}</span>
                <span className="ag-kpi__label">{t('ops.todayVisitors')}</span>
              </div>
              <div className="ag-kpi">
                <span className="ag-kpi__value">{fmtNum(kpi.weekVisitors)}</span>
                <span className="ag-kpi__label">{t('ops.weekVisitors')}</span>
              </div>
              <div className="ag-kpi">
                <span className="ag-kpi__value">{fmtNum(kpi.monthVisitors)}</span>
                <span className="ag-kpi__label">{t('ops.monthVisitors')}</span>
              </div>
              <div className="ag-kpi">
                <span className="ag-kpi__value">{fmtNum(kpi.totalMembers)}</span>
                <span className="ag-kpi__label">{t('ops.totalMembers')}</span>
              </div>
              <div className="ag-kpi">
                <span className="ag-kpi__value">{fmtNum(kpi.todaySignups)}</span>
                <span className="ag-kpi__label">{t('ops.todaySignups')}</span>
              </div>
              <div className="ag-kpi">
                <span className="ag-kpi__value">{fmtNum(kpi.weekSignups)}</span>
                <span className="ag-kpi__label">{t('ops.weekSignups')}</span>
              </div>
              <div className="ag-kpi">
                <span className="ag-kpi__value">{fmtNum(kpi.monthSignups)}</span>
                <span className="ag-kpi__label">{t('ops.monthSignups')}</span>
              </div>
              <div className="ag-kpi">
                <span className="ag-kpi__value">{fmtNum(kpi.todayLogins)}</span>
                <span className="ag-kpi__label">{t('ops.todayLogins')}</span>
              </div>
              <div className="ag-kpi">
                <span className="ag-kpi__value">{fmtNum(kpi.dau)}</span>
                <span className="ag-kpi__label">DAU</span>
              </div>
              <div className="ag-kpi">
                <span className="ag-kpi__value">{fmtNum(kpi.wau)}</span>
                <span className="ag-kpi__label">WAU</span>
              </div>
              <div className="ag-kpi">
                <span className="ag-kpi__value">{fmtNum(kpi.mau)}</span>
                <span className="ag-kpi__label">MAU</span>
              </div>
              <div className="ag-kpi">
                <span className="ag-kpi__value">{fmtPct(kpi.stickiness)}</span>
                <span className="ag-kpi__label">Stickiness</span>
              </div>
              <div className="ag-kpi">
                <span className="ag-kpi__value">{fmtPct(kpi.retentionD1)}</span>
                <span className="ag-kpi__label">Retention D1</span>
              </div>
              <div className="ag-kpi">
                <span className="ag-kpi__value">{fmtPct(kpi.retentionD7)}</span>
                <span className="ag-kpi__label">Retention D7</span>
              </div>
              <div className="ag-kpi">
                <span className="ag-kpi__value">{fmtPct(kpi.retentionD30)}</span>
                <span className="ag-kpi__label">Retention D30</span>
              </div>
              <div className="ag-kpi">
                <span className="ag-kpi__value">{fmtNum(kpi.freeMembers)}</span>
                <span className="ag-kpi__label">{t('ops.freeMembers')}</span>
              </div>
              <div className="ag-kpi">
                <span className="ag-kpi__value">{fmtNum(kpi.paidMembers)}</span>
                <span className="ag-kpi__label">{t('ops.paidMembers')}</span>
              </div>
              <div className="ag-kpi">
                <span className="ag-kpi__value">{fmtPct(kpi.premiumConversionRate)}</span>
                <span className="ag-kpi__label">{t('ops.premiumRate')}</span>
              </div>
            </section>
            <div className="admin-ops__charts" style={{ marginTop: '1rem' }}>
              <div className="admin-ops__chart">
                <h3 className="admin-ops__chart-title">DAU / Visitors</h3>
                <SeriesBars points={d?.dauSeries ?? []} />
              </div>
              <div className="admin-ops__chart">
                <h3 className="admin-ops__chart-title">{t('ops.chartSignups')}</h3>
                <SeriesBars points={d?.signupsSeries ?? []} />
              </div>
            </div>
          </section>
        )}

        {tab === 'pages' && (
          <section className="ag-panel">
            <h2 className="admin-panel__title">{t('ops.topPages')}</h2>
            <div className="ag-queue">
              {pageSorted.popular.map((p) => (
                <article key={`p-${p.pathKey}`} className="ag-card">
                  <div className="ag-card__main" style={{ cursor: 'default' }}>
                    <span className="ag-card__identity">
                      <span className="ag-card__title admin-ops__mono">{p.pathKey}</span>
                      <span className="ag-card__meta">
                        UV {p.uniqueVisitors} · {fmtNum(p.avgDwellMs / 1000, 1)}s
                      </span>
                    </span>
                    <span className="ag-pill ag-pill--off">PV {p.pageViews}</span>
                    <span className="ag-card__chevron" aria-hidden />
                  </div>
                </article>
              ))}
            </div>
            <h2 className="admin-panel__title">{t('ops.dwellTop')}</h2>
            <div className="ag-queue">
              {pageSorted.dwell.map((p) => (
                <article key={`d-${p.pathKey}`} className="ag-card">
                  <div className="ag-card__main" style={{ cursor: 'default' }}>
                    <span className="ag-card__identity">
                      <span className="ag-card__title admin-ops__mono">{p.pathKey}</span>
                      <span className="ag-card__meta">PV {p.pageViews}</span>
                    </span>
                    <span className="ag-pill ag-pill--off">
                      {fmtNum(p.avgDwellMs / 1000, 1)}s
                    </span>
                    <span className="ag-card__chevron" aria-hidden />
                  </div>
                </article>
              ))}
            </div>
            <h2 className="admin-panel__title">{t('ops.bounceTop')}</h2>
            <div className="ag-queue">
              {pageSorted.bounce.map((p) => (
                <article key={`b-${p.pathKey}`} className="ag-card is-warn">
                  <div className="ag-card__main" style={{ cursor: 'default' }}>
                    <span className="ag-card__identity">
                      <span className="ag-card__title admin-ops__mono">{p.pathKey}</span>
                      <span className="ag-card__meta">PV {p.pageViews}</span>
                    </span>
                    <span className="ag-pill ag-pill--warn">{fmtPct(p.bounceRate)}</span>
                    <span className="ag-card__chevron" aria-hidden />
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'features' && (
          <section className="ag-panel">
            <h2 className="admin-panel__title">{t('ops.topFeatures')}</h2>
            <div className="ag-queue">
              {(featuresQ.data ?? []).slice(0, 30).map((f) => (
                <article key={f.featureKey} className="ag-card">
                  <div className="ag-card__main" style={{ cursor: 'default' }}>
                    <span className="ag-card__identity">
                      <span className="ag-card__title">{f.featureKey}</span>
                      <span className="ag-card__meta">UV {f.uniqueUsers}</span>
                    </span>
                    <span className="ag-pill ag-pill--off">{f.eventCount}</span>
                    <span className="ag-card__chevron" aria-hidden />
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'db' && (
          <section className="admin-panel">
            <h2 className="admin-panel__title">{t('ops.slowQueries')}</h2>
            <p className="admin-panel__desc">{t('ops.slowQueryHint')}</p>
            <div className="admin-table-wrap">
              <table className="admin-ops__table">
                <thead>
                  <tr>
                    <th>{t('ops.duration')}</th>
                    <th>Query</th>
                    <th>{t('ops.sampledAt')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(dbQ.data ?? []).map((q) => (
                    <tr key={q.id}>
                      <td className={q.isSlow ? 'admin-ops__status is-red' : ''}>
                        {fmtMs(q.durationMs)}
                      </td>
                      <td className="admin-ops__mono">{q.queryPreview}</td>
                      <td>{new Date(q.sampledAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'logs' && (
          <section className="ag-panel">
            <div className="ag-toolbar">
              <ScrollCarousel
                className="chip-carousel"
                scrollerClassName="ag-chips"
                scrollerProps={{ role: 'group', 'aria-label': t('ops.kind') }}
              >
                {[
                  { value: '', label: t('ops.allKinds') },
                  { value: 'application', label: 'Application' },
                  { value: 'error', label: 'Error' },
                  { value: 'access', label: 'Access' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'login', label: 'Login' },
                  { value: 'security', label: 'Security' },
                ].map((opt) => (
                  <button
                    key={opt.value || 'all'}
                    type="button"
                    className={`ag-chip${logKind === opt.value ? ' is-active' : ''}`}
                    onClick={() => setLogKind(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </ScrollCarousel>
              <input
                className="ag-search"
                value={logQ}
                onChange={(e) => setLogQ(e.target.value)}
                placeholder={t('ops.searchPlaceholder')}
                aria-label={t('ops.searchPlaceholder')}
              />
              <div className="ag-card__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() =>
                    void opsApi
                      .downloadLogsCsv({ kind: logKind || undefined, q: logQ || undefined })
                      .catch(() => showToast(t('error'), 'error'))
                  }
                >
                  CSV
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() =>
                    void opsApi
                      .downloadLogsCsv({ kind: logKind || undefined, q: logQ || undefined })
                      .catch(() => showToast(t('error'), 'error'))
                  }
                >
                  Excel
                </button>
              </div>
            </div>
            <div className="ag-queue">
              {(logsQ.data ?? []).map((row) => {
                const rowKey = String(row.id);
                const open = expandedId === rowKey;
                return (
                  <article
                    key={rowKey}
                    className={[
                      'ag-card',
                      row.level === 'error' || row.kind === 'error' ? 'is-fail' : '',
                      open ? 'is-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <button
                      type="button"
                      className="ag-card__main"
                      onClick={() =>
                        setExpandedId((prev) => (prev === rowKey ? null : rowKey))
                      }
                    >
                      <span className="ag-card__identity">
                        <span className="ag-card__title">{row.message}</span>
                        <span className="ag-card__meta">
                          {fmtDateTime(row.loggedAt)} · {row.kind}
                        </span>
                      </span>
                      <span className={`ag-pill ${sevPill(row.level)}`}>{row.level}</span>
                      <span className="ag-card__chevron" aria-hidden>
                        {open ? '▾' : '▸'}
                      </span>
                    </button>
                    {open ? (
                      <div className="ag-card__detail">
                        <p className="ag-card__excerpt admin-ops__mono">
                          IP {row.ipAddress ?? '—'}
                        </p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === 'audit' && (
          <section className="ag-panel">
            <h2 className="admin-panel__title">{t('ops.auditTitle')}</h2>
            <p className="admin-panel__desc">{t('ops.auditImmutable')}</p>
            <div className="ag-queue">
              {(auditsQ.data ?? []).map((a) => {
                const open = expandedId === a.id;
                return (
                  <article
                    key={a.id}
                    className={`ag-card${open ? ' is-selected' : ''}`}
                  >
                    <button
                      type="button"
                      className="ag-card__main"
                      onClick={() =>
                        setExpandedId((prev) => (prev === a.id ? null : a.id))
                      }
                    >
                      <span className="ag-card__identity">
                        <span className="ag-card__title">
                          {a.action} · {a.targetType}
                        </span>
                        <span className="ag-card__meta">{fmtDateTime(a.createdAt)}</span>
                      </span>
                      <span className="ag-pill ag-pill--off">{a.actorRole}</span>
                      <span className="ag-card__chevron" aria-hidden>
                        {open ? '▾' : '▸'}
                      </span>
                    </button>
                    {open ? (
                      <div className="ag-card__detail">
                        <p className="ag-card__excerpt admin-ops__mono">
                          {t('ops.actor')}: {a.actorId?.slice(0, 8)} · Target {a.targetId} ·
                          IP {a.ipAddress ?? '—'}
                        </p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === 'alerts' && (
          <section className="ag-panel">
            <h2 className="admin-panel__title">{t('ops.alertsTitle')}</h2>
            <p className="admin-panel__desc">{t('ops.alertsChannels')}</p>
            <div className="ag-queue">
              {(alertsQ.data ?? d?.openAlerts ?? []).map((a) => {
                const open = expandedId === a.id;
                return (
                  <article
                    key={a.id}
                    className={[
                      'ag-card',
                      isFailSeverity(a.severity) ? 'is-fail' : 'is-warn',
                      open ? 'is-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <button
                      type="button"
                      className="ag-card__main"
                      onClick={() =>
                        setExpandedId((prev) => (prev === a.id ? null : a.id))
                      }
                    >
                      <span className="ag-card__identity">
                        <span className="ag-card__title">{a.title}</span>
                        <span className="ag-card__meta">{fmtDateTime(a.createdAt)}</span>
                      </span>
                      <span className={`ag-pill ${sevPill(a.severity)}`}>{a.severity}</span>
                      <span className="ag-card__chevron" aria-hidden>
                        {open ? '▾' : '▸'}
                      </span>
                    </button>
                    {open ? (
                      <div className="ag-card__detail">
                        <p className="ag-card__excerpt admin-ops__mono">{a.message}</p>
                        <div className="ag-card__actions">
                          <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={() => ackAlert.mutate(a.id)}
                          >
                            {t('ops.ack')}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === 'reports' && (
          <section className="ag-panel">
            <div className="ag-toolbar">
              <div className="ag-chips" role="group" aria-label={t('ops.tabs.reports')}>
                {(
                  [
                    { value: 'daily' as const, label: t('ops.reportDaily') },
                    { value: 'weekly' as const, label: t('ops.reportWeekly') },
                    { value: 'monthly' as const, label: t('ops.reportMonthly') },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`ag-chip${reportPeriod === opt.value ? ' is-active' : ''}`}
                    onClick={() => setReportPeriod(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="ag-card__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() =>
                    void opsApi
                      .downloadReportCsv(reportPeriod)
                      .catch(() => showToast(t('error'), 'error'))
                  }
                >
                  CSV / Excel
                </button>
              </div>
            </div>
            {reportQ.data ? (
              <section className="ag-kpis" aria-label={t('ops.tabs.reports')}>
                <div className="ag-kpi">
                  <span className="ag-kpi__value">{reportQ.data.newMembers}</span>
                  <span className="ag-kpi__label">{t('ops.newMembers')}</span>
                </div>
                <div className="ag-kpi">
                  <span className="ag-kpi__value">{reportQ.data.activeMembers}</span>
                  <span className="ag-kpi__label">{t('ops.activeMembers')}</span>
                </div>
                <div className="ag-kpi">
                  <span className="ag-kpi__value">{fmtMs(reportQ.data.apiAvgMs)}</span>
                  <span className="ag-kpi__label">{t('ops.apiAvg')}</span>
                </div>
                <div
                  className={`ag-kpi${reportQ.data.errorCount > 0 ? ' is-danger' : ''}`}
                >
                  <span className="ag-kpi__value">{reportQ.data.errorCount}</span>
                  <span className="ag-kpi__label">{t('ops.errorsToday')}</span>
                </div>
                <div className="ag-kpi">
                  <span className="ag-kpi__value">
                    {fmtNum(reportQ.data.uptimeSec / 3600, 1)}h
                  </span>
                  <span className="ag-kpi__label">Uptime</span>
                </div>
                <div className="ag-kpi">
                  <span className="ag-kpi__value">
                    {fmtPct(reportQ.data.premiumConversionRate)}
                  </span>
                  <span className="ag-kpi__label">{t('ops.premiumRate')}</span>
                </div>
              </section>
            ) : null}
          </section>
        )}

        {tab === 'security' && (
          <section className="ag-panel">
            <h2 className="admin-panel__title">{t('ops.securityTitle')}</h2>
            <div className="ag-queue">
              {(securityQ.data ?? []).map((s) => {
                const rowKey = String(s.id);
                const open = expandedId === rowKey;
                return (
                  <article
                    key={rowKey}
                    className={[
                      'ag-card',
                      isFailSeverity(s.severity) ? 'is-fail' : '',
                      open ? 'is-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <button
                      type="button"
                      className="ag-card__main"
                      onClick={() =>
                        setExpandedId((prev) => (prev === rowKey ? null : rowKey))
                      }
                    >
                      <span className="ag-card__identity">
                        <span className="ag-card__title">{s.message}</span>
                        <span className="ag-card__meta">
                          {fmtDateTime(s.occurredAt)} · {s.eventType}
                        </span>
                      </span>
                      <span className={`ag-pill ${sevPill(s.severity)}`}>{s.severity}</span>
                      <span className="ag-card__chevron" aria-hidden>
                        {open ? '▾' : '▸'}
                      </span>
                    </button>
                    {open ? (
                      <div className="ag-card__detail">
                        <p className="ag-card__excerpt admin-ops__mono">
                          IP {s.ipAddress ?? '—'}
                        </p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </AdminPageShell>
  );
}
