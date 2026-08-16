import { createHash } from 'node:crypto';
import type { AbuseEvent, AbuseEventSeverity, AbuseEventType } from '@machinefit/shared';
import { getPool } from '../config/database.js';

function pool() {
  const p = getPool();
  if (!p) throw new Error('DATABASE_URL not configured');
  return p;
}

export function hashIp(ip: string | undefined | null): string | null {
  if (!ip) return null;
  return createHash('sha256').update(`mf-ip:${ip}`).digest('hex').slice(0, 64);
}

type AbuseRow = {
  id: string;
  user_id: string | null;
  ip_hash: string | null;
  endpoint: string;
  event_type: string;
  severity: AbuseEventSeverity;
  request_count: number;
  metadata: Record<string, unknown> | null;
  created_at: Date;
};

function mapAbuse(row: AbuseRow): AbuseEvent {
  return {
    id: row.id,
    userId: row.user_id,
    ipHash: row.ip_hash,
    endpoint: row.endpoint,
    eventType: row.event_type,
    severity: row.severity,
    requestCount: row.request_count,
    metadata: row.metadata ?? {},
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export const abuseRepository = {
  async record(input: {
    userId?: string | null;
    ipHash?: string | null;
    endpoint?: string;
    eventType: AbuseEventType | string;
    severity?: AbuseEventSeverity;
    requestCount?: number;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await pool().query(
        `INSERT INTO abuse_events (
           user_id, ip_hash, endpoint, event_type, severity, request_count, metadata
         ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
        [
          input.userId ?? null,
          input.ipHash ?? null,
          (input.endpoint ?? '').slice(0, 240),
          String(input.eventType).slice(0, 64),
          input.severity ?? 'MEDIUM',
          Math.max(1, input.requestCount ?? 1),
          JSON.stringify(input.metadata ?? {}),
        ]
      );
    } catch {
      // Table may not exist until migration 138; never break request path.
    }
  },

  async list(input: {
    from?: string;
    to?: string;
    eventType?: string;
    page: number;
    limit: number;
  }): Promise<{ items: AbuseEvent[]; total: number }> {
    const where: string[] = [];
    const values: unknown[] = [];
    if (input.from) {
      values.push(input.from);
      where.push(`created_at >= $${values.length}::timestamptz`);
    }
    if (input.to) {
      values.push(input.to);
      where.push(`created_at < ($${values.length}::date + INTERVAL '1 day')`);
    }
    if (input.eventType && input.eventType !== 'ALL') {
      values.push(input.eventType);
      where.push(`event_type = $${values.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRes = await pool().query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM abuse_events ${whereSql}`,
      values
    );
    const total = Number.parseInt(countRes.rows[0]?.count ?? '0', 10) || 0;
    const offset = (input.page - 1) * input.limit;
    values.push(input.limit, offset);
    const { rows } = await pool().query<AbuseRow>(
      `SELECT * FROM abuse_events ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );
    return { items: rows.map(mapAbuse), total };
  },
};
