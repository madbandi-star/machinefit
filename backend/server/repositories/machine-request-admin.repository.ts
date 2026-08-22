import type {
  AdminMachineRequestGroup,
  AdminMachineRequestGroupDetail,
  AdminMachineRequestCommentPreview,
  AdminMachineRequestPopularItem,
  AdminMachineRequestRegisterSuggest,
  AdminMachineRequestRequester,
  AdminMachineRequestStats,
  AdminMachineRequestListQuery,
  MachineRequestPriority,
  UpdateMachineRequestAdminInput,
  PaginatedResponse,
} from '@machinefit/shared';
import { isRoleCode } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';
import { buildPaginationMeta } from '../utils/pagination.util.js';
import { machineRequestImageUrl } from '../utils/public-api-base.js';
import { mockMachineRequests, mockMachineRequestComments } from '../data/community.mock.js';

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

/** Highest priority among group: high > normal > low */
function pickGroupPriority(priorities: Array<string | null | undefined>): MachineRequestPriority {
  const normalized = priorities.map((p) => p || 'normal');
  if (normalized.includes('high')) return 'high';
  if (normalized.includes('normal')) return 'normal';
  if (normalized.includes('low')) return 'low';
  return 'normal';
}

function groupKey(brandName: string, machineName: string): string {
  return `${brandName.trim().toLowerCase()}|${machineName.trim().toLowerCase()}`;
}

function sameGroupKey(aBrand: string, aMachine: string, bBrand: string, bMachine: string): boolean {
  return (
    aBrand.trim().toLowerCase() === bBrand.trim().toLowerCase() &&
    aMachine.trim().toLowerCase() === bMachine.trim().toLowerCase()
  );
}

function suggestCode(brandName: string, machineName: string): string {
  const slug = `${brandName}_${machineName}`
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
  return slug || 'MACHINE';
}

function guessMuscleGroup(text: string): string {
  const t = text.toLowerCase();
  if (/chest|pec|bench|체스트|가슴|펙/.test(t)) return 'chest';
  if (/back|lat|row|pulldown|pull.?down|pullover|풀다운|로우|등|광배/.test(t)) return 'back';
  if (/leg|squat|calf|glute|hamstring|quad|하체|레그|스쿼트|허벅|둔근/.test(t)) return 'leg';
  if (/shoulder|delt|숄더|어깨/.test(t)) return 'shoulder';
  if (/arm|bicep|tricep|curl|이두|삼두|암|컬/.test(t)) return 'arm';
  if (/core|ab\b|abs|복부|코어|크런치/.test(t)) return 'core';
  if (/full.?body|전신|functional/.test(t)) return 'full_body';
  return 'chest';
}

function guessMachineType(text: string): string {
  const t = text.toLowerCase();
  if (/cable|케이블/.test(t)) return 'cable';
  if (/smith|스미스/.test(t)) return 'smith';
  if (/plate|플레이트/.test(t)) return 'plate_loaded';
  if (/free|dumbbell|barbell|kettle|프리|덤벨|바벨|케틀/.test(t)) return 'free_weight';
  if (/bodyweight|자중|친업|딥스/.test(t)) return 'bodyweight';
  return 'selectorized';
}

function buildRegisterSuggest(
  brandName: string,
  machineName: string,
  sampleDescription: string | null | undefined,
  options?: { guessText?: string }
): AdminMachineRequestRegisterSuggest {
  const desc = sampleDescription?.trim() ?? '';
  const guessSource = options?.guessText?.trim() || desc;
  const text = `${machineName} ${guessSource}`;
  return {
    code: suggestCode(brandName, machineName),
    nameKo: machineName,
    nameEn: machineName,
    muscleGroup: guessMuscleGroup(text),
    machineType: guessMachineType(text),
    descriptionKo: desc,
    descriptionEn: desc,
    matchedBrandId: null,
  };
}

