import { createHash } from 'node:crypto';
import { getPool } from '../config/database.js';
import type {
  OpsApiRouteStat,
  OpsErrorGroupRow,
  OpsFeatureStat,
  OpsLogKind,
  OpsPageStat,
  OpsRange,
  OpsSeverity,
} from '@machinefit/shared';
import { percentile, sanitizeOpsMeta, speedColor } from '../ops/ops-runtime.js';

function pool() {
  return getPool();
}

function rangeStart(range: OpsRange): Date {
  const now = new Date();
  if (range === 'today') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export function fingerprintError(title: string, stack?: string | null, source?: string): string {
  const base = `${source ?? ''}|${title}|${(stack ?? '').split('\n').slice(0, 4).join('|')}`;
  return createHash('sha256').update(base).digest('hex').slice(0, 32);
}

export const opsRepository = {
  async insertErrorEvent(input: {
    title: string;
    severity: OpsSeverity;
    source: string;
    message?: string;
    stack?: string | null;
    url?: string | null;
    userId?: string | null;
    browser?: string | null;
    os?: string | null;
    device?: string | null;
    appVersion?: string | null;
    fingerprint?: string;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    const db = pool();
    if (!db) return;
    const fp = input.fingerprint || fingerprintError(input.title, input.stack, input.source);
    const meta = sanitizeOpsMeta(input.meta ?? {});
    const group = await db.query<{ id: string }>(
      `INSERT INTO ops_error_groups
         (fingerprint, title, severity, source, sample_stack, sample_url, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
       ON CONFLICT (fingerprint) DO UPDATE SET
         last_seen_at = NOW(),
         occurrence_count = ops_error_groups.occurrence_count + 1,
         severity = CASE
           WHEN ops_error_groups.severity = 'critical' OR EXCLUDED.severity = 'critical' THEN 'critical'
           WHEN ops_error_groups.severity = 'high' OR EXCLUDED.severity = 'high' THEN 'high'
           WHEN ops_error_groups.severity = 'medium' OR EXCLUDED.severity = 'medium' THEN 'medium'
           ELSE EXCLUDED.severity
         END,
         sample_stack = COALESCE(EXCLUDED.sample_stack, ops_error_groups.sample_stack),
         sample_url = COALESCE(EXCLUDED.sample_url, ops_error_groups.sample_url),
         updated_at = NOW(),
         resolved = FALSE
       RETURNING id`,
      [
        fp,
        input.title.slice(0, 400),
        input.severity,
        input.source.slice(0, 40),
        input.stack?.slice(0, 8000) ?? null,
        input.url?.slice(0, 1000) ?? null,
        JSON.stringify(meta),
      ]
    );
    const groupId = group.rows[0]?.id;
    if (!groupId) return;
    await db.query(
      `INSERT INTO ops_error_events
         (group_id, user_id, url, browser, os, device, app_version, message, stack, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
      [
        groupId,
        input.userId ?? null,
        input.url ?? null,
        input.browser ?? null,
        input.os ?? null,
        input.device ?? null,
        input.appVersion ?? null,
        input.message ?? null,
        input.stack?.slice(0, 8000) ?? null,
        JSON.stringify(meta),
      ]
    );
  },

  async insertApiSample(input: {
    method: string;
    routeKey: string;
    statusCode: number;
    durationMs: number;
    userId?: string | null;
  }): Promise<void> {
    const db = pool();
    if (!db) return;
    await db.query(
      `INSERT INTO ops_api_latency_samples (method, route_key, status_code, duration_ms, user_id)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        input.method.slice(0, 12),
        input.routeKey.slice(0, 200),
        input.statusCode,
        Math.max(0, Math.round(input.durationMs)),
        input.userId ?? null,
      ]
    );
  },

  async upsertPageStat(input: {
    pathKey: string;
    dwellMs?: number;
    uniqueUserId?: string | null;
    isEntrance?: boolean;
    isExit?: boolean;
    isBounce?: boolean;
  }): Promise<void> {
    const db = pool();
    if (!db) return;
    await db.query(
      `INSERT INTO ops_page_stats_daily
         (day, path_key, page_views, unique_visitors, total_dwell_ms, bounce_count, entrances, exits)
       VALUES (CURRENT_DATE, $1, 1, $2, $3, $4, $5, $6)
       ON CONFLICT (day, path_key) DO UPDATE SET
         page_views = ops_page_stats_daily.page_views + 1,
         unique_visitors = ops_page_stats_daily.unique_visitors + EXCLUDED.unique_visitors,
         total_dwell_ms = ops_page_stats_daily.total_dwell_ms + EXCLUDED.total_dwell_ms,
         bounce_count = ops_page_stats_daily.bounce_count + EXCLUDED.bounce_count,
         entrances = ops_page_stats_daily.entrances + EXCLUDED.entrances,
         exits = ops_page_stats_daily.exits + EXCLUDED.exits`,
      [
        input.pathKey.slice(0, 200),
        input.uniqueUserId ? 1 : 0,
        Math.max(0, Math.round(input.dwellMs ?? 0)),
        input.isBounce ? 1 : 0,
        input.isEntrance ? 1 : 0,
        input.isExit ? 1 : 0,
      ]
    );
  },

  async upsertFeatureStat(featureKey: string, userId?: string | null): Promise<void> {
    const db = pool();
    if (!db) return;
    await db.query(
      `INSERT INTO ops_feature_stats_daily (day, feature_key, event_count, unique_users)
       VALUES (CURRENT_DATE, $1, 1, $2)
       ON CONFLICT (day, feature_key) DO UPDATE SET
         event_count = ops_feature_stats_daily.event_count + 1,
         unique_users = ops_feature_stats_daily.unique_users + EXCLUDED.unique_users`,
      [featureKey.slice(0, 80), userId ? 1 : 0]
    );
  },

  async touchUserActivity(userId: string): Promise<void> {
    const db = pool();
    if (!db) return;
    await db.query(
      `INSERT INTO ops_user_activity_daily (day, user_id, session_count)
       VALUES (CURRENT_DATE, $1, 1)
       ON CONFLICT (day, user_id) DO UPDATE SET
         last_seen_at = NOW(),
         session_count = ops_user_activity_daily.session_count + 1`,
      [userId]
    );
  },

  async upsertActiveSession(input: {
    sessionId: string;
    userId?: string | null;
    pathKey?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    const db = pool();
    if (!db) return;
    await db.query(
      `INSERT INTO ops_active_sessions (session_id, user_id, path_key, ip_address, user_agent, last_seen_at)
       VALUES ($1,$2,$3,$4,$5,NOW())
       ON CONFLICT (session_id) DO UPDATE SET
         user_id = COALESCE(EXCLUDED.user_id, ops_active_sessions.user_id),
         path_key = COALESCE(EXCLUDED.path_key, ops_active_sessions.path_key),
         ip_address = COALESCE(EXCLUDED.ip_address, ops_active_sessions.ip_address),
         user_agent = COALESCE(EXCLUDED.user_agent, ops_active_sessions.user_agent),
         last_seen_at = NOW()`,
      [
        input.sessionId.slice(0, 64),
        input.userId ?? null,
        input.pathKey ?? null,
        input.ip ?? null,
        input.userAgent?.slice(0, 500) ?? null,
      ]
    );
  },

  async pruneActiveSessions(maxAgeSec = 120): Promise<void> {
    const db = pool();
    if (!db) return;
    await db.query(
      `DELETE FROM ops_active_sessions WHERE last_seen_at < NOW() - ($1::text || ' seconds')::interval`,
      [String(maxAgeSec)]
    );
  },

  async insertServerSample(sample: {
    cpuPct: number | null;
    memoryPct: number | null;
    memoryUsedMb: number | null;
    memoryTotalMb: number | null;
    diskPct: number | null;
    load1: number | null;
    uptimeSec: number;
    restartCount: number;
    buildVersion: string;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    const db = pool();
    if (!db) return;
    await db.query(
      `INSERT INTO ops_server_samples
         (cpu_pct, memory_pct, memory_used_mb, memory_total_mb, disk_pct, load_1, uptime_sec, restart_count, build_version, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
      [
        sample.cpuPct,
        sample.memoryPct,
        sample.memoryUsedMb,
        sample.memoryTotalMb,
        sample.diskPct,
        sample.load1,
        sample.uptimeSec,
        sample.restartCount,
        sample.buildVersion,
        JSON.stringify(sanitizeOpsMeta(sample.meta ?? {})),
      ]
    );
  },

  async insertDbQuerySample(input: {
    fingerprint: string;
    preview: string;
    durationMs: number;
    isSlow: boolean;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    const db = pool();
    if (!db) return;
    await db.query(
      `INSERT INTO ops_db_query_samples
         (query_fingerprint, query_preview, duration_ms, is_slow, meta)
       VALUES ($1,$2,$3,$4,$5::jsonb)`,
      [
        input.fingerprint.slice(0, 64),
        input.preview.slice(0, 1000),
        input.durationMs,
        input.isSlow,
        JSON.stringify(sanitizeOpsMeta(input.meta ?? {})),
      ]
    );
  },

  async insertAppLog(input: {
    level: string;
    kind: OpsLogKind | string;
    message: string;
    userId?: string | null;
    ip?: string | null;
    apiRoute?: string | null;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    const db = pool();
    if (!db) return;
    await db.query(
      `INSERT INTO ops_app_logs (level, kind, message, user_id, ip_address, api_route, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
      [
        input.level.slice(0, 16),
        String(input.kind).slice(0, 32),
        input.message.slice(0, 4000),
        input.userId ?? null,
        input.ip ?? null,
        input.apiRoute ?? null,
        JSON.stringify(sanitizeOpsMeta(input.meta ?? {})),
      ]
    );
  },

  async insertSecurityEvent(input: {
    eventType: string;
    severity?: string;
    userId?: string | null;
    ip?: string | null;
    path?: string | null;
    message?: string | null;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    const db = pool();
    if (!db) return;
    await db.query(
      `INSERT INTO ops_security_events
         (event_type, severity, user_id, ip_address, path, message, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
      [
        input.eventType.slice(0, 60),
        (input.severity ?? 'medium').slice(0, 16),
        input.userId ?? null,
        input.ip ?? null,
        input.path ?? null,
        input.message ?? null,
        JSON.stringify(sanitizeOpsMeta(input.meta ?? {})),
      ]
    );
  },

  async insertAlert(input: {
    alertKey: string;
    severity: string;
    title: string;
    message: string;
    meta?: Record<string, unknown>;
  }): Promise<boolean> {
    const db = pool();
    if (!db) return false;
    // Dedup open alerts with same key in last 15 minutes.
    const existing = await db.query(
      `SELECT id FROM ops_alert_events
       WHERE alert_key = $1 AND acknowledged = FALSE
         AND created_at > NOW() - INTERVAL '15 minutes'
       LIMIT 1`,
      [input.alertKey]
    );
    if (existing.rows[0]) return false;
    await db.query(
      `INSERT INTO ops_alert_events (alert_key, severity, title, message, meta)
       VALUES ($1,$2,$3,$4,$5::jsonb)`,
      [
        input.alertKey.slice(0, 80),
        input.severity.slice(0, 16),
        input.title.slice(0, 240),
        input.message.slice(0, 4000),
        JSON.stringify(sanitizeOpsMeta(input.meta ?? {})),
      ]
    );
    return true;
  },

  async countActiveSessions(): Promise<number> {
    const db = pool();
    if (!db) return 0;
    await this.pruneActiveSessions(120);
    const res = await db.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM ops_active_sessions
       WHERE last_seen_at > NOW() - INTERVAL '2 minutes'`
    );
    return Number(res.rows[0]?.c ?? 0);
  },

  async countActivity(days: number): Promise<number> {
    const db = pool();
    if (!db) return 0;
    const res = await db.query<{ c: string }>(
      `SELECT COUNT(DISTINCT user_id)::text AS c
       FROM ops_user_activity_daily
       WHERE day >= CURRENT_DATE - ($1::int - 1)`,
      [days]
    );
    return Number(res.rows[0]?.c ?? 0);
  },

  async memberStats(): Promise<{
    total: number;
    today: number;
    week: number;
    month: number;
    free: number;
    paid: number;
  }> {
    const db = pool();
    if (!db) return { total: 0, today: 0, week: 0, month: 0, free: 0, paid: 0 };
    const res = await db.query<{
      total: string;
      today: string;
      week: string;
      month: string;
      free: string;
      paid: string;
    }>(
      `SELECT
         COUNT(*)::text AS total,
         COUNT(*) FILTER (WHERE u.created_at >= date_trunc('day', NOW()))::text AS today,
         COUNT(*) FILTER (WHERE u.created_at >= NOW() - INTERVAL '7 days')::text AS week,
         COUNT(*) FILTER (WHERE u.created_at >= NOW() - INTERVAL '30 days')::text AS month,
         COUNT(*) FILTER (WHERE COALESCE(r.code,'member') IN ('member','guest'))::text AS free,
         COUNT(*) FILTER (
           WHERE COALESCE(r.code,'member') IN (
             'premium_member','vip_member','trainer','owner','admin'
           )
         )::text AS paid
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE COALESCE(u.is_active, TRUE) = TRUE`
    );
    const row = res.rows[0];
    return {
      total: Number(row?.total ?? 0),
      today: Number(row?.today ?? 0),
      week: Number(row?.week ?? 0),
      month: Number(row?.month ?? 0),
      free: Number(row?.free ?? 0),
      paid: Number(row?.paid ?? 0),
    };
  },

  async loginStatsToday(): Promise<{ logins: number; distinctUsers: number }> {
    const db = pool();
    if (!db) return { logins: 0, distinctUsers: 0 };
    const res = await db.query<{ logins: string; users: string }>(
      `SELECT COUNT(*)::text AS logins,
              COUNT(DISTINCT user_id)::text AS users
       FROM auth_login_events
       WHERE success = TRUE AND created_at >= date_trunc('day', NOW())`
    );
    return {
      logins: Number(res.rows[0]?.logins ?? 0),
      distinctUsers: Number(res.rows[0]?.users ?? 0),
    };
  },

  async errorCountSince(since: Date): Promise<number> {
    const db = pool();
    if (!db) return 0;
    const res = await db.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM ops_error_events WHERE occurred_at >= $1`,
      [since.toISOString()]
    );
    return Number(res.rows[0]?.c ?? 0);
  },

  async listErrorGroups(opts: {
    unresolvedOnly?: boolean;
    limit?: number;
  }): Promise<OpsErrorGroupRow[]> {
    const db = pool();
    if (!db) return [];
    const res = await db.query(
      `SELECT id, fingerprint, title, severity, source,
              first_seen_at AS "firstSeenAt",
              last_seen_at AS "lastSeenAt",
              occurrence_count AS "occurrenceCount",
              resolved,
              sample_url AS "sampleUrl",
              sample_stack AS "sampleStack"
       FROM ops_error_groups
       WHERE ($1::boolean IS FALSE OR resolved = FALSE)
       ORDER BY last_seen_at DESC
       LIMIT $2`,
      [Boolean(opts.unresolvedOnly), opts.limit ?? 20]
    );
    return res.rows as OpsErrorGroupRow[];
  },

  async apiStats(range: OpsRange): Promise<OpsApiRouteStat[]> {
    const db = pool();
    if (!db) return [];
    const since = rangeStart(range);
    const res = await db.query<{
      method: string;
      route_key: string;
      duration_ms: number;
      status_code: number;
    }>(
      `SELECT method, route_key, duration_ms, status_code
       FROM ops_api_latency_samples
       WHERE occurred_at >= $1
       ORDER BY route_key, method`,
      [since.toISOString()]
    );
    const buckets = new Map<
      string,
      {
        method: string;
        routeKey: string;
        durations: number[];
        success: number;
        fail: number;
        s2: number;
        s3: number;
        s4: number;
        s5: number;
      }
    >();
    for (const row of res.rows) {
      const key = `${row.method} ${row.route_key}`;
      let b = buckets.get(key);
      if (!b) {
        b = {
          method: row.method,
          routeKey: row.route_key,
          durations: [],
          success: 0,
          fail: 0,
          s2: 0,
          s3: 0,
          s4: 0,
          s5: 0,
        };
        buckets.set(key, b);
      }
      b.durations.push(row.duration_ms);
      if (row.status_code >= 500) {
        b.fail += 1;
        b.s5 += 1;
      } else if (row.status_code >= 400) {
        b.fail += 1;
        b.s4 += 1;
      } else if (row.status_code >= 300) {
        b.success += 1;
        b.s3 += 1;
      } else {
        b.success += 1;
        b.s2 += 1;
      }
    }
    const out: OpsApiRouteStat[] = [];
    for (const b of buckets.values()) {
      const sorted = [...b.durations].sort((a, c) => a - c);
      const callCount = sorted.length;
      const avg = callCount ? sorted.reduce((a, c) => a + c, 0) / callCount : 0;
      out.push({
        method: b.method,
        routeKey: b.routeKey,
        callCount,
        successRate: callCount ? b.success / callCount : 0,
        failRate: callCount ? b.fail / callCount : 0,
        avgMs: Math.round(avg),
        minMs: sorted[0] ?? null,
        maxMs: sorted[sorted.length - 1] ?? null,
        p50Ms: percentile(sorted, 50),
        p95Ms: percentile(sorted, 95),
        p99Ms: percentile(sorted, 99),
        status2xx: b.s2,
        status3xx: b.s3,
        status4xx: b.s4,
        status5xx: b.s5,
        speedColor: speedColor(avg),
      });
    }
    return out.sort((a, b) => b.callCount - a.callCount);
  },

  async pageStats(range: OpsRange): Promise<OpsPageStat[]> {
    const db = pool();
    if (!db) return [];
    const since = rangeStart(range);
    const res = await db.query(
      `SELECT path_key AS "pathKey",
              SUM(page_views)::int AS "pageViews",
              SUM(unique_visitors)::int AS "uniqueVisitors",
              CASE WHEN SUM(page_views) > 0
                THEN (SUM(total_dwell_ms)::float / SUM(page_views))::int ELSE 0 END AS "avgDwellMs",
              CASE WHEN SUM(page_views) > 0
                THEN SUM(bounce_count)::float / SUM(page_views) ELSE NULL END AS "bounceRate",
              SUM(entrances)::int AS entrances,
              SUM(exits)::int AS exits
       FROM ops_page_stats_daily
       WHERE day >= $1::date
       GROUP BY path_key
       ORDER BY SUM(page_views) DESC
       LIMIT 50`,
      [since.toISOString().slice(0, 10)]
    );
    return res.rows as OpsPageStat[];
  },

  async featureStats(range: OpsRange): Promise<OpsFeatureStat[]> {
    const db = pool();
    if (!db) return [];
    const since = rangeStart(range);
    const res = await db.query(
      `SELECT feature_key AS "featureKey",
              SUM(event_count)::int AS "eventCount",
              SUM(unique_users)::int AS "uniqueUsers"
       FROM ops_feature_stats_daily
       WHERE day >= $1::date
       GROUP BY feature_key
       ORDER BY SUM(event_count) DESC
       LIMIT 50`,
      [since.toISOString().slice(0, 10)]
    );
    return res.rows as OpsFeatureStat[];
  },

  async seriesActivity(days: number): Promise<Array<{ date: string; value: number }>> {
    const db = pool();
    if (!db) return [];
    const res = await db.query<{ date: string; value: string }>(
      `SELECT day::text AS date, COUNT(DISTINCT user_id)::text AS value
       FROM ops_user_activity_daily
       WHERE day >= CURRENT_DATE - ($1::int - 1)
       GROUP BY day
       ORDER BY day ASC`,
      [days]
    );
    return res.rows.map((r) => ({ date: r.date, value: Number(r.value) }));
  },

  async seriesSignups(days: number): Promise<Array<{ date: string; value: number }>> {
    const db = pool();
    if (!db) return [];
    const res = await db.query<{ date: string; value: string }>(
      `SELECT date_trunc('day', created_at)::date::text AS date,
              COUNT(*)::text AS value
       FROM users
       WHERE COALESCE(is_active, TRUE) = TRUE
         AND created_at >= CURRENT_DATE - ($1::int - 1)
       GROUP BY 1
       ORDER BY 1 ASC`,
      [days]
    );
    return res.rows.map((r) => ({ date: r.date, value: Number(r.value) }));
  },

  async seriesErrors(days: number): Promise<Array<{ date: string; value: number }>> {
    const db = pool();
    if (!db) return [];
    const res = await db.query<{ date: string; value: string }>(
      `SELECT date_trunc('day', occurred_at)::date::text AS date,
              COUNT(*)::text AS value
       FROM ops_error_events
       WHERE occurred_at >= CURRENT_DATE - ($1::int - 1)
       GROUP BY 1
       ORDER BY 1 ASC`,
      [days]
    );
    return res.rows.map((r) => ({ date: r.date, value: Number(r.value) }));
  },

  async seriesApiLatency(days: number): Promise<Array<{ date: string; value: number }>> {
    const db = pool();
    if (!db) return [];
    const res = await db.query<{ date: string; value: string }>(
      `SELECT date_trunc('day', occurred_at)::date::text AS date,
              AVG(duration_ms)::int::text AS value
       FROM ops_api_latency_samples
       WHERE occurred_at >= CURRENT_DATE - ($1::int - 1)
       GROUP BY 1
       ORDER BY 1 ASC`,
      [days]
    );
    return res.rows.map((r) => ({ date: r.date, value: Number(r.value) }));
  },

  async seriesServer(
    field: 'cpu_pct' | 'memory_pct',
    hours = 24
  ): Promise<Array<{ date: string; value: number }>> {
    const db = pool();
    if (!db) return [];
    const col = field === 'cpu_pct' ? 'cpu_pct' : 'memory_pct';
    const res = await db.query<{ date: string; value: string }>(
      `SELECT date_trunc('hour', sampled_at)::text AS date,
              AVG(${col})::float::text AS value
       FROM ops_server_samples
       WHERE sampled_at >= NOW() - ($1::text || ' hours')::interval
         AND ${col} IS NOT NULL
       GROUP BY 1
       ORDER BY 1 ASC`,
      [String(hours)]
    );
    return res.rows.map((r) => ({ date: r.date, value: Number(Number(r.value).toFixed(1)) }));
  },

  async recentAudits(limit = 10) {
    const db = pool();
    if (!db) return [];
    const res = await db.query(
      `SELECT id, created_at AS "createdAt", actor_id AS "actorId", actor_role AS "actorRole",
              action, target_type AS "targetType", target_id AS "targetId",
              ip_address AS "ipAddress", user_agent AS "userAgent", meta
       FROM admin_audit_logs
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  },

  async recentSignups(limit = 10) {
    const db = pool();
    if (!db) return [];
    const res = await db.query(
      `SELECT id, email, display_name AS "displayName", created_at AS "createdAt"
       FROM users
       WHERE COALESCE(is_active, TRUE) = TRUE
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  },

  async openAlerts(limit = 20) {
    const db = pool();
    if (!db) return [];
    const res = await db.query(
      `SELECT id, created_at AS "createdAt", alert_key AS "alertKey", severity,
              title, message, acknowledged
       FROM ops_alert_events
       WHERE acknowledged = FALSE
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  },

  async acknowledgeAlert(id: string, adminId: string): Promise<boolean> {
    const db = pool();
    if (!db) return false;
    const res = await db.query(
      `UPDATE ops_alert_events
       SET acknowledged = TRUE, acknowledged_at = NOW(), acknowledged_by = $2
       WHERE id = $1`,
      [id, adminId]
    );
    return (res.rowCount ?? 0) > 0;
  },

  async resolveErrorGroup(id: string, adminId: string): Promise<boolean> {
    const db = pool();
    if (!db) return false;
    const res = await db.query(
      `UPDATE ops_error_groups
       SET resolved = TRUE, resolved_at = NOW(), resolved_by = $2, updated_at = NOW()
       WHERE id = $1`,
      [id, adminId]
    );
    return (res.rowCount ?? 0) > 0;
  },

  async slowQueries(limit = 20) {
    const db = pool();
    if (!db) return [];
    const res = await db.query(
      `SELECT id, sampled_at AS "sampledAt", query_fingerprint AS "queryFingerprint",
              query_preview AS "queryPreview", duration_ms AS "durationMs", is_slow AS "isSlow"
       FROM ops_db_query_samples
       WHERE is_slow = TRUE
       ORDER BY sampled_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  },

  async searchLogs(opts: {
    kind?: string;
    q?: string;
    from?: string;
    to?: string;
    limit?: number;
  }) {
    const db = pool();
    if (!db) return [];
    const res = await db.query(
      `SELECT id, logged_at AS "loggedAt", level, kind, message,
              user_id AS "userId", ip_address AS "ipAddress", api_route AS "apiRoute"
       FROM ops_app_logs
       WHERE ($1::text IS NULL OR kind = $1)
         AND ($2::text IS NULL OR message ILIKE '%' || $2 || '%')
         AND ($3::timestamptz IS NULL OR logged_at >= $3::timestamptz)
         AND ($4::timestamptz IS NULL OR logged_at <= $4::timestamptz)
       ORDER BY logged_at DESC
       LIMIT $5`,
      [opts.kind ?? null, opts.q ?? null, opts.from ?? null, opts.to ?? null, opts.limit ?? 100]
    );
    return res.rows;
  },

  async securityEvents(limit = 50) {
    const db = pool();
    if (!db) return [];
    const res = await db.query(
      `SELECT id, occurred_at AS "occurredAt", event_type AS "eventType", severity,
              user_id AS "userId", ip_address AS "ipAddress", path, message
       FROM ops_security_events
       ORDER BY occurred_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  },

  async retentionRate(dayOffset: number): Promise<number | null> {
    const db = pool();
    if (!db) return null;
    const res = await db.query<{ rate: string | null }>(
      `WITH cohort AS (
         SELECT id FROM users
         WHERE COALESCE(is_active, TRUE) = TRUE
           AND created_at::date = CURRENT_DATE - $1::int
       ),
       retained AS (
         SELECT DISTINCT a.user_id
         FROM ops_user_activity_daily a
         JOIN cohort c ON c.id = a.user_id
         WHERE a.day = CURRENT_DATE
       )
       SELECT CASE WHEN (SELECT COUNT(*) FROM cohort) = 0 THEN NULL
              ELSE (SELECT COUNT(*) FROM retained)::float / (SELECT COUNT(*) FROM cohort)
              END AS rate`,
      [dayOffset]
    );
    const rate = res.rows[0]?.rate;
    return rate == null ? null : Number(rate);
  },

  async avgApiMsToday(): Promise<number | null> {
    const db = pool();
    if (!db) return null;
    const res = await db.query<{ avg: string | null }>(
      `SELECT AVG(duration_ms)::float AS avg
       FROM ops_api_latency_samples
       WHERE occurred_at >= date_trunc('day', NOW())`
    );
    const avg = res.rows[0]?.avg;
    return avg == null ? null : Math.round(Number(avg));
  },

  async latestServerSample() {
    const db = pool();
    if (!db) return null;
    const res = await db.query(
      `SELECT sampled_at AS "sampledAt", cpu_pct AS "cpuPct", memory_pct AS "memoryPct",
              disk_pct AS "diskPct", uptime_sec AS "uptimeSec", restart_count AS "restartCount",
              build_version AS "buildVersion"
       FROM ops_server_samples
       ORDER BY sampled_at DESC
       LIMIT 1`
    );
    return res.rows[0] ?? null;
  },

  async pruneRetention(): Promise<void> {
    const db = pool();
    if (!db) return;
    await db.query(`DELETE FROM ops_error_events WHERE occurred_at < NOW() - INTERVAL '365 days'`);
    await db.query(`DELETE FROM ops_app_logs WHERE logged_at < NOW() - INTERVAL '180 days'`);
    await db.query(
      `DELETE FROM ops_api_latency_samples WHERE occurred_at < NOW() - INTERVAL '30 days'`
    );
    await db.query(
      `DELETE FROM ops_server_samples WHERE sampled_at < NOW() - INTERVAL '90 days'`
    );
  },
};
