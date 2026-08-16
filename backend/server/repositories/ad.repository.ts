import type {
  AdAdminStats,
  AdFeatureFlagRow,
  AdPlacement,
  AdPolicy,
} from '@machinefit/shared';
import type pg from 'pg';
import { getPool } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';

function requirePool(): pg.Pool {
  const pool = getPool();
  if (!pool) {
    throw new AppError(503, 'DB_UNAVAILABLE', 'Database is not configured');
  }
  return pool;
}

type FlagRow = { flag_key: string; enabled: boolean; updated_at: Date | string };
type PlacementRow = {
  id: string;
  placement_key: string;
  name: string;
  description: string;
  ad_type: string;
  enabled: boolean;
  priority: number;
  maps_to_banner_slot_key: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};
type PolicyRow = {
  id: string;
  placement_id: string;
  event_type: string | null;
  min_interval_seconds: number;
  session_limit: number | null;
  daily_limit: number | null;
  event_interval_count: number | null;
  anonymous_enabled: boolean;
  free_user_enabled: boolean;
  paid_user_enabled: boolean;
  admin_enabled: boolean;
  require_marketing_opt_in: boolean;
  enabled: boolean;
  start_at: Date | string | null;
  end_at: Date | string | null;
};

function toIso(v: Date | string | null | undefined): string | null {
  if (v == null) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function mapFlag(row: FlagRow): AdFeatureFlagRow {
  return {
    flagKey: row.flag_key,
    enabled: row.enabled,
    updatedAt: toIso(row.updated_at)!,
  };
}

function mapPlacement(row: PlacementRow): AdPlacement {
  return {
    id: row.id,
    placementKey: row.placement_key,
    name: row.name,
    description: row.description,
    adType: row.ad_type as AdPlacement['adType'],
    enabled: row.enabled,
    priority: row.priority,
    mapsToBannerSlotKey: row.maps_to_banner_slot_key,
    createdAt: toIso(row.created_at)!,
    updatedAt: toIso(row.updated_at)!,
  };
}

function mapPolicy(row: PolicyRow): AdPolicy {
  return {
    id: row.id,
    placementId: row.placement_id,
    eventType: row.event_type,
    minIntervalSeconds: row.min_interval_seconds,
    sessionLimit: row.session_limit,
    dailyLimit: row.daily_limit,
    eventIntervalCount: row.event_interval_count,
    anonymousEnabled: row.anonymous_enabled,
    freeUserEnabled: row.free_user_enabled,
    paidUserEnabled: row.paid_user_enabled,
    adminEnabled: row.admin_enabled,
    requireMarketingOptIn: row.require_marketing_opt_in,
    enabled: row.enabled,
    startAt: toIso(row.start_at),
    endAt: toIso(row.end_at),
  };
}

async function tablesReady(): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  try {
    const r = await pool.query(
      `SELECT 1 FROM information_schema.tables WHERE table_name = 'ad_placements' LIMIT 1`
    );
    return (r.rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}

export const adRepository = {
  async isReady(): Promise<boolean> {
    return tablesReady();
  },

  async listFlags(): Promise<AdFeatureFlagRow[]> {
    const pool = requirePool();
    const r = await pool.query<FlagRow>(
      `SELECT flag_key, enabled, updated_at FROM ad_feature_flags ORDER BY flag_key`
    );
    return r.rows.map(mapFlag);
  },

  async getFlag(flagKey: string): Promise<boolean> {
    const pool = requirePool();
    const r = await pool.query<{ enabled: boolean }>(
      `SELECT enabled FROM ad_feature_flags WHERE flag_key = $1`,
      [flagKey]
    );
    return Boolean(r.rows[0]?.enabled);
  },

  async setFlag(flagKey: string, enabled: boolean): Promise<AdFeatureFlagRow | null> {
    const pool = requirePool();
    const r = await pool.query<FlagRow>(
      `UPDATE ad_feature_flags SET enabled = $2, updated_at = NOW()
       WHERE flag_key = $1
       RETURNING flag_key, enabled, updated_at`,
      [flagKey, enabled]
    );
    return r.rows[0] ? mapFlag(r.rows[0]) : null;
  },

  async listPlacements(): Promise<AdPlacement[]> {
    const pool = requirePool();
    const r = await pool.query<PlacementRow>(
      `SELECT * FROM ad_placements ORDER BY priority ASC, placement_key ASC`
    );
    return r.rows.map(mapPlacement);
  },

  async getPlacementByKey(placementKey: string): Promise<AdPlacement | null> {
    const pool = requirePool();
    const r = await pool.query<PlacementRow>(
      `SELECT * FROM ad_placements WHERE placement_key = $1`,
      [placementKey]
    );
    return r.rows[0] ? mapPlacement(r.rows[0]) : null;
  },

  async updatePlacement(
    id: string,
    patch: { enabled?: boolean; priority?: number; name?: string; description?: string }
  ): Promise<AdPlacement | null> {
    const pool = requirePool();
    const r = await pool.query<PlacementRow>(
      `UPDATE ad_placements SET
         enabled = COALESCE($2, enabled),
         priority = COALESCE($3, priority),
         name = COALESCE($4, name),
         description = COALESCE($5, description)
       WHERE id = $1
       RETURNING *`,
      [
        id,
        patch.enabled ?? null,
        patch.priority ?? null,
        patch.name ?? null,
        patch.description ?? null,
      ]
    );
    return r.rows[0] ? mapPlacement(r.rows[0]) : null;
  },

  async listPolicies(placementId?: string): Promise<AdPolicy[]> {
    const pool = requirePool();
    if (placementId) {
      const r = await pool.query<PolicyRow>(
        `SELECT * FROM ad_policies WHERE placement_id = $1 ORDER BY event_type NULLS FIRST`,
        [placementId]
      );
      return r.rows.map(mapPolicy);
    }
    const r = await pool.query<PolicyRow>(
      `SELECT * FROM ad_policies ORDER BY placement_id, event_type NULLS FIRST`
    );
    return r.rows.map(mapPolicy);
  },

  async getPolicyForDecision(
    placementId: string,
    eventType?: string | null
  ): Promise<AdPolicy | null> {
    const pool = requirePool();
    if (eventType) {
      const specific = await pool.query<PolicyRow>(
        `SELECT * FROM ad_policies
         WHERE placement_id = $1 AND event_type = $2 AND enabled = TRUE
         LIMIT 1`,
        [placementId, eventType]
      );
      if (specific.rows[0]) {
        return mapPolicy(specific.rows[0]);
      }
    }
    const fallback = await pool.query<PolicyRow>(
      `SELECT * FROM ad_policies
       WHERE placement_id = $1 AND event_type IS NULL AND enabled = TRUE
       LIMIT 1`,
      [placementId]
    );
    return fallback.rows[0] ? mapPolicy(fallback.rows[0]) : null;
  },

  async updatePolicy(
    id: string,
    patch: {
      minIntervalSeconds?: number;
      sessionLimit?: number | null;
      dailyLimit?: number | null;
      eventIntervalCount?: number | null;
      anonymousEnabled?: boolean;
      freeUserEnabled?: boolean;
      paidUserEnabled?: boolean;
      adminEnabled?: boolean;
      requireMarketingOptIn?: boolean;
      enabled?: boolean;
    }
  ): Promise<AdPolicy | null> {
    const pool = requirePool();
    const r = await pool.query<PolicyRow>(
      `UPDATE ad_policies SET
         min_interval_seconds = COALESCE($2, min_interval_seconds),
         session_limit = CASE WHEN $3::boolean THEN $4::int ELSE session_limit END,
         daily_limit = CASE WHEN $5::boolean THEN $6::int ELSE daily_limit END,
         event_interval_count = CASE WHEN $7::boolean THEN $8::int ELSE event_interval_count END,
         anonymous_enabled = COALESCE($9, anonymous_enabled),
         free_user_enabled = COALESCE($10, free_user_enabled),
         paid_user_enabled = COALESCE($11, paid_user_enabled),
         admin_enabled = COALESCE($12, admin_enabled),
         require_marketing_opt_in = COALESCE($13, require_marketing_opt_in),
         enabled = COALESCE($14, enabled)
       WHERE id = $1
       RETURNING *`,
      [
        id,
        patch.minIntervalSeconds ?? null,
        patch.sessionLimit !== undefined,
        patch.sessionLimit ?? null,
        patch.dailyLimit !== undefined,
        patch.dailyLimit ?? null,
        patch.eventIntervalCount !== undefined,
        patch.eventIntervalCount ?? null,
        patch.anonymousEnabled ?? null,
        patch.freeUserEnabled ?? null,
        patch.paidUserEnabled ?? null,
        patch.adminEnabled ?? null,
        patch.requireMarketingOptIn ?? null,
        patch.enabled ?? null,
      ]
    );
    return r.rows[0] ? mapPolicy(r.rows[0]) : null;
  },

  async countImpressionsSince(opts: {
    userId?: string | null;
    sessionId?: string | null;
    placementKey?: string;
    adType?: string;
    since: Date;
  }): Promise<number> {
    const pool = requirePool();
    const conditions = ['created_at >= $1'];
    const params: unknown[] = [opts.since.toISOString()];
    let i = 2;
    if (opts.userId) {
      conditions.push(`user_id = $${i++}`);
      params.push(opts.userId);
    } else if (opts.sessionId) {
      conditions.push(`session_id = $${i++}`);
      params.push(opts.sessionId);
    }
    if (opts.placementKey) {
      conditions.push(`placement_key = $${i++}`);
      params.push(opts.placementKey);
    }
    if (opts.adType) {
      conditions.push(`ad_type = $${i++}`);
      params.push(opts.adType);
    }
    const r = await pool.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM ad_impressions WHERE ${conditions.join(' AND ')}`,
      params
    );
    return Number(r.rows[0]?.c ?? 0);
  },

  async lastImpressionAt(opts: {
    userId?: string | null;
    sessionId?: string | null;
    placementKey?: string;
    adType?: string;
  }): Promise<Date | null> {
    const pool = requirePool();
    const conditions: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (opts.userId) {
      conditions.push(`user_id = $${i++}`);
      params.push(opts.userId);
    } else if (opts.sessionId) {
      conditions.push(`session_id = $${i++}`);
      params.push(opts.sessionId);
    } else {
      return null;
    }
    if (opts.placementKey) {
      conditions.push(`placement_key = $${i++}`);
      params.push(opts.placementKey);
    }
    if (opts.adType) {
      conditions.push(`ad_type = $${i++}`);
      params.push(opts.adType);
    }
    const r = await pool.query<{ created_at: Date }>(
      `SELECT created_at FROM ad_impressions
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC LIMIT 1`,
      params
    );
    return r.rows[0]?.created_at ?? null;
  },

  async recordImpression(input: {
    userId?: string | null;
    sessionId?: string | null;
    placementKey: string;
    adType: string;
    eventType?: string | null;
    provider?: string;
  }): Promise<void> {
    const pool = requirePool();
    await pool.query(
      `INSERT INTO ad_impressions (user_id, session_id, placement_key, ad_type, event_type, provider)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        input.userId ?? null,
        input.sessionId ?? null,
        input.placementKey,
        input.adType,
        input.eventType ?? null,
        input.provider ?? 'mock',
      ]
    );
  },

  async recordClick(input: {
    userId?: string | null;
    sessionId?: string | null;
    placementKey: string;
    adType: string;
    eventType?: string | null;
    provider?: string;
  }): Promise<void> {
    const pool = requirePool();
    await pool.query(
      `INSERT INTO ad_clicks (user_id, session_id, placement_key, ad_type, event_type, provider)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        input.userId ?? null,
        input.sessionId ?? null,
        input.placementKey,
        input.adType,
        input.eventType ?? null,
        input.provider ?? 'mock',
      ]
    );
  },

  async recordReward(input: {
    userId?: string | null;
    sessionId?: string | null;
    placementKey: string;
    status: 'complete' | 'fail' | 'claim_stub';
    provider?: string;
  }): Promise<void> {
    const pool = requirePool();
    await pool.query(
      `INSERT INTO ad_reward_events (user_id, session_id, placement_key, status, provider)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        input.userId ?? null,
        input.sessionId ?? null,
        input.placementKey,
        input.status,
        input.provider ?? 'mock',
      ]
    );
  },

  async getAdminStats(range: 'today' | 'yesterday' | '7d' | '30d'): Promise<AdAdminStats> {
    const pool = requirePool();
    const bounds = rangeBounds(range);
    const [imp, clicks, rewards, byPlacement, byEvent, interstitial, banner] = await Promise.all([
      pool.query<{ c: string }>(
        `SELECT COUNT(*)::text AS c FROM ad_impressions WHERE created_at >= $1 AND created_at < $2`,
        [bounds.start, bounds.end]
      ),
      pool.query<{ c: string }>(
        `SELECT COUNT(*)::text AS c FROM ad_clicks WHERE created_at >= $1 AND created_at < $2`,
        [bounds.start, bounds.end]
      ),
      pool.query<{ c: string }>(
        `SELECT COUNT(*)::text AS c FROM ad_reward_events
         WHERE status = 'complete' AND created_at >= $1 AND created_at < $2`,
        [bounds.start, bounds.end]
      ),
      pool.query<{ placement_key: string; impressions: string; clicks: string }>(
        `SELECT i.placement_key,
                COUNT(*)::text AS impressions,
                COALESCE((
                  SELECT COUNT(*) FROM ad_clicks c
                  WHERE c.placement_key = i.placement_key
                    AND c.created_at >= $1 AND c.created_at < $2
                ), 0)::text AS clicks
         FROM ad_impressions i
         WHERE i.created_at >= $1 AND i.created_at < $2
         GROUP BY i.placement_key
         ORDER BY COUNT(*) DESC
         LIMIT 30`,
        [bounds.start, bounds.end]
      ),
      pool.query<{ event_type: string; impressions: string }>(
        `SELECT COALESCE(event_type, '(none)') AS event_type, COUNT(*)::text AS impressions
         FROM ad_impressions
         WHERE created_at >= $1 AND created_at < $2
         GROUP BY event_type
         ORDER BY COUNT(*) DESC
         LIMIT 30`,
        [bounds.start, bounds.end]
      ),
      pool.query<{ c: string }>(
        `SELECT COUNT(*)::text AS c FROM ad_impressions
         WHERE ad_type = 'interstitial' AND created_at >= $1 AND created_at < $2`,
        [bounds.start, bounds.end]
      ),
      pool.query<{ c: string }>(
        `SELECT COUNT(*)::text AS c FROM ad_impressions
         WHERE ad_type IN ('inline_cms', 'inline', 'sticky', 'native')
           AND created_at >= $1 AND created_at < $2`,
        [bounds.start, bounds.end]
      ),
    ]);

    return {
      range,
      impressions: Number(imp.rows[0]?.c ?? 0),
      clicks: Number(clicks.rows[0]?.c ?? 0),
      rewardCompletes: Number(rewards.rows[0]?.c ?? 0),
      interstitialImpressions: Number(interstitial.rows[0]?.c ?? 0),
      bannerImpressions: Number(banner.rows[0]?.c ?? 0),
      byPlacement: byPlacement.rows.map((r: { placement_key: string; impressions: string; clicks: string }) => ({
        placementKey: r.placement_key,
        impressions: Number(r.impressions),
        clicks: Number(r.clicks),
      })),
      byEvent: byEvent.rows.map((r: { event_type: string; impressions: string }) => ({
        eventType: r.event_type,
        impressions: Number(r.impressions),
      })),
      byUserStatusApprox: [
        {
          label: 'logged_in',
          impressions: 0,
        },
      ],
    };
  },
};

function rangeBounds(range: 'today' | 'yesterday' | '7d' | '30d'): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const start = new Date(end);
  if (range === 'today') {
    start.setDate(start.getDate() - 1);
  } else if (range === 'yesterday') {
    start.setDate(start.getDate() - 2);
    end.setDate(end.getDate() - 1);
  } else if (range === '7d') {
    start.setDate(start.getDate() - 7);
  } else {
    start.setDate(start.getDate() - 30);
  }
  return { start: start.toISOString(), end: end.toISOString() };
}
