import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { OpsRange, OpsSeriesPoint, OpsStatusColor } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { opsApi } from '@/api/ops.api';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
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
      <div className="admin-ops">
        <div className="admin-ops__filters">
          <label>
            {t('ops.range')}{' '}
            <select value={range} onChange={(e) => setRange(e.target.value as OpsRange)}>
              <option value="today">{t('ops.rangeToday')}</option>
              <option value="7d">{t('ops.range7d')}</option>
              <option value="30d">{t('ops.range30d')}</option>
              <option value="90d">{t('ops.range90d')}</option>
              <option value="1y">{t('ops.range1y')}</option>
            </select>
          </label>
        </div>

        <nav className="admin-ops__tabs" aria-label={t('ops.title')}>
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              className={`admin-ops__tab${tab === id ? ' is-active' : ''}`}
              onClick={() => setTab(id)}
            >
              {t(`ops.tabs.${id}`)}
            </button>
          ))}
        </nav>

        {tab === 'overview' && kpi && health && (
          <>
            <section className="admin-ops__kpi-grid" aria-label={t('ops.kpi')}>
              <div className="admin-ops__kpi">
                <div className="admin-ops__kpi-label">{t('ops.currentOnline')}</div>
                <div className="admin-ops__kpi-value">{fmtNum(kpi.currentOnline)}</div>
              </div>
              <div className="admin-ops__kpi">
                <div className="admin-ops__kpi-label">{t('ops.todaySignups')}</div>
                <div className="admin-ops__kpi-value">{fmtNum(kpi.todaySignups)}</div>
              </div>
              <div className="admin-ops__kpi">
                <div className="admin-ops__kpi-label">DAU</div>
                <div className="admin-ops__kpi-value">{fmtNum(kpi.dau)}</div>
              </div>
              <div className="admin-ops__kpi">
                <div className="admin-ops__kpi-label">{t('ops.apiAvg')}</div>
                <div className={`admin-ops__kpi-value ${speedClass(kpi.apiAvgMs ?? 0)}`}>
                  <span className={`admin-ops__status ${speedClass(kpi.apiAvgMs ?? 0)}`}>
                    {fmtMs(kpi.apiAvgMs)}
                  </span>
                </div>
              </div>
              <div className="admin-ops__kpi">
                <div className="admin-ops__kpi-label">{t('ops.serverStatus')}</div>
                <div className="admin-ops__kpi-value">
                  <span className={`admin-ops__status ${statusClass(kpi.serverStatus)}`}>
                    <span className="admin-ops__dot" />
                    {kpi.serverStatus}
                  </span>
                </div>
              </div>
              <div className="admin-ops__kpi">
                <div className="admin-ops__kpi-label">{t('ops.errorsToday')}</div>
                <div className="admin-ops__kpi-value">{fmtNum(kpi.errorCountToday)}</div>
              </div>
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
                      <span>{u.displayName || u.email}</span>
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
          <section className="admin-panel">
            <h2 className="admin-panel__title">{t('ops.unresolvedErrors')}</h2>
            <div className="admin-table-wrap">
              <table className="admin-ops__table">
                <thead>
                  <tr>
                    <th>{t('ops.severity')}</th>
                    <th>{t('ops.errorTitle')}</th>
                    <th>{t('ops.count')}</th>
                    <th>{t('ops.firstSeen')}</th>
                    <th>{t('ops.lastSeen')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {(errorsQ.data ?? []).map((e) => (
                    <tr key={e.id}>
                      <td>
                        <span className={`admin-ops__sev is-${e.severity}`}>{e.severity}</span>
                      </td>
                      <td>
                        <div>{e.title}</div>
                        <div className="admin-ops__mono">{e.sampleUrl}</div>
                      </td>
                      <td>{e.occurrenceCount}</td>
                      <td>{new Date(e.firstSeenAt).toLocaleString()}</td>
                      <td>{new Date(e.lastSeenAt).toLocaleString()}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn--secondary"
                          onClick={() => resolveErr.mutate(e.id)}
                        >
                          {t('ops.resolve')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          <section className="admin-panel">
            <div className="admin-ops__filters">
              <label>
                {t('ops.range')}{' '}
                <select
                  value={apiRange}
                  onChange={(e) => setApiRange(e.target.value as OpsRange)}
                >
                  <option value="today">{t('ops.rangeToday')}</option>
                  <option value="7d">{t('ops.range7d')}</option>
                  <option value="30d">{t('ops.range30d')}</option>
                </select>
              </label>
            </div>
            <h2 className="admin-panel__title">{t('ops.slowApis')}</h2>
            <div className="admin-table-wrap">
              <table className="admin-ops__table">
                <thead>
                  <tr>
                    <th>API</th>
                    <th>Avg</th>
                    <th>P95</th>
                    <th>P99</th>
                    <th>{t('ops.calls')}</th>
                    <th>{t('ops.failRate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {apiSorted.slow.map((a) => (
                    <tr key={`s-${a.method}-${a.routeKey}`}>
                      <td className="admin-ops__mono">
                        {a.method} {a.routeKey}
                      </td>
                      <td className={`admin-ops__status ${a.speedColor}`}>{fmtMs(a.avgMs)}</td>
                      <td>{fmtMs(a.p95Ms)}</td>
                      <td>{fmtMs(a.p99Ms)}</td>
                      <td>{a.callCount}</td>
                      <td>{fmtPct(a.failRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2 className="admin-panel__title">{t('ops.failApis')}</h2>
            <ul className="admin-ops__list">
              {apiSorted.fail.map((a) => (
                <li key={`f-${a.method}-${a.routeKey}`}>
                  <span className="admin-ops__mono">
                    {a.method} {a.routeKey}
                  </span>
                  <span className="admin-ops__list-meta">{fmtPct(a.failRate)}</span>
                </li>
              ))}
            </ul>
            <h2 className="admin-panel__title">{t('ops.hotApis')}</h2>
            <ul className="admin-ops__list">
              {apiSorted.hot.map((a) => (
                <li key={`h-${a.method}-${a.routeKey}`}>
                  <span className="admin-ops__mono">
                    {a.method} {a.routeKey}
                  </span>
                  <span className="admin-ops__list-meta">{a.callCount}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === 'users' && kpi && (
          <section className="admin-panel">
            <h2 className="admin-panel__title">{t('ops.userStats')}</h2>
            <div className="admin-stats">
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtNum(kpi.currentOnline)}</div>
                <div className="admin-stat__label">{t('ops.currentOnline')}</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtNum(kpi.todayVisitors)}</div>
                <div className="admin-stat__label">{t('ops.todayVisitors')}</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtNum(kpi.weekVisitors)}</div>
                <div className="admin-stat__label">{t('ops.weekVisitors')}</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtNum(kpi.monthVisitors)}</div>
                <div className="admin-stat__label">{t('ops.monthVisitors')}</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtNum(kpi.totalMembers)}</div>
                <div className="admin-stat__label">{t('ops.totalMembers')}</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtNum(kpi.todaySignups)}</div>
                <div className="admin-stat__label">{t('ops.todaySignups')}</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtNum(kpi.weekSignups)}</div>
                <div className="admin-stat__label">{t('ops.weekSignups')}</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtNum(kpi.monthSignups)}</div>
                <div className="admin-stat__label">{t('ops.monthSignups')}</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtNum(kpi.todayLogins)}</div>
                <div className="admin-stat__label">{t('ops.todayLogins')}</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtNum(kpi.dau)}</div>
                <div className="admin-stat__label">DAU</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtNum(kpi.wau)}</div>
                <div className="admin-stat__label">WAU</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtNum(kpi.mau)}</div>
                <div className="admin-stat__label">MAU</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtPct(kpi.stickiness)}</div>
                <div className="admin-stat__label">Stickiness</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtPct(kpi.retentionD1)}</div>
                <div className="admin-stat__label">Retention D1</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtPct(kpi.retentionD7)}</div>
                <div className="admin-stat__label">Retention D7</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtPct(kpi.retentionD30)}</div>
                <div className="admin-stat__label">Retention D30</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtNum(kpi.freeMembers)}</div>
                <div className="admin-stat__label">{t('ops.freeMembers')}</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtNum(kpi.paidMembers)}</div>
                <div className="admin-stat__label">{t('ops.paidMembers')}</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__value">{fmtPct(kpi.premiumConversionRate)}</div>
                <div className="admin-stat__label">{t('ops.premiumRate')}</div>
              </div>
            </div>
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
          <section className="admin-panel">
            <h2 className="admin-panel__title">{t('ops.topPages')}</h2>
            <ul className="admin-ops__list">
              {pageSorted.popular.map((p) => (
                <li key={`p-${p.pathKey}`}>
                  <span className="admin-ops__mono">{p.pathKey}</span>
                  <span className="admin-ops__list-meta">
                    PV {p.pageViews} · UV {p.uniqueVisitors} ·{' '}
                    {fmtNum(p.avgDwellMs / 1000, 1)}s
                  </span>
                </li>
              ))}
            </ul>
            <h2 className="admin-panel__title">{t('ops.dwellTop')}</h2>
            <ul className="admin-ops__list">
              {pageSorted.dwell.map((p) => (
                <li key={`d-${p.pathKey}`}>
                  <span className="admin-ops__mono">{p.pathKey}</span>
                  <span className="admin-ops__list-meta">{fmtNum(p.avgDwellMs / 1000, 1)}s</span>
                </li>
              ))}
            </ul>
            <h2 className="admin-panel__title">{t('ops.bounceTop')}</h2>
            <ul className="admin-ops__list">
              {pageSorted.bounce.map((p) => (
                <li key={`b-${p.pathKey}`}>
                  <span className="admin-ops__mono">{p.pathKey}</span>
                  <span className="admin-ops__list-meta">{fmtPct(p.bounceRate)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === 'features' && (
          <section className="admin-panel">
            <h2 className="admin-panel__title">{t('ops.topFeatures')}</h2>
            <ul className="admin-ops__list">
              {(featuresQ.data ?? []).slice(0, 30).map((f) => (
                <li key={f.featureKey}>
                  <span>{f.featureKey}</span>
                  <span className="admin-ops__list-meta">
                    {f.eventCount} · UV {f.uniqueUsers}
                  </span>
                </li>
              ))}
            </ul>
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
          <section className="admin-panel">
            <div className="admin-ops__filters">
              <select value={logKind} onChange={(e) => setLogKind(e.target.value)}>
                <option value="">{t('ops.allKinds')}</option>
                <option value="application">Application</option>
                <option value="error">Error</option>
                <option value="access">Access</option>
                <option value="admin">Admin</option>
                <option value="login">Login</option>
                <option value="security">Security</option>
              </select>
              <input
                value={logQ}
                onChange={(e) => setLogQ(e.target.value)}
                placeholder={t('ops.searchPlaceholder')}
              />
              <div className="admin-ops__actions">
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
            <div className="admin-table-wrap">
              <table className="admin-ops__table">
                <thead>
                  <tr>
                    <th>{t('ops.time')}</th>
                    <th>{t('ops.kind')}</th>
                    <th>{t('ops.level')}</th>
                    <th>{t('ops.message')}</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {(logsQ.data ?? []).map((row) => (
                    <tr key={row.id}>
                      <td>{new Date(row.loggedAt).toLocaleString()}</td>
                      <td>{row.kind}</td>
                      <td>{row.level}</td>
                      <td>{row.message}</td>
                      <td className="admin-ops__mono">{row.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'audit' && (
          <section className="admin-panel">
            <h2 className="admin-panel__title">{t('ops.auditTitle')}</h2>
            <p className="admin-panel__desc">{t('ops.auditImmutable')}</p>
            <div className="admin-table-wrap">
              <table className="admin-ops__table">
                <thead>
                  <tr>
                    <th>{t('ops.time')}</th>
                    <th>{t('ops.actor')}</th>
                    <th>{t('ops.action')}</th>
                    <th>Target</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {(auditsQ.data ?? []).map((a) => (
                    <tr key={a.id}>
                      <td>{new Date(a.createdAt).toLocaleString()}</td>
                      <td className="admin-ops__mono">
                        {a.actorId?.slice(0, 8)} · {a.actorRole}
                      </td>
                      <td>{a.action}</td>
                      <td>
                        {a.targetType} {a.targetId}
                      </td>
                      <td className="admin-ops__mono">{a.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'alerts' && (
          <section className="admin-panel">
            <h2 className="admin-panel__title">{t('ops.alertsTitle')}</h2>
            <p className="admin-panel__desc">{t('ops.alertsChannels')}</p>
            <ul className="admin-ops__list">
              {(alertsQ.data ?? d?.openAlerts ?? []).map((a) => (
                <li key={a.id}>
                  <span>
                    <span className={`admin-ops__sev is-${a.severity}`}>{a.severity}</span>{' '}
                    {a.title} — {a.message}
                  </span>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => ackAlert.mutate(a.id)}
                  >
                    {t('ops.ack')}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === 'reports' && (
          <section className="admin-panel">
            <div className="admin-ops__filters">
              <select
                value={reportPeriod}
                onChange={(e) =>
                  setReportPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')
                }
              >
                <option value="daily">{t('ops.reportDaily')}</option>
                <option value="weekly">{t('ops.reportWeekly')}</option>
                <option value="monthly">{t('ops.reportMonthly')}</option>
              </select>
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
            {reportQ.data && (
              <div className="admin-stats">
                <div className="admin-stat">
                  <div className="admin-stat__value">{reportQ.data.newMembers}</div>
                  <div className="admin-stat__label">{t('ops.newMembers')}</div>
                </div>
                <div className="admin-stat">
                  <div className="admin-stat__value">{reportQ.data.activeMembers}</div>
                  <div className="admin-stat__label">{t('ops.activeMembers')}</div>
                </div>
                <div className="admin-stat">
                  <div className="admin-stat__value">{fmtMs(reportQ.data.apiAvgMs)}</div>
                  <div className="admin-stat__label">{t('ops.apiAvg')}</div>
                </div>
                <div className="admin-stat">
                  <div className="admin-stat__value">{reportQ.data.errorCount}</div>
                  <div className="admin-stat__label">{t('ops.errorsToday')}</div>
                </div>
                <div className="admin-stat">
                  <div className="admin-stat__value">
                    {fmtNum(reportQ.data.uptimeSec / 3600, 1)}h
                  </div>
                  <div className="admin-stat__label">Uptime</div>
                </div>
                <div className="admin-stat">
                  <div className="admin-stat__value">
                    {fmtPct(reportQ.data.premiumConversionRate)}
                  </div>
                  <div className="admin-stat__label">{t('ops.premiumRate')}</div>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === 'security' && (
          <section className="admin-panel">
            <h2 className="admin-panel__title">{t('ops.securityTitle')}</h2>
            <div className="admin-table-wrap">
              <table className="admin-ops__table">
                <thead>
                  <tr>
                    <th>{t('ops.time')}</th>
                    <th>{t('ops.kind')}</th>
                    <th>{t('ops.severity')}</th>
                    <th>{t('ops.message')}</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {(securityQ.data ?? []).map((s) => (
                    <tr key={s.id}>
                      <td>{new Date(s.occurredAt).toLocaleString()}</td>
                      <td>{s.eventType}</td>
                      <td>
                        <span className={`admin-ops__sev is-${s.severity}`}>{s.severity}</span>
                      </td>
                      <td>{s.message}</td>
                      <td className="admin-ops__mono">{s.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </AdminPageShell>
  );
}
