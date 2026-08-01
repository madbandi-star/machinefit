import type {
  AdminMachineRequestGroup,
  AdminMachineRequestGroupDetail,
  AdminMachineRequestPopularItem,
  AdminMachineRequestRequester,
  AdminMachineRequestStats,
  AdminMachineRequestListQuery,
  MachineRequestImage,
  UpdateMachineRequestAdminInput,
  PaginatedResponse,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';
import { buildPaginationMeta } from '../utils/pagination.util.js';
import { machineRequestImageUrl } from '../utils/public-api-base.js';
import { mockMachineRequests } from '../data/community.mock.js';

function normalizeStatus(status: string): AdminMachineRequestGroup['status'] {
  if (status === 'approved') return 'reviewing';
  if (status === 'pending' || status === 'reviewing' || status === 'rejected' || status === 'added') {
    return status;
  }
  return 'pending';
}

/** Priority for group badge: pending > reviewing > rejected > added */
function pickGroupStatus(statuses: string[]): AdminMachineRequestGroup['status'] {
  const normalized = statuses.map(normalizeStatus);
  if (normalized.includes('pending')) return 'pending';
  if (normalized.includes('reviewing')) return 'reviewing';
  if (normalized.includes('rejected')) return 'rejected';
  if (normalized.includes('added')) return 'added';
  return 'pending';
}

function groupKey(brandName: string, machineName: string): string {
  return `${brandName.trim().toLowerCase()}|${machineName.trim().toLowerCase()}`;
}

function mockGroups(): AdminMachineRequestGroupDetail[] {
  const map = new Map<string, typeof mockMachineRequests>();
  for (const req of mockMachineRequests) {
    const key = groupKey(req.brandName, req.machineName);
    const list = map.get(key) ?? [];
    list.push(req);
    map.set(key, list);
  }
  return [...map.entries()].map(([key, list]) => {
    const sorted = [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const first = [...list].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )[0];
    return {
      groupKey: key,
      brandName: list[0].brandName,
      machineName: list[0].machineName,
      requestCount: list.length,
      status: pickGroupStatus(list.map((r) => r.status)),
      firstRequestedAt: first.createdAt,
      lastRequestedAt: sorted[0].createdAt,
      adminNote: sorted[0].adminNote ?? null,
      rejectReason: null,
      linkedMachineId: sorted.find((r) => r.linkedMachineId)?.linkedMachineId ?? null,
      linkedMachineCode: null,
      sampleDescription: sorted[0].description,
      primaryImageUrl: sorted[0].primaryImageUrl ?? null,
      requesters: sorted.map((r) => {
        const images = (r.images ?? []).map((img, index) => ({
          id: img.id,
          sortOrder: img.sortOrder ?? index,
          thumbUrl: img.thumbUrl || machineRequestImageUrl(img.id, 'thumb'),
          imageUrl: img.imageUrl || machineRequestImageUrl(img.id, 'full'),
        }));
        return {
          requestId: r.id,
          userId: r.userId,
          authorName: r.authorName ?? 'User',
          description: r.description,
          gymChoiceMode: r.gymChoiceMode,
          gymName: r.gymName,
          primaryImageUrl: r.primaryImageUrl ?? images[0]?.thumbUrl,
          images,
          createdAt: r.createdAt,
          status: normalizeStatus(r.status),
        };
      }),
    };
  });
}

export const machineRequestAdminRepository = {
  async stats(): Promise<AdminMachineRequestStats> {
    const pool = getPool();
    if (!pool) {
      const items = mockMachineRequests;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      return {
        total: items.length,
        pending: items.filter((r) => normalizeStatus(r.status) === 'pending').length,
        reviewing: items.filter((r) => normalizeStatus(r.status) === 'reviewing').length,
        added: items.filter((r) => r.status === 'added').length,
        rejected: items.filter((r) => r.status === 'rejected').length,
        thisMonthRequests: items.filter((r) => r.createdAt >= monthStart).length,
        thisMonthAdded: items.filter((r) => r.status === 'added' && r.updatedAt >= monthStart)
          .length,
      };
    }

    const result = await pool.query<{
      total: string;
      pending: string;
      reviewing: string;
      added: string;
      rejected: string;
      this_month_requests: string;
      this_month_added: string;
    }>(
      `SELECT
         COUNT(*)::text AS total,
         COUNT(*) FILTER (WHERE status IN ('pending'))::text AS pending,
         COUNT(*) FILTER (WHERE status IN ('reviewing', 'approved'))::text AS reviewing,
         COUNT(*) FILTER (WHERE status = 'added')::text AS added,
         COUNT(*) FILTER (WHERE status = 'rejected')::text AS rejected,
         COUNT(*) FILTER (
           WHERE created_at >= date_trunc('month', NOW())
         )::text AS this_month_requests,
         COUNT(*) FILTER (
           WHERE status = 'added' AND updated_at >= date_trunc('month', NOW())
         )::text AS this_month_added
       FROM machine_requests`
    );
    const row = result.rows[0];
    return {
      total: Number(row?.total ?? 0),
      pending: Number(row?.pending ?? 0),
      reviewing: Number(row?.reviewing ?? 0),
      added: Number(row?.added ?? 0),
      rejected: Number(row?.rejected ?? 0),
      thisMonthRequests: Number(row?.this_month_requests ?? 0),
      thisMonthAdded: Number(row?.this_month_added ?? 0),
    };
  },

  async popular(limit = 20): Promise<AdminMachineRequestPopularItem[]> {
    const pool = getPool();
    if (!pool) {
      return mockGroups()
        .sort((a, b) => b.requestCount - a.requestCount || b.lastRequestedAt.localeCompare(a.lastRequestedAt))
        .slice(0, limit)
        .map((g) => ({
          groupKey: g.groupKey,
          brandName: g.brandName,
          machineName: g.machineName,
          requestCount: g.requestCount,
        }));
    }

    const result = await pool.query<{
      brand_name: string;
      machine_name: string;
      request_count: string;
    }>(
      `SELECT brand_name, machine_name, COUNT(*)::text AS request_count
       FROM machine_requests
       GROUP BY lower(trim(brand_name)), lower(trim(machine_name)), brand_name, machine_name
       ORDER BY COUNT(*) DESC, MAX(created_at) DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows.map((r) => ({
      groupKey: groupKey(r.brand_name, r.machine_name),
      brandName: r.brand_name,
      machineName: r.machine_name,
      requestCount: Number(r.request_count),
    }));
  },

  async listGroups(
    query: AdminMachineRequestListQuery
  ): Promise<PaginatedResponse<AdminMachineRequestGroup>> {
    const pool = getPool();
    const page = query.page;
    const limit = query.limit;

    if (!pool) {
      let groups = mockGroups();
      if (query.brand?.trim()) {
        const q = query.brand.trim().toLowerCase();
        groups = groups.filter((g) => g.brandName.toLowerCase().includes(q));
      }
      if (query.machineName?.trim()) {
        const q = query.machineName.trim().toLowerCase();
        groups = groups.filter((g) => g.machineName.toLowerCase().includes(q));
      }
      if (query.requester?.trim()) {
        const q = query.requester.trim().toLowerCase();
        groups = groups.filter((g) =>
          g.requesters.some((r) => r.authorName.toLowerCase().includes(q))
        );
      }
      if (query.status && query.status !== 'all') {
        const status = normalizeStatus(query.status);
        groups = groups.filter((g) => g.status === status);
      }
      groups.sort(
        (a, b) =>
          b.requestCount - a.requestCount || b.lastRequestedAt.localeCompare(a.lastRequestedAt)
      );
      const start = (page - 1) * limit;
      const items = groups.slice(start, start + limit).map(({ requesters: _r, ...rest }) => rest);
      return { items, meta: buildPaginationMeta(page, limit, groups.length) };
    }

    const conditions: string[] = ['TRUE'];
    const params: unknown[] = [];
    let idx = 1;

    if (query.brand?.trim()) {
      conditions.push(`lower(mr.brand_name) LIKE $${idx++}`);
      params.push(`%${query.brand.trim().toLowerCase()}%`);
    }
    if (query.machineName?.trim()) {
      conditions.push(`lower(mr.machine_name) LIKE $${idx++}`);
      params.push(`%${query.machineName.trim().toLowerCase()}%`);
    }
    if (query.requester?.trim()) {
      conditions.push(`lower(u.display_name) LIKE $${idx++}`);
      params.push(`%${query.requester.trim().toLowerCase()}%`);
    }
    if (query.status && query.status !== 'all') {
      const status = normalizeStatus(query.status);
      if (status === 'reviewing') {
        conditions.push(`mr.status IN ('reviewing', 'approved')`);
      } else {
        conditions.push(`mr.status = $${idx++}`);
        params.push(status);
      }
    }
    if (query.dateFrom?.trim()) {
      conditions.push(`mr.created_at >= $${idx++}::timestamptz`);
      params.push(query.dateFrom.trim());
    }
    if (query.dateTo?.trim()) {
      conditions.push(`mr.created_at < ($${idx++}::date + INTERVAL '1 day')`);
      params.push(query.dateTo.trim());
    }

    const where = conditions.join(' AND ');

    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM (
         SELECT 1
         FROM machine_requests mr
         JOIN users u ON u.id = mr.user_id
         WHERE ${where}
         GROUP BY lower(trim(mr.brand_name)), lower(trim(mr.machine_name))
       ) g`,
      params
    );
    const total = Number(countResult.rows[0]?.count ?? 0);

    const listParams = [...params, limit, (page - 1) * limit];
    const listResult = await pool.query<{
      brand_name: string;
      machine_name: string;
      request_count: string;
      statuses: string[];
      first_requested_at: string;
      last_requested_at: string;
      admin_note: string | null;
      reject_reason: string | null;
      linked_machine_id: string | null;
      linked_machine_code: string | null;
      sample_description: string | null;
      primary_image_id: string | null;
    }>(
      `SELECT
         (array_agg(mr.brand_name ORDER BY mr.created_at DESC))[1] AS brand_name,
         (array_agg(mr.machine_name ORDER BY mr.created_at DESC))[1] AS machine_name,
         COUNT(*)::text AS request_count,
         array_agg(DISTINCT mr.status) AS statuses,
         MIN(mr.created_at) AS first_requested_at,
         MAX(mr.created_at) AS last_requested_at,
         (array_agg(mr.admin_note ORDER BY mr.updated_at DESC NULLS LAST))[1] AS admin_note,
         (array_agg(mr.reject_reason ORDER BY mr.updated_at DESC NULLS LAST))[1] AS reject_reason,
         (array_agg(mr.linked_machine_id ORDER BY mr.updated_at DESC NULLS LAST)
           FILTER (WHERE mr.linked_machine_id IS NOT NULL))[1] AS linked_machine_id,
         (array_agg(m.code ORDER BY mr.updated_at DESC NULLS LAST)
           FILTER (WHERE m.code IS NOT NULL))[1] AS linked_machine_code,
         (array_agg(mr.description ORDER BY mr.created_at DESC))[1] AS sample_description,
         (
           SELECT i.id
           FROM machine_request_images i
           WHERE i.request_id = (array_agg(mr.id ORDER BY mr.created_at DESC))[1]
           ORDER BY i.sort_order ASC
           LIMIT 1
         ) AS primary_image_id
       FROM machine_requests mr
       JOIN users u ON u.id = mr.user_id
       LEFT JOIN machines m ON m.id = mr.linked_machine_id
       WHERE ${where}
       GROUP BY lower(trim(mr.brand_name)), lower(trim(mr.machine_name))
       ORDER BY COUNT(*) DESC, MAX(mr.created_at) DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      listParams
    );

    const items: AdminMachineRequestGroup[] = listResult.rows.map((r) => ({
      groupKey: groupKey(r.brand_name, r.machine_name),
      brandName: r.brand_name,
      machineName: r.machine_name,
      requestCount: Number(r.request_count),
      status: pickGroupStatus(r.statuses ?? []),
      firstRequestedAt: r.first_requested_at,
      lastRequestedAt: r.last_requested_at,
      adminNote: r.admin_note,
      rejectReason: r.reject_reason,
      linkedMachineId: r.linked_machine_id,
      linkedMachineCode: r.linked_machine_code,
      sampleDescription: r.sample_description,
      primaryImageUrl: r.primary_image_id
        ? machineRequestImageUrl(r.primary_image_id, 'thumb')
        : null,
    }));

    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getGroupDetail(
    brandName: string,
    machineName: string
  ): Promise<AdminMachineRequestGroupDetail> {
    const pool = getPool();
    if (!pool) {
      const detail = mockGroups().find(
        (g) =>
          g.brandName.trim().toLowerCase() === brandName.trim().toLowerCase() &&
          g.machineName.trim().toLowerCase() === machineName.trim().toLowerCase()
      );
      if (!detail) throw new AppError(404, 'NOT_FOUND', 'Request group not found');
      return detail;
    }

    const list = await this.listGroups({
      brand: brandName,
      machineName,
      status: 'all',
      page: 1,
      limit: 1,
    });
    const group = list.items.find(
      (g) =>
        g.brandName.trim().toLowerCase() === brandName.trim().toLowerCase() &&
        g.machineName.trim().toLowerCase() === machineName.trim().toLowerCase()
    );
    if (!group) throw new AppError(404, 'NOT_FOUND', 'Request group not found');

    const rows = await pool.query<{
      id: string;
      user_id: string;
      author_name: string;
      description: string;
      gym_choice_mode: string | null;
      gym_name: string | null;
      created_at: string;
      status: string;
    }>(
      `SELECT mr.id, mr.user_id, u.display_name AS author_name, mr.description,
              mr.gym_choice_mode, mr.gym_name, mr.created_at, mr.status
       FROM machine_requests mr
       JOIN users u ON u.id = mr.user_id
       WHERE lower(trim(mr.brand_name)) = lower(trim($1))
         AND lower(trim(mr.machine_name)) = lower(trim($2))
       ORDER BY mr.created_at DESC`,
      [brandName, machineName]
    );

    const requestIds = rows.rows.map((r) => r.id);
    const imagesByRequest = new Map<string, MachineRequestImage[]>();
    if (requestIds.length > 0) {
      const imageRows = await pool.query<{
        id: string;
        request_id: string;
        sort_order: number;
      }>(
        `SELECT id, request_id, sort_order
         FROM machine_request_images
         WHERE request_id = ANY($1::uuid[])
         ORDER BY request_id ASC, sort_order ASC, created_at ASC`,
        [requestIds]
      );
      for (const img of imageRows.rows) {
        const list = imagesByRequest.get(img.request_id) ?? [];
        list.push({
          id: img.id,
          sortOrder: img.sort_order,
          thumbUrl: machineRequestImageUrl(img.id, 'thumb'),
          imageUrl: machineRequestImageUrl(img.id, 'full'),
        });
        imagesByRequest.set(img.request_id, list);
      }
    }

    const requesters: AdminMachineRequestRequester[] = rows.rows.map((r) => {
      const images = imagesByRequest.get(r.id) ?? [];
      return {
        requestId: r.id,
        userId: r.user_id,
        authorName: r.author_name,
        description: r.description,
        gymChoiceMode: (r.gym_choice_mode as AdminMachineRequestRequester['gymChoiceMode']) ?? undefined,
        gymName: r.gym_name,
        primaryImageUrl: images[0]?.thumbUrl,
        images,
        createdAt: r.created_at,
        status: normalizeStatus(r.status),
      };
    });

    let existingMachineId: string | null = group.linkedMachineId ?? null;
    let existingMachineCode: string | null = group.linkedMachineCode ?? null;
    if (!existingMachineId) {
      const existing = await pool.query<{ id: string; code: string }>(
        `SELECT m.id, m.code
         FROM machines m
         JOIN brands b ON b.id = m.brand_id
         WHERE (
           lower(trim(COALESCE(b.name->>'en', ''))) = lower(trim($1))
           OR lower(trim(COALESCE(b.name->>'ko', ''))) = lower(trim($1))
           OR lower(trim(b.code)) = lower(trim($1))
         )
         AND (
           lower(trim(COALESCE(m.name->>'en', ''))) = lower(trim($2))
           OR lower(trim(COALESCE(m.name->>'ko', ''))) = lower(trim($2))
         )
         LIMIT 1`,
        [brandName, machineName]
      );
      if (existing.rows[0]) {
        existingMachineId = existing.rows[0].id;
        existingMachineCode = existing.rows[0].code;
      }
    }

    return {
      ...group,
      requesters,
      existingMachineId,
      existingMachineCode,
    };
  },

  async updateRequest(
    id: string,
    input: UpdateMachineRequestAdminInput
  ): Promise<{ updatedCount: number }> {
    const pool = getPool();
    let status = input.status;
    if (status === 'approved') status = 'reviewing';

    if (!pool) {
      const targets = input.applyToGroup
        ? mockMachineRequests.filter((r) => {
            const seed = mockMachineRequests.find((x) => x.id === id);
            if (!seed) return false;
            return (
              r.brandName.trim().toLowerCase() === seed.brandName.trim().toLowerCase() &&
              r.machineName.trim().toLowerCase() === seed.machineName.trim().toLowerCase()
            );
          })
        : mockMachineRequests.filter((r) => r.id === id);
      if (!targets.length) throw new AppError(404, 'NOT_FOUND', 'Machine request not found');
      for (const req of targets) {
        if (status) req.status = status;
        if (input.adminNote !== undefined) req.adminNote = input.adminNote ?? undefined;
        if (input.linkedMachineId !== undefined) {
          req.linkedMachineId = input.linkedMachineId ?? undefined;
        }
        req.updatedAt = new Date().toISOString();
      }
      return { updatedCount: targets.length };
    }

    if (input.applyToGroup) {
      const brand = input.groupBrandName;
      const machine = input.groupMachineName;
      if (!brand || !machine) {
        throw new AppError(400, 'VALIDATION_ERROR', 'groupBrandName and groupMachineName required');
      }
      const result = await pool.query(
        `UPDATE machine_requests SET
           status = COALESCE($1, status),
           admin_note = CASE WHEN $2::boolean THEN $3 ELSE admin_note END,
           reject_reason = CASE WHEN $4::boolean THEN $5 ELSE reject_reason END,
           linked_machine_id = CASE WHEN $6::boolean THEN $7::uuid ELSE linked_machine_id END,
           updated_at = NOW()
         WHERE lower(trim(brand_name)) = lower(trim($8))
           AND lower(trim(machine_name)) = lower(trim($9))`,
        [
          status ?? null,
          input.adminNote !== undefined,
          input.adminNote ?? null,
          input.rejectReason !== undefined,
          input.rejectReason ?? null,
          input.linkedMachineId !== undefined,
          input.linkedMachineId ?? null,
          brand,
          machine,
        ]
      );
      if (!result.rowCount) throw new AppError(404, 'NOT_FOUND', 'Machine request group not found');
      return { updatedCount: result.rowCount };
    }

    const result = await pool.query(
      `UPDATE machine_requests SET
         status = COALESCE($1, status),
         admin_note = CASE WHEN $2::boolean THEN $3 ELSE admin_note END,
         reject_reason = CASE WHEN $4::boolean THEN $5 ELSE reject_reason END,
         linked_machine_id = CASE WHEN $6::boolean THEN $7::uuid ELSE linked_machine_id END,
         updated_at = NOW()
       WHERE id = $8
       RETURNING id`,
      [
        status ?? null,
        input.adminNote !== undefined,
        input.adminNote ?? null,
        input.rejectReason !== undefined,
        input.rejectReason ?? null,
        input.linkedMachineId !== undefined,
        input.linkedMachineId ?? null,
        id,
      ]
    );
    if (!result.rowCount) throw new AppError(404, 'NOT_FOUND', 'Machine request not found');
    return { updatedCount: 1 };
  },
};