function pickBestDescription(candidates: Array<string | null | undefined>): string {
  return (
    candidates
      .map((v) => v?.trim() ?? '')
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)[0] ?? ''
  );
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
    const requestIds = new Set(list.map((r) => r.id));
    const recentComments: AdminMachineRequestCommentPreview[] = mockMachineRequestComments
      .filter((c) => requestIds.has(c.requestId) && !c.isHidden)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
      .map((c) => ({
        id: c.id,
        requestId: c.requestId,
        authorName: c.authorName ?? 'User',
        authorRoleCode: c.authorRoleCode,
        content: c.content,
        createdAt: c.createdAt,
      }));
    const voteCount = list.reduce((sum, r) => sum + (r.voteCount ?? 0), 0);
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
      voteCount,
      priority: pickGroupPriority(list.map((r) => r.priority)),
      assigneeUserId: null,
      assigneeName: null,
      requesters: sorted.map((r) => ({
        requestId: r.id,
        userId: r.userId,
        authorName: r.authorName ?? 'User',
        authorRoleCode: r.authorRoleCode,
        description: r.description,
        gymChoiceMode: r.gymChoiceMode,
        gymName: r.gymName,
        commercialUseConsent: r.commercialUseConsent,
        likeCount: r.likeCount ?? 0,
        commentCount: r.commentCount ?? 0,
        viewCount: r.viewCount ?? 0,
        voteCount: r.voteCount ?? 0,
        priority: r.priority ?? 'normal',
        assigneeUserId: null,
        assigneeName: null,
        isHidden: r.isHidden ?? false,
        primaryImageUrl: r.primaryImageUrl,
        images: r.images,
        createdAt: r.createdAt,
        status: normalizeStatus(r.status),
      })),
      recentComments,
      registerSuggest: buildRegisterSuggest(
        list[0].brandName,
        list[0].machineName,
        sorted[0].description
      ),
    };
  });
}

const GROUP_PRIORITY_SQL = `CASE
  WHEN bool_or(mr.priority = 'high') THEN 'high'
  WHEN bool_or(mr.priority = 'normal') THEN 'normal'
  WHEN bool_or(mr.priority = 'low') THEN 'low'
  ELSE 'normal'
END`;

