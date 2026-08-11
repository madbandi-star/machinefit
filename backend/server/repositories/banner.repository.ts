import type {
  BannerAdminStats,
  BannerDetail,
  BannerListItem,
  BannerListQuery,
  BannerSlot,
  BannerSlotAssignment,
  BannerStatsRow,
  CreateBannerInput,
  CreateBannerSlotInput,
  PublicBanner,
  UpdateBannerInput,
  UpdateBannerSlotInput,
} from '@machinefit/shared';
import { BANNER_PUBLIC_SLOT_LIMIT } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';
import type pg from 'pg';

function requirePool(): pg.Pool {
  const pool = getPool();
  if (!pool) {
    throw new AppError(503, 'DB_UNAVAILABLE', 'Database is not configured');
  }
  return pool;
}

interface BannerRow {
  id: string;
  name: string;
  advertiser_name: string;
  description: string;
  banner_type: string;
  image_url: string | null;
  image_storage_path: string | null;
  mobile_image_url: string | null;
  mobile_image_storage_path: string | null;
  target_url: string;
  open_new_window: boolean;
  status: string;
  start_at: Date | string | null;
  end_at: Date | string | null;
  priority: number;
  impression_count: string | number;
  click_count: string | number;
  last_impressed_at: Date | string | null;
  last_clicked_at: Date | string | null;
  created_by: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface SlotRow {
  id: string;
  slot_key: string;
  slot_name: string;
  description: string;
  status: string;
  assigned_banner_count?: string | number;
  created_at: Date | string;
  updated_at: Date | string;
}

interface AssignmentRow {
  banner_id: string;
  slot_id: string;
  slot_key: string;
  slot_name: string;
  priority: number;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.toISOString();
}

function toNum(value: string | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === 'number' ? value : Number(value) || 0;
}

function ctr(impressions: number, clicks: number): number {
  if (impressions <= 0) return 0;
  return Math.round((clicks / impressions) * 10000) / 100;
}

function mapAssignments(rows: AssignmentRow[]): BannerSlotAssignment[] {
  return rows.map((row) => ({
    slotId: row.slot_id,
    slotKey: row.slot_key,
    slotName: row.slot_name,
    priority: row.priority,
  }));
}

function mapBanner(row: BannerRow, slots: BannerSlotAssignment[]): BannerDetail {
  const impressionCount = toNum(row.impression_count);
  const clickCount = toNum(row.click_count);
  return {
    id: row.id,
    name: row.name,
    advertiserName: row.advertiser_name,
    description: row.description,
    bannerType: row.banner_type as BannerDetail['bannerType'],
    imageUrl: row.image_url,
    imageStoragePath: row.image_storage_path,
    mobileImageUrl: row.mobile_image_url,
    mobileImageStoragePath: row.mobile_image_storage_path,
    targetUrl: row.target_url,
    openNewWindow: row.open_new_window,
    status: row.status as BannerDetail['status'],
    startAt: toIso(row.start_at),
    endAt: toIso(row.end_at),
    priority: row.priority,
    impressionCount,
    clickCount,
    ctr: ctr(impressionCount, clickCount),
    lastImpressedAt: toIso(row.last_impressed_at),
    lastClickedAt: toIso(row.last_clicked_at),
    slots,
    createdBy: row.created_by,
    createdAt: toIso(row.created_at)!,
    updatedAt: toIso(row.updated_at)!,
  };
}

function mapSlot(row: SlotRow): BannerSlot {
  return {
    id: row.id,
    slotKey: row.slot_key,
    slotName: row.slot_name,
    description: row.description,
    status: row.status as BannerSlot['status'],
    assignedBannerCount: toNum(row.assigned_banner_count),
    createdAt: toIso(row.created_at)!,
    updatedAt: toIso(row.updated_at)!,
  };
}

async function loadAssignments(bannerIds: string[]): Promise<Map<string, BannerSlotAssignment[]>> {
  const map = new Map<string, BannerSlotAssignment[]>();
  if (bannerIds.length === 0) return map;
  const pool = requirePool();
  const result = await pool.query<AssignmentRow>(
    `SELECT a.banner_id, a.slot_id, s.slot_key, s.slot_name, a.priority
     FROM banner_slot_assignments a
     JOIN banner_slots s ON s.id = a.slot_id
     WHERE a.banner_id = ANY($1::uuid[])
     ORDER BY a.priority ASC, s.slot_key ASC`,
    [bannerIds]
  );
  for (const row of result.rows) {
    const list = map.get(row.banner_id) ?? [];
    list.push(...mapAssignments([row]));
    map.set(row.banner_id, list);
  }
  return map;
}

async function replaceAssignments(
  bannerId: string,
  assignments: { slotKey: string; priority: number }[]
): Promise<void> {
  const pool = requirePool();
  await pool.query('DELETE FROM banner_slot_assignments WHERE banner_id = $1', [bannerId]);
  if (assignments.length === 0) return;

  const keys = assignments.map((a) => a.slotKey);
  const slots = await pool.query<{ id: string; slot_key: string }>(
    `SELECT id, slot_key FROM banner_slots WHERE slot_key = ANY($1::text[])`,
    [keys]
  );
  const byKey = new Map(slots.rows.map((s) => [s.slot_key, s.id]));

  for (const assignment of assignments) {
    const slotId = byKey.get(assignment.slotKey);
    if (!slotId) continue;
    await pool.query(
      `INSERT INTO banner_slot_assignments (banner_id, slot_id, priority)
       VALUES ($1, $2, $3)
       ON CONFLICT (banner_id, slot_id) DO UPDATE SET priority = EXCLUDED.priority`,
      [bannerId, slotId, assignment.priority]
    );
  }
}

export const bannerRepository = {
  async listAdmin(query: BannerListQuery): Promise<{ items: BannerListItem[]; total: number }> {
    const pool = requirePool();
    const conditions = ['b.deleted_at IS NULL'];
    const params: unknown[] = [];
    let idx = 1;

    if (query.q) {
      conditions.push(
        `(b.name ILIKE $${idx} OR b.advertiser_name ILIKE $${idx} OR b.description ILIKE $${idx})`
      );
      params.push(`%${query.q}%`);
      idx += 1;
    }
    if (query.status) {
      conditions.push(`b.status = $${idx}`);
      params.push(query.status);
      idx += 1;
    }
    if (query.bannerType) {
      conditions.push(`b.banner_type = $${idx}`);
      params.push(query.bannerType);
      idx += 1;
    }
    if (query.slotKey) {
      conditions.push(`EXISTS (
        SELECT 1 FROM banner_slot_assignments a
        JOIN banner_slots s ON s.id = a.slot_id
        WHERE a.banner_id = b.id AND s.slot_key = $${idx}
      )`);
      params.push(query.slotKey);
      idx += 1;
    }

    const where = conditions.join(' AND ');
    const countRes = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM banners b WHERE ${where}`,
      params
    );
    const total = Number(countRes.rows[0]?.count ?? 0);
    const offset = (query.page - 1) * query.pageSize;

    const listRes = await pool.query<BannerRow>(
      `SELECT b.* FROM banners b
       WHERE ${where}
       ORDER BY b.priority ASC, b.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, query.pageSize, offset]
    );

