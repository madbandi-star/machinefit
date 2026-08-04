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
      resourceColor(resources.cpuPct),
      resourceColor(resources.memoryPct),
      resourceColor(resources.diskPct),
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
    let accepted = 0;
    for (const event of events.slice(0, max)) {
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
      await opsRepository.insertAppLog({
        level: 'info',
        kind: 'access',
        message: `page_view ${event.pathKey}`,
        userId: ctx.userId,
        ip: ctx.ip,
        meta: sanitizeOpsMeta(event.meta),
      });
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
    // Dev: sample lightly to avoid noise.
    if (!isProductionOps() && Math.random() > 0.2) return;
    await opsRepository.insertApiSample(input);
    if (input.statusCode >= 500) {
      await opsRepository.insertAppLog({
        level: 'error',
        kind: 'error',
        message: `API ${input.statusCode} ${input.routeKey}`,
        userId: input.userId,
        ip: input.ip,
        apiRoute: input.routeKey,
      });
    }
  },

  async sampleServerAndAlert(): Promise<void> {
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
      await raiseAlert({
        alertKey: 'db_down',
        severity: 'critical',
        title: 'Database connection failed',
        message: 'Health probe could not reach Postgres',
      });
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
    const health = await this.getHealth();
    const members = await opsRepository.memberStats();
    const logins = await opsRepository.loginStatsToday();
    const dau = await opsRepository.countActivity(1);
    const wau = await opsRepository.countActivity(7);
    const mau = await opsRepository.countActivity(30);
    const todayVisitors = dau;
    const weekVisitors = wau;
    const monthVisitors = mau;
    const apiAvgMs = await opsRepository.avgApiMsToday();
    const errorCountToday = await opsRepository.errorCountSince(
      new Date(new Date().setHours(0, 0, 0, 0))
    );
    const currentOnline = await opsRepository.countActiveSessions();
    const apiStats = await opsRepository.apiStats(range === 'today' || range === '7d' ? range : '30d');
    const pages = await opsRepository.pageStats(range === 'today' || range === '7d' ? range : '30d');
    const features = await opsRepository.featureStats(
      range === 'today' || range === '7d' ? range : '30d'
    );

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
        retentionD1: await opsRepository.retentionRate(1),
        retentionD7: await opsRepository.retentionRate(7),
        retentionD30: await opsRepository.retentionRate(30),
        apiAvgMs,
        errorCountToday,
        serverStatus: health.statusColor,
      },
      visitorsSeries: await opsRepository.seriesActivity(30),
      signupsSeries: await opsRepository.seriesSignups(30),
      dauSeries: await opsRepository.seriesActivity(30),
      apiLatencySeries: await opsRepository.seriesApiLatency(30),
      errorSeries: await opsRepository.seriesErrors(30),
      cpuSeries: await opsRepository.seriesServer('cpu_pct', 24),
      memorySeries: await opsRepository.seriesServer('memory_pct', 24),
      topPages: pages.slice(0, 10),
      topFeatures: features.slice(0, 10),
      slowApis: [...apiStats].sort((a, b) => b.avgMs - a.avgMs).slice(0, 20),
      recentErrors: await opsRepository.listErrorGroups({ unresolvedOnly: true, limit: 10 }),
      recentAudits: (await opsRepository.recentAudits(10)) as OpsDashboardSnapshot['recentAudits'],
      recentSignups: (await opsRepository.recentSignups(10)) as OpsDashboardSnapshot['recentSignups'],
      openAlerts: (await opsRepository.openAlerts(10)) as OpsDashboardSnapshot['openAlerts'],
      dbSlowQueries: (await opsRepository.slowQueries(10)) as OpsDashboardSnapshot['dbSlowQueries'],
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
    const members = await opsRepository.memberStats();
    const features = await opsRepository.featureStats(days <= 1 ? 'today' : days <= 7 ? '7d' : '30d');
    const pages = await opsRepository.pageStats(days <= 1 ? 'today' : days <= 7 ? '7d' : '30d');
    const errors = await opsRepository.errorCountSince(
      new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    );
    const apiAvg = await opsRepository.avgApiMsToday();
    const health = await this.getHealth();
    return {
      period,
      generatedAt: new Date().toISOString(),
      newMembers: days <= 1 ? members.today : days <= 7 ? members.week : members.month,
      activeMembers: await opsRepository.countActivity(days),
      topFeatures: features.slice(0, 10),
      topPages: pages.slice(0, 10),
      apiAvgMs: apiAvg,
      errorCount: errors,
      uptimeSec: health.uptimeSec,
      premiumConversionRate: members.total ? members.paid / members.total : null,
    };
  },
};