export const machineRequestAdminRepository = {
  async stats(): Promise<AdminMachineRequestStats> {
    const pool = getPool();
    if (!pool) {
      const items = mockMachineRequests;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const gymCounts = new Map<string, number>();
      for (const r of items) {
        const name = r.gymName?.trim() || '모름';
        gymCounts.set(name, (gymCounts.get(name) ?? 0) + 1);
      }
      const topGyms = [...gymCounts.entries()]
        .map(([gymName, requestCount]) => ({ gymName, requestCount }))
        .sort((a, b) => b.requestCount - a.requestCount)
        .slice(0, 10);
      return {
        total: items.length,
        pending: items.filter((r) => normalizeStatus(r.status) === 'pending').length,
        reviewing: items.filter((r) => normalizeStatus(r.status) === 'reviewing').length,
        added: items.filter((r) => r.status === 'added').length,
        rejected: items.filter((r) => r.status === 'rejected').length,
        thisMonthRequests: items.filter((r) => r.createdAt >= monthStart).length,
        thisMonthAdded: items.filter((r) => r.status === 'added' && r.updatedAt >= monthStart)
          .length,
        topGyms,
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

    const gymResult = await pool.query<{ gym_name: string; request_count: string }>(
      `SELECT COALESCE(NULLIF(trim(gym_name), ''), '모름') AS gym_name,
              COUNT(*)::text AS request_count
       FROM machine_requests
       GROUP BY COALESCE(NULLIF(trim(gym_name), ''), '모름')
       ORDER BY COUNT(*) DESC
       LIMIT 10`
    );

    return {
      total: Number(row?.total ?? 0),
      pending: Number(row?.pending ?? 0),
      reviewing: Number(row?.reviewing ?? 0),
      added: Number(row?.added ?? 0),
      rejected: Number(row?.rejected ?? 0),
      thisMonthRequests: Number(row?.this_month_requests ?? 0),
      thisMonthAdded: Number(row?.this_month_added ?? 0),
      topGyms: gymResult.rows.map((r) => ({
        gymName: r.gym_name,
        requestCount: Number(r.request_count),
      })),
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
          voteCount: g.voteCount ?? 0,
        }));
    }

    const result = await pool.query<{
      brand_name: string;
      machine_name: string;
      request_count: string;
      vote_count: string;
    }>(
      `SELECT brand_name, machine_name,
              COUNT(*)::text AS request_count,
              COALESCE(SUM(vote_count), 0)::text AS vote_count
       FROM machine_requests
       GROUP BY lower(trim(brand_name)), lower(trim(machine_name)), brand_name, machine_name
       ORDER BY COUNT(*) DESC, COALESCE(SUM(vote_count), 0) DESC, MAX(created_at) DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows.map((r) => ({
      groupKey: groupKey(r.brand_name, r.machine_name),
      brandName: r.brand_name,
      machineName: r.machine_name,
      requestCount: Number(r.request_count),
      voteCount: Number(r.vote_count),
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
      vote_count: string;
      priority: string;
      assignee_user_id: string | null;
      assignee_name: string | null;
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
         COALESCE(SUM(mr.vote_count), 0)::text AS vote_count,
         ${GROUP_PRIORITY_SQL} AS priority,
         (array_agg(mr.assignee_user_id ORDER BY mr.created_at DESC))[1] AS assignee_user_id,
         (array_agg(au.display_name ORDER BY mr.created_at DESC))[1] AS assignee_name,
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
       LEFT JOIN users au ON au.id = mr.assignee_user_id
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
      voteCount: Number(r.vote_count),
      priority: (r.priority as MachineRequestPriority) || 'normal',
      assigneeUserId: r.assignee_user_id,
      assigneeName: r.assignee_name,
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

    const groupResult = await pool.query<{
      brand_name: string;
      machine_name: string;
      request_count: string;
      vote_count: string;
      priority: string;
      assignee_user_id: string | null;
      assignee_name: string | null;
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
         COALESCE(SUM(mr.vote_count), 0)::text AS vote_count,
         ${GROUP_PRIORITY_SQL} AS priority,
         (array_agg(mr.assignee_user_id ORDER BY mr.created_at DESC))[1] AS assignee_user_id,
         (array_agg(au.display_name ORDER BY mr.created_at DESC))[1] AS assignee_name,
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
       LEFT JOIN users au ON au.id = mr.assignee_user_id
       LEFT JOIN machines m ON m.id = mr.linked_machine_id
       WHERE lower(trim(mr.brand_name)) = lower(trim($1))
         AND lower(trim(mr.machine_name)) = lower(trim($2))
       GROUP BY lower(trim(mr.brand_name)), lower(trim(mr.machine_name))`,
      [brandName, machineName]
    );
    const g = groupResult.rows[0];
    if (!g) throw new AppError(404, 'NOT_FOUND', 'Request group not found');

    const group: AdminMachineRequestGroup = {
      groupKey: groupKey(g.brand_name, g.machine_name),
      brandName: g.brand_name,
      machineName: g.machine_name,
      requestCount: Number(g.request_count),
      status: pickGroupStatus(g.statuses ?? []),
      firstRequestedAt: g.first_requested_at,
      lastRequestedAt: g.last_requested_at,
      adminNote: g.admin_note,
      rejectReason: g.reject_reason,
      linkedMachineId: g.linked_machine_id,
      linkedMachineCode: g.linked_machine_code,
      sampleDescription: g.sample_description,
      primaryImageUrl: g.primary_image_id
        ? machineRequestImageUrl(g.primary_image_id, 'thumb')
        : null,
      voteCount: Number(g.vote_count),
      priority: (g.priority as MachineRequestPriority) || 'normal',
      assigneeUserId: g.assignee_user_id,
      assigneeName: g.assignee_name,
    };

    const rows = await pool.query<{
      id: string;
      user_id: string;
      author_name: string;
      author_role_code: string | null;
      author_hellpower_score: number;
      description: string;
      gym_choice_mode: string | null;
      gym_name: string | null;
      commercial_use_consent: boolean | null;
      like_count: number | null;
      comment_count: number | null;
      view_count: number | null;
      vote_count: number | null;
      priority: string | null;
      assignee_user_id: string | null;
      assignee_name: string | null;
      is_hidden: boolean | null;
      created_at: string;
      status: string;
    }>(
      `SELECT mr.id, mr.user_id, u.display_name AS author_name, r.code AS author_role_code,
              COALESCE(up.balance, 0)::int AS author_hellpower_score,
              mr.description,
              mr.gym_choice_mode, mr.gym_name, mr.commercial_use_consent,
              mr.like_count, mr.comment_count, mr.view_count,
              mr.vote_count, mr.priority, mr.assignee_user_id,
              au.display_name AS assignee_name,
              mr.is_hidden, mr.created_at, mr.status
       FROM machine_requests mr
       JOIN users u ON u.id = mr.user_id
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN user_points up ON up.user_id = u.id
       LEFT JOIN users au ON au.id = mr.assignee_user_id
       WHERE lower(trim(mr.brand_name)) = lower(trim($1))
         AND lower(trim(mr.machine_name)) = lower(trim($2))
       ORDER BY mr.created_at DESC`,
      [brandName, machineName]
    );

    const requestIds = rows.rows.map((r) => r.id);
    const imageRows =
      requestIds.length === 0
        ? { rows: [] as Array<{ id: string; request_id: string; sort_order: number }> }
        : await pool.query<{ id: string; request_id: string; sort_order: number }>(
            `SELECT id, request_id, sort_order
             FROM machine_request_images
             WHERE request_id = ANY($1::uuid[])
             ORDER BY request_id, sort_order ASC, created_at ASC`,
            [requestIds]
          );
    const imagesByRequest = new Map<string, AdminMachineRequestRequester['images']>();
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

    const requesters: AdminMachineRequestRequester[] = rows.rows.map((r) => {
      const images = imagesByRequest.get(r.id) ?? [];
      return {
        requestId: r.id,
        userId: r.user_id,
        authorName: r.author_name,
        authorRoleCode: isRoleCode(r.author_role_code) ? r.author_role_code : undefined,
        authorHellpowerScore: Number(r.author_hellpower_score ?? 0),
        description: r.description,
        gymChoiceMode:
          (r.gym_choice_mode as AdminMachineRequestRequester['gymChoiceMode']) ?? undefined,
        gymName: r.gym_name,
        commercialUseConsent: Boolean(r.commercial_use_consent),
        likeCount: Number(r.like_count ?? 0),
        commentCount: Number(r.comment_count ?? 0),
        viewCount: Number(r.view_count ?? 0),
        voteCount: Number(r.vote_count ?? 0),
        priority: ((r.priority as MachineRequestPriority | null) ?? 'normal') as MachineRequestPriority,
        assigneeUserId: r.assignee_user_id,
        assigneeName: r.assignee_name,
        isHidden: Boolean(r.is_hidden),
        primaryImageUrl: images[0]?.thumbUrl,
        images,
        createdAt: r.created_at,
        status: normalizeStatus(r.status),
      };
    });

    const commentResult = await pool.query<{
      id: string;
      request_id: string;
      author_name: string;
      author_role_code: string | null;
      author_hellpower_score: number;
      content: string;
      created_at: string;
    }>(
      `SELECT c.id, c.request_id, u.display_name AS author_name, r.code AS author_role_code,
              COALESCE(up.balance, 0)::int AS author_hellpower_score,
              c.content, c.created_at
       FROM machine_request_comments c
       JOIN users u ON u.id = c.user_id
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN user_points up ON up.user_id = u.id
       JOIN machine_requests mr ON mr.id = c.request_id
       WHERE lower(trim(mr.brand_name)) = lower(trim($1))
         AND lower(trim(mr.machine_name)) = lower(trim($2))
         AND c.is_hidden = FALSE
       ORDER BY c.created_at DESC
       LIMIT 20`,
      [brandName, machineName]
    );
    const recentComments: AdminMachineRequestCommentPreview[] = commentResult.rows.map((c) => ({
      id: c.id,
      requestId: c.request_id,
      authorName: c.author_name,
      authorRoleCode: isRoleCode(c.author_role_code) ? c.author_role_code : undefined,
      authorHellpowerScore: Number(c.author_hellpower_score ?? 0),
      content: c.content,
      createdAt: c.created_at,
    }));

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

    const allDescriptions = [
      group.sampleDescription,
      ...requesters.map((r) => r.description),
    ];
    const guessText = allDescriptions.filter((v): v is string => Boolean(v?.trim())).join(' ');
    const bestDescription = pickBestDescription(allDescriptions);

    return {
      ...group,
      requesters,
      recentComments,
      existingMachineId,
      existingMachineCode,
      registerSuggest: buildRegisterSuggest(
        group.brandName,
        group.machineName,
        bestDescription || group.sampleDescription,
        { guessText }
      ),
    };
  },

  async mergeGroups(
    fromBrand: string,
    fromMachine: string,
    toBrand: string,
    toMachine: string
  ): Promise<{ updatedCount: number }> {
    if (sameGroupKey(fromBrand, fromMachine, toBrand, toMachine)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Cannot merge a group into itself');
    }

    const pool = getPool();
    if (!pool) {
      const targets = mockMachineRequests.filter((r) =>
        sameGroupKey(r.brandName, r.machineName, fromBrand, fromMachine)
      );
      for (const req of targets) {
        req.brandName = toBrand;
        req.machineName = toMachine;
        req.updatedAt = new Date().toISOString();
      }
      return { updatedCount: targets.length };
    }

    const result = await pool.query(
      `UPDATE machine_requests
       SET brand_name = $3,
           machine_name = $4,
           updated_at = NOW()
       WHERE lower(trim(brand_name)) = lower(trim($1))
         AND lower(trim(machine_name)) = lower(trim($2))`,
      [fromBrand, fromMachine, toBrand, toMachine]
    );
    return { updatedCount: result.rowCount ?? 0 };
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
        if (input.isHidden !== undefined) req.isHidden = input.isHidden;
        if (input.priority !== undefined) req.priority = input.priority;
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
           is_hidden = CASE WHEN $8::boolean THEN $9 ELSE is_hidden END,
           priority = CASE WHEN $10::boolean THEN $11 ELSE priority END,
           assignee_user_id = CASE WHEN $12::boolean THEN $13::uuid ELSE assignee_user_id END,
           updated_at = NOW()
         WHERE lower(trim(brand_name)) = lower(trim($14))
           AND lower(trim(machine_name)) = lower(trim($15))`,
        [
          status ?? null,
          input.adminNote !== undefined,
          input.adminNote ?? null,
          input.rejectReason !== undefined,
          input.rejectReason ?? null,
          input.linkedMachineId !== undefined,
          input.linkedMachineId ?? null,
          input.isHidden !== undefined,
          input.isHidden ?? false,
          input.priority !== undefined,
          input.priority ?? 'normal',
          input.assigneeUserId !== undefined,
          input.assigneeUserId ?? null,
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
         is_hidden = CASE WHEN $8::boolean THEN $9 ELSE is_hidden END,
         priority = CASE WHEN $10::boolean THEN $11 ELSE priority END,
         assignee_user_id = CASE WHEN $12::boolean THEN $13::uuid ELSE assignee_user_id END,
         updated_at = NOW()
       WHERE id = $14
       RETURNING id`,
      [
        status ?? null,
        input.adminNote !== undefined,
        input.adminNote ?? null,
        input.rejectReason !== undefined,
        input.rejectReason ?? null,
        input.linkedMachineId !== undefined,
        input.linkedMachineId ?? null,
        input.isHidden !== undefined,
        input.isHidden ?? false,
        input.priority !== undefined,
        input.priority ?? 'normal',
        input.assigneeUserId !== undefined,
        input.assigneeUserId ?? null,
        id,
      ]
    );
    if (!result.rowCount) throw new AppError(404, 'NOT_FOUND', 'Machine request not found');
    return { updatedCount: 1 };
  },
};