    const assignments = await loadAssignments(listRes.rows.map((r) => r.id));
    const items = listRes.rows.map((row) => mapBanner(row, assignments.get(row.id) ?? []));
    return { items, total };
  },

  async getById(id: string): Promise<BannerDetail | null> {
    const pool = requirePool();
    const result = await pool.query<BannerRow>(
      `SELECT * FROM banners WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    const row = result.rows[0];
    if (!row) return null;
    const assignments = await loadAssignments([id]);
    return mapBanner(row, assignments.get(id) ?? []);
  },

  async create(input: CreateBannerInput, createdBy: string | null): Promise<BannerDetail> {
    const pool = requirePool();
    const result = await pool.query<BannerRow>(
      `INSERT INTO banners (
         name, advertiser_name, description, banner_type, target_url, open_new_window,
         status, start_at, end_at, priority, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        input.name,
        input.advertiserName ?? '',
        input.description ?? '',
        input.bannerType,
        input.targetUrl ?? '',
        input.openNewWindow ?? true,
        input.status,
        input.startAt ?? null,
        input.endAt ?? null,
        input.priority ?? 100,
        createdBy,
      ]
    );
    const row = result.rows[0]!;
    await replaceAssignments(row.id, input.slotAssignments ?? []);
    return (await this.getById(row.id))!;
  },

  async update(id: string, input: UpdateBannerInput): Promise<BannerDetail | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const pool = requirePool();
    const result = await pool.query<BannerRow>(
      `UPDATE banners SET
         name = COALESCE($2, name),
         advertiser_name = COALESCE($3, advertiser_name),
         description = COALESCE($4, description),
         banner_type = COALESCE($5, banner_type),
         target_url = COALESCE($6, target_url),
         open_new_window = COALESCE($7, open_new_window),
         status = COALESCE($8, status),
         start_at = CASE WHEN $9::boolean THEN $10::timestamptz ELSE start_at END,
         end_at = CASE WHEN $11::boolean THEN $12::timestamptz ELSE end_at END,
         priority = COALESCE($13, priority)
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [
        id,
        input.name ?? null,
        input.advertiserName ?? null,
        input.description ?? null,
        input.bannerType ?? null,
        input.targetUrl ?? null,
        input.openNewWindow ?? null,
        input.status ?? null,
        input.startAt !== undefined,
        input.startAt ?? null,
        input.endAt !== undefined,
        input.endAt ?? null,
        input.priority ?? null,
      ]
    );
    if (!result.rows[0]) return null;

    if (input.slotAssignments) {
      await replaceAssignments(id, input.slotAssignments);
    }
    return this.getById(id);
  },

  async softDelete(id: string): Promise<boolean> {
    const pool = requirePool();
    const result = await pool.query(
      `UPDATE banners SET deleted_at = NOW(), status = 'inactive'
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async setImage(
    id: string,
    kind: 'desktop' | 'mobile',
    publicUrl: string,
    storagePath: string
  ): Promise<BannerDetail | null> {
    const pool = requirePool();
    if (kind === 'mobile') {
      await pool.query(
        `UPDATE banners SET mobile_image_url = $2, mobile_image_storage_path = $3
         WHERE id = $1 AND deleted_at IS NULL`,
        [id, publicUrl, storagePath]
      );
    } else {
      await pool.query(
        `UPDATE banners SET image_url = $2, image_storage_path = $3
         WHERE id = $1 AND deleted_at IS NULL`,
        [id, publicUrl, storagePath]
      );
    }
    return this.getById(id);
  },

  async clearImage(id: string, kind: 'desktop' | 'mobile'): Promise<BannerDetail | null> {
    const pool = requirePool();
    if (kind === 'mobile') {
      await pool.query(
        `UPDATE banners SET mobile_image_url = NULL, mobile_image_storage_path = NULL
         WHERE id = $1 AND deleted_at IS NULL`,
        [id]
      );
    } else {
      await pool.query(
        `UPDATE banners SET image_url = NULL, image_storage_path = NULL
         WHERE id = $1 AND deleted_at IS NULL`,
        [id]
      );
    }
    return this.getById(id);
  },

  async listSlots(): Promise<BannerSlot[]> {
    const pool = requirePool();
    const result = await pool.query<SlotRow>(
      `SELECT s.*,
         (SELECT COUNT(*)::int FROM banner_slot_assignments a
          JOIN banners b ON b.id = a.banner_id AND b.deleted_at IS NULL
          WHERE a.slot_id = s.id) AS assigned_banner_count
       FROM banner_slots s
       ORDER BY s.slot_key ASC`
    );
    return result.rows.map(mapSlot);
  },

  async getSlotByKey(slotKey: string): Promise<BannerSlot | null> {
    const pool = requirePool();
    const result = await pool.query<SlotRow>(
      `SELECT s.*,
         (SELECT COUNT(*)::int FROM banner_slot_assignments a
          JOIN banners b ON b.id = a.banner_id AND b.deleted_at IS NULL
          WHERE a.slot_id = s.id) AS assigned_banner_count
       FROM banner_slots s
       WHERE s.slot_key = $1`,
      [slotKey]
    );
    return result.rows[0] ? mapSlot(result.rows[0]) : null;
  },

  async createSlot(input: CreateBannerSlotInput): Promise<BannerSlot> {
    const pool = requirePool();
    const result = await pool.query<SlotRow>(
      `INSERT INTO banner_slots (slot_key, slot_name, description, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *, 0 AS assigned_banner_count`,
      [input.slotKey, input.slotName, input.description ?? '', input.status]
    );
    return mapSlot(result.rows[0]!);
  },

  async updateSlot(id: string, input: UpdateBannerSlotInput): Promise<BannerSlot | null> {
    const pool = requirePool();
    const result = await pool.query<SlotRow>(
      `UPDATE banner_slots SET
         slot_name = COALESCE($2, slot_name),
         description = COALESCE($3, description),
         status = COALESCE($4, status)
       WHERE id = $1
       RETURNING *`,
      [id, input.slotName ?? null, input.description ?? null, input.status ?? null]
    );
    if (!result.rows[0]) return null;
    return this.getSlotByKey(result.rows[0].slot_key);
  },

  async getSlotById(id: string): Promise<BannerSlot | null> {
    const pool = requirePool();
    const result = await pool.query<SlotRow>(
      `SELECT s.*,
         (SELECT COUNT(*)::int FROM banner_slot_assignments a
          JOIN banners b ON b.id = a.banner_id AND b.deleted_at IS NULL
          WHERE a.slot_id = s.id) AS assigned_banner_count
       FROM banner_slots s
       WHERE s.id = $1`,
      [id]
    );
    return result.rows[0] ? mapSlot(result.rows[0]) : null;
  },

  /** Hard-delete slot; assignments cascade, event slot_id set null. */
  async deleteSlot(id: string): Promise<boolean> {
    const pool = requirePool();
    const result = await pool.query(`DELETE FROM banner_slots WHERE id = $1 RETURNING id`, [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async listPublicForSlot(slotKey: string): Promise<PublicBanner[]> {
    const pool = requirePool();
    const result = await pool.query<
      BannerRow & { slot_id: string; slot_key: string; assignment_priority: number }
    >(
      `SELECT b.*, s.id AS slot_id, s.slot_key, a.priority AS assignment_priority
       FROM banner_slot_assignments a
       JOIN banner_slots s ON s.id = a.slot_id
       JOIN banners b ON b.id = a.banner_id
       WHERE s.slot_key = $1
         AND s.status = 'active'
         AND b.deleted_at IS NULL
         AND b.status = 'active'
         AND b.image_url IS NOT NULL
         AND (b.start_at IS NULL OR b.start_at <= NOW())
         AND (b.end_at IS NULL OR b.end_at >= NOW())
       ORDER BY a.priority ASC, b.priority ASC, b.created_at DESC
       LIMIT $2`,
      [slotKey, BANNER_PUBLIC_SLOT_LIMIT]
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      advertiserName: row.advertiser_name,
      bannerType: row.banner_type as PublicBanner['bannerType'],
      imageUrl: row.image_url!,
      mobileImageUrl: row.mobile_image_url,
      targetUrl: row.target_url,
      openNewWindow: row.open_new_window,
      priority: row.assignment_priority,
      slotKey: row.slot_key,
      slotId: row.slot_id,
    }));
  },

  async recordEvent(params: {
    bannerId: string;
    slotKey: string;
    eventType: 'impression' | 'click';
    userId?: string | null;
    sessionId?: string | null;
  }): Promise<void> {
    const pool = requirePool();
    const slot = await pool.query<{ id: string }>(
      `SELECT id FROM banner_slots WHERE slot_key = $1`,
      [params.slotKey]
    );
    const slotId = slot.rows[0]?.id ?? null;

    await pool.query(
      `INSERT INTO banner_events (banner_id, slot_id, event_type, user_id, session_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [params.bannerId, slotId, params.eventType, params.userId ?? null, params.sessionId ?? null]
    );

    if (params.eventType === 'impression') {
      await pool.query(
        `UPDATE banners
         SET impression_count = impression_count + 1,
             last_impressed_at = NOW()
         WHERE id = $1 AND deleted_at IS NULL`,
        [params.bannerId]
      );
    } else {
      await pool.query(
        `UPDATE banners
         SET click_count = click_count + 1,
             last_clicked_at = NOW()
         WHERE id = $1 AND deleted_at IS NULL`,
        [params.bannerId]
      );
    }
  },

  async adminStats(): Promise<BannerAdminStats> {
    const pool = requirePool();
    const totals = await pool.query<{
      total_banners: string;
      active_banners: string;
      total_impressions: string;
      total_clicks: string;
    }>(
      `SELECT
         COUNT(*)::text AS total_banners,
         COUNT(*) FILTER (WHERE status = 'active')::text AS active_banners,
         COALESCE(SUM(impression_count), 0)::text AS total_impressions,
         COALESCE(SUM(click_count), 0)::text AS total_clicks
       FROM banners
       WHERE deleted_at IS NULL`
    );
    const t = totals.rows[0]!;
    const totalImpressions = toNum(t.total_impressions);
    const totalClicks = toNum(t.total_clicks);

    const top = await pool.query<BannerRow>(
      `SELECT * FROM banners
       WHERE deleted_at IS NULL
       ORDER BY click_count DESC, impression_count DESC
       LIMIT 10`
    );

    const bySlot = await pool.query<{
      slot_key: string;
      slot_name: string;
      banner_count: string;
      impressions: string;
      clicks: string;
    }>(
      `SELECT s.slot_key, s.slot_name,
         COUNT(DISTINCT a.banner_id)::text AS banner_count,
         COALESCE(SUM(b.impression_count), 0)::text AS impressions,
         COALESCE(SUM(b.click_count), 0)::text AS clicks
       FROM banner_slots s
       LEFT JOIN banner_slot_assignments a ON a.slot_id = s.id
       LEFT JOIN banners b ON b.id = a.banner_id AND b.deleted_at IS NULL
       GROUP BY s.id
       ORDER BY s.slot_key ASC`
    );

    return {
      totalBanners: toNum(t.total_banners),
      activeBanners: toNum(t.active_banners),
      totalImpressions,
      totalClicks,
      overallCtr: ctr(totalImpressions, totalClicks),
      topByClicks: top.rows.map((row) => {
        const impressionCount = toNum(row.impression_count);
        const clickCount = toNum(row.click_count);
        return {
          id: row.id,
          name: row.name,
          impressionCount,
          clickCount,
          ctr: ctr(impressionCount, clickCount),
        };
      }),
      bySlot: bySlot.rows.map((row) => ({
        slotKey: row.slot_key,
        slotName: row.slot_name,
        bannerCount: toNum(row.banner_count),
        impressions: toNum(row.impressions),
        clicks: toNum(row.clicks),
      })),
    };
  },

  async statsRows(): Promise<BannerStatsRow[]> {
    const { items } = await this.listAdmin({
      page: 1,
      pageSize: 100,
    });
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      advertiserName: item.advertiserName,
      status: item.status,
      impressionCount: item.impressionCount,
      clickCount: item.clickCount,
      ctr: item.ctr,
      lastImpressedAt: item.lastImpressedAt,
      lastClickedAt: item.lastClickedAt,
      slots: item.slots.map((s: BannerSlotAssignment) => ({
        slotKey: s.slotKey,
        slotName: s.slotName,
      })),
    }));
  },

  async deleteEventsOlderThan(days: number): Promise<number> {
    const pool = getPool();
    if (!pool || days <= 0) return 0;
    const result = await pool.query(
      `DELETE FROM banner_events WHERE created_at < NOW() - ($1::text || ' days')::interval`,
      [String(days)]
    );
    return result.rowCount ?? 0;
  },
};
