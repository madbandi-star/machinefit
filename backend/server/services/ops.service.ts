import { createHash } from 'node:crypto';
import type {
  OpsDashboardSnapshot,
  OpsHealthSnapshot,
  OpsIngestEvent,
  OpsRange,
  OpsSeverity,
  OpsStatusColor,
} from '@machinefit/shared';
import { checkDatabaseConnection, getPool } from '../config/database.js';
import { env } from '../config/env.js';
import { storageService } from './storage.service.js';
import { opsRepository } from '../repositories/ops.repository.js';
import {
  getBuildTime,
  getBuildVersion,
  getRestartCount,
  getUptimeSec,
  isProductionOps,
  sampleProcessResources,
  sanitizeOpsMeta,
} from '../ops/ops-runtime.js';
import { dispatchOpsAlert } from '../ops/ops-alert-channels.js';

async function raiseAlert(input: {
  alertKey: string;
  severity: string;
  title: string;
  message: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const created = await opsRepository.insertAlert(input);
  if (created) {
    void dispatchOpsAlert({
      alertKey: input.alertKey,
      severity: input.severity,
      title: input.title,
      message: input.message,
    });
    // Dual-path DR notifier (webhook / Sentry structure) — never throws.
    void import('../ops/dr-alerts.js')
      .then(({ notifyDrAlert }) =>
        notifyDrAlert({
          alertKey: input.alertKey,
          severity:
            input.severity === 'critical'
              ? 'critical'
              : input.severity === 'info'
                ? 'info'
                : 'warning',
          title: input.title,
          message: input.message,
          meta: input.meta,
        })
      )
      .catch(() => undefined);
  }
}

function statusColorFrom(parts: Array<'ok' | 'degraded' | 'down' | 'not_configured'>): OpsStatusColor {
  if (parts.some((p) => p === 'down')) return 'red';
  if (parts.some((p) => p === 'degraded' || p === 'not_configured')) return 'yellow';
  return 'green';
}

function resourceColor(pct: number | null): OpsStatusColor {
  if (pct == null) return 'yellow';
  if (pct >= 90) return 'red';
  if (pct >= 75) return 'yellow';
  return 'green';
}

/**
 * Host CPU/memory/disk on shared PaaS (Render free) often sits near red.
 * Keep those as yellow for overall statusColor so liveness/ops "server status"
 * isn't permanently critical; sampleServerAndAlert still raises real alerts.
 */
function hostResourceColor(pct: number | null): OpsStatusColor {
  const c = resourceColor(pct);
  return c === 'red' ? 'yellow' : c;
}

export const opsService = {
  async getHealth(): Promise<OpsHealthSnapshot> {
    const resources = sampleProcessResources();
    const dbOk = await Promise.race([
      checkDatabaseConnection(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1500)),
    ]);
    const pool = getPool();
    const dbStatus = !env.DATABASE_URL
      ? 'not_configured'
      : dbOk
        ? 'ok'
        : 'down';

    let storage: OpsHealthSnapshot['storage'] = 'not_configured';
    try {
      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
        storage = 'ok';
      } else if (storageService.localUploadRoot) {
        storage = 'ok';
      }
    } catch {
      storage = 'degraded';
    }

    const supabase: OpsHealthSnapshot['supabase'] =
      env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
        ? dbOk
          ? 'ok'
          : 'degraded'
        : 'not_configured';

    const server: OpsHealthSnapshot['server'] =
      resources.memoryPct >= 95 || (resources.cpuPct != null && resources.cpuPct >= 95)
        ? 'degraded'
        : 'ok';

    const colorCandidates: OpsStatusColor[] = [
      statusColorFrom([server, dbStatus, storage, supabase]),
      hostResourceColor(resources.cpuPct),
      hostResourceColor(resources.memoryPct),
      hostResourceColor(resources.diskPct),
    ];
    const statusColor: OpsStatusColor = colorCandidates.includes('red')
      ? 'red'
      : colorCandidates.includes('yellow')
        ? 'yellow'
        : 'green';

    return {
      server,
      database: dbStatus,
      storage,
      version: getBuildVersion(),
      buildTime: getBuildTime(),
      uptimeSec: getUptimeSec(),
      restartCount: getRestartCount(),
      cpuPct: resources.cpuPct,
      memoryPct: resources.memoryPct,
      diskPct: resources.diskPct,
      supabase,
      dbPool: {
        total: pool?.totalCount ?? null,
        idle: pool?.idleCount ?? null,
        waiting: pool?.waitingCount ?? null,
      },
      statusColor,
      checkedAt: new Date().toISOString(),
    };
  },

  async ingest(
    events: OpsIngestEvent[],
    ctx: { userId?: string | null; ip?: string | null; userAgent?: string | null }
  ): Promise<{ accepted: number }> {
    if (!events?.length) return { accepted: 0 };
    const max = isProductionOps() ? 50 : 10;
    const slice = events.slice(0, max);
    const sessionPings = slice.filter((e) => e.type === 'session_ping');
    const others = slice.filter((e) => e.type !== 'session_ping');
    let accepted = 0;

    // Coalesce heartbeats: 1 activity touch + unique session upserts (not N×2).
    try {
      if (sessionPings.length > 0) {
        if (ctx.userId) {
          await opsRepository.touchUserActivity(ctx.userId);
        }
        const seen = new Set<string>();
        for (const event of sessionPings) {
          if (!event.sessionId || seen.has(event.sessionId)) {
            accepted += 1;
            continue;
          }
          seen.add(event.sessionId);
          await opsRepository.upsertActiveSession({
            sessionId: event.sessionId,
            userId: ctx.userId,
            pathKey: event.pathKey,
            ip: ctx.ip,
            userAgent: ctx.userAgent,
          });
          accepted += 1;
        }
      }
    } catch {
      /* never fail the batch */
    }

    for (const event of others) {
      try {
        await this.ingestOne(event, ctx);
        accepted += 1;
      } catch {
        /* never fail the batch for a single bad event */
      }
    }
    return { accepted };
  },

  async ingestOne(
    event: OpsIngestEvent,
    ctx: { userId?: string | null; ip?: string | null; userAgent?: string | null }
  ): Promise<void> {
    if (ctx.userId) {
      await opsRepository.touchUserActivity(ctx.userId);
    }
    if (event.sessionId) {
      await opsRepository.upsertActiveSession({
        sessionId: event.sessionId,
        userId: ctx.userId,
        pathKey: event.pathKey,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    }

    if (event.type === 'page_view' && event.pathKey) {
      await opsRepository.upsertPageStat({
        pathKey: event.pathKey,
        dwellMs: event.dwellMs,
        uniqueUserId: ctx.userId,
        isEntrance: event.isEntrance,
        isExit: event.isExit,
        isBounce: event.isBounce,
      });
      // Access logs are high-volume; sample in production (errors still full-fidelity).
      if (!isProductionOps() || Math.random() < 0.1) {
        await opsRepository.insertAppLog({
          level: 'info',
          kind: 'access',
          message: `page_view ${event.pathKey}`,
          userId: ctx.userId,
          ip: ctx.ip,
          meta: sanitizeOpsMeta(event.meta),
        });
      }
      return;
    }

    if (event.type === 'feature' && event.featureKey) {
      await opsRepository.upsertFeatureStat(event.featureKey, ctx.userId);
      return;
    }

    if (event.type === 'error' && event.error?.title) {
      const severity = (event.error.severity ?? 'medium') as OpsSeverity;
      await opsRepository.insertErrorEvent({
        title: event.error.title,
        severity,
        source: event.error.source ?? 'frontend',
        message: event.error.message,
        stack: event.error.stack,
        url: event.error.url ?? event.pathKey,
        userId: ctx.userId,
        browser: event.browser,
        os: event.os,
        device: event.device,
        appVersion: event.appVersion,
        fingerprint: event.error.fingerprint,
        meta: event.meta,
      });
      await opsRepository.insertAppLog({
        level: 'error',
        kind: 'error',
        message: event.error.title,
        userId: ctx.userId,
        ip: ctx.ip,
        meta: { source: event.error.source ?? 'frontend' },
      });
      if (severity === 'critical' || severity === 'high') {
        await raiseAlert({
          alertKey: `error:${event.error.fingerprint ?? event.error.title.slice(0, 40)}`,
          severity,
          title: `Error: ${event.error.title.slice(0, 120)}`,
          message: event.error.message ?? event.error.title,
        });
      }
      return;
    }

    if (event.type === 'security') {
      await opsRepository.insertSecurityEvent({
        eventType: String(event.meta?.eventType ?? 'client_security'),
        severity: String(event.meta?.severity ?? 'medium'),
        userId: ctx.userId,
        ip: ctx.ip,
        path: event.pathKey,
        message: String(event.meta?.message ?? 'security event'),
        meta: event.meta,
      });
      return;
    }

    if (event.type === 'pwa') {
      await opsRepository.upsertFeatureStat(
        String(event.featureKey ?? 'pwa_event'),
        ctx.userId
      );
    }
  },

  async recordApiMetric(input: {
    method: string;
    routeKey: string;
    statusCode: number;
    durationMs: number;
    userId?: string | null;
    ip?: string | null;
  }): Promise<void> {
    try {
      const isError = input.statusCode >= 500;
      // Always keep 5xx; sample successes so ops writes do not saturate the pool.
      if (!isError) {
        if (isProductionOps()) {
          if (Math.random() > env.OPS_API_SAMPLE_RATE) return;
        } else if (Math.random() > 0.2) {
          return;
        }
      }
      await opsRepository.insertApiSample(input);
      if (isError) {
        await opsRepository.insertAppLog({
          level: 'error',
          kind: 'error',
          message: `API ${input.statusCode} ${input.routeKey}`,
          userId: input.userId,
          ip: input.ip,
          apiRoute: input.routeKey,
        });
      }
    } catch {
      /* missing migration / DB blip must never crash the API process */
    }
  },

  async sampleServerAndAlert(): Promise<void> {
    try {
      const resources = sampleProcessResources();
      await opsRepository.insertServerSample({
        cpuPct: resources.cpuPct,
        memoryPct: resources.memoryPct,
        memoryUsedMb: resources.memoryUsedMb,
        memoryTotalMb: resources.memoryTotalMb,
        diskPct: resources.diskPct,
        load1: resources.load1,
        uptimeSec: getUptimeSec(),
        restartCount: getRestartCount(),
        buildVersion: getBuildVersion(),
      });

      if (resources.memoryPct >= 90) {
        await raiseAlert({
          alertKey: 'memory_high',
          severity: 'critical',
          title: 'Memory usage ≥ 90%',
          message: `Memory at ${resources.memoryPct.toFixed(1)}%`,
        });
      }
      if (resources.cpuPct != null && resources.cpuPct >= 90) {
        await raiseAlert({
          alertKey: 'cpu_high',
          severity: 'critical',
          title: 'CPU usage ≥ 90%',
          message: `CPU at ${resources.cpuPct.toFixed(1)}%`,
        });
      }
      if (resources.diskPct != null && resources.diskPct >= 90) {
        await raiseAlert({
          alertKey: 'disk_high',
          severity: 'critical',
          title: 'Disk usage ≥ 90%',
          message: `Disk at ${resources.diskPct.toFixed(1)}%`,
        });
      }

      const dbOk = await checkDatabaseConnection();
      if (env.DATABASE_URL && !dbOk) {
        // One reconnect attempt before alerting (DR recovery).
        const { resetPool } = await import('../config/database.js');
        resetPool();
        const retried = await checkDatabaseConnection();
        if (!retried) {
          await raiseAlert({
            alertKey: 'db_down',
            severity: 'critical',
            title: 'Database connection failed',
            message: 'Health probe could not reach Postgres',
          });
        }
      }
    } catch {
      /* never crash the process from sampling */
    }
  },

  async recordSlowQuery(sql: string, durationMs: number): Promise<void> {
    if (durationMs < 500) return;
    const preview = sql.replace(/\s+/g, ' ').trim().slice(0, 500);
    const fingerprint = createHash('sha256').update(preview).digest('hex').slice(0, 32);
    await opsRepository.insertDbQuerySample({
      fingerprint,
      preview,
      durationMs,
      isSlow: true,
    });
  },

  async getDashboard(range: OpsRange = '30d'): Promise<OpsDashboardSnapshot> {
    const statsRange = range === 'today' || range === '7d' ? range : '30d';
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    // Parallel fan-out — same KPI/series payloads, lower wall-clock under load.
    const [
      health,
      members,
      logins,
      dau,
      wau,
      mau,
      apiAvgMs,
      errorCountToday,
      currentOnline,
      apiStats,
      pages,
      features,
      retentionD1,
      retentionD7,
      retentionD30,
      activitySeries,
      signupsSeries,
      apiLatencySeries,
      errorSeries,
      cpuSeries,
      memorySeries,
      recentErrors,
      recentAudits,
      recentSignups,
      openAlerts,
      dbSlowQueries,
    ] = await Promise.all([
      this.getHealth(),
      opsRepository.memberStats(),
      opsRepository.loginStatsToday(),
      opsRepository.countActivity(1),
      opsRepository.countActivity(7),
      opsRepository.countActivity(30),
      opsRepository.avgApiMsToday(),
      opsRepository.errorCountSince(todayStart),
      opsRepository.countActiveSessions(),
      opsRepository.apiStats(statsRange),
      opsRepository.pageStats(statsRange),
      opsRepository.featureStats(statsRange),
      opsRepository.retentionRate(1),
      opsRepository.retentionRate(7),
      opsRepository.retentionRate(30),
      opsRepository.seriesActivity(30), // shared by visitorsSeries + dauSeries
      opsRepository.seriesSignups(30),
      opsRepository.seriesApiLatency(30),
      opsRepository.seriesErrors(30),
      opsRepository.seriesServer('cpu_pct', 24),
      opsRepository.seriesServer('memory_pct', 24),
      opsRepository.listErrorGroups({ unresolvedOnly: true, limit: 10 }),
      opsRepository.recentAudits(10),
      opsRepository.recentSignups(10),
      opsRepository.openAlerts(10),
      opsRepository.slowQueries(10),
    ]);

    const todayVisitors = dau;
    const weekVisitors = wau;
    const monthVisitors = mau;
    const paid = members.paid;
    const total = Math.max(1, members.total);
    const stickiness = mau > 0 ? dau / mau : null;

    return {
      health,
      kpi: {
        currentOnline,
        todayVisitors,
        weekVisitors,
        monthVisitors,
        totalMembers: members.total,
        todaySignups: members.today,
        weekSignups: members.week,
        monthSignups: members.month,
        todayLogins: logins.logins,
        returningRate: logins.distinctUsers > 0 ? null : null,
        newUsersToday: members.today,
        returningUsersToday: Math.max(0, logins.distinctUsers - members.today),
        freeMembers: members.free,
        paidMembers: paid,
        premiumConversionRate: paid / total,
        dau,
        wau,
        mau,
        stickiness,
        retentionD1,
        retentionD7,
        retentionD30,
        apiAvgMs,
        errorCountToday,
        serverStatus: health.statusColor,
      },
      visitorsSeries: activitySeries,
      signupsSeries,
      dauSeries: activitySeries,
      apiLatencySeries,
      errorSeries,
      cpuSeries,
      memorySeries,
      topPages: pages.slice(0, 10),
      topFeatures: features.slice(0, 10),
      slowApis: [...apiStats].sort((a, b) => b.avgMs - a.avgMs).slice(0, 20),
      recentErrors,
      recentAudits: recentAudits as OpsDashboardSnapshot['recentAudits'],
      recentSignups: recentSignups as OpsDashboardSnapshot['recentSignups'],
      openAlerts: openAlerts as OpsDashboardSnapshot['openAlerts'],
      dbSlowQueries: dbSlowQueries as OpsDashboardSnapshot['dbSlowQueries'],
    };
  },

  listErrors: (unresolvedOnly?: boolean) =>
    opsRepository.listErrorGroups({ unresolvedOnly, limit: 50 }),
  apiStats: (range: OpsRange) => opsRepository.apiStats(range),
  pageStats: (range: OpsRange) => opsRepository.pageStats(range),
  featureStats: (range: OpsRange) => opsRepository.featureStats(range),
  searchLogs: opsRepository.searchLogs,
  securityEvents: opsRepository.securityEvents,
  recentAudits: opsRepository.recentAudits,
  openAlerts: opsRepository.openAlerts,
  acknowledgeAlert: opsRepository.acknowledgeAlert,
  resolveErrorGroup: opsRepository.resolveErrorGroup,
  slowQueries: opsRepository.slowQueries,
  pruneRetention: opsRepository.pruneRetention,

  async buildReport(period: 'daily' | 'weekly' | 'monthly') {
    const days = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
    const featureRange = days <= 1 ? 'today' : days <= 7 ? '7d' : '30d';
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [members, features, pages, errors, apiAvg, health, activeMembers] = await Promise.all([
      opsRepository.memberStats(),
      opsRepository.featureStats(featureRange),
      opsRepository.pageStats(featureRange),
      opsRepository.errorCountSince(since),
      opsRepository.avgApiMsToday(),
      this.getHealth(),
      opsRepository.countActivity(days),
    ]);
    return {
      period,
      generatedAt: new Date().toISOString(),
      newMembers: days <= 1 ? members.today : days <= 7 ? members.week : members.month,
      activeMembers,
      topFeatures: features.slice(0, 10),
      topPages: pages.slice(0, 10),
      apiAvgMs: apiAvg,
      errorCount: errors,
      uptimeSec: health.uptimeSec,
      premiumConversionRate: members.total ? members.paid / members.total : null,
    };
  },
};
