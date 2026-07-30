import type {
  CreateMachineFaultInput,
  CreateMachineInspectionInput,
  CreateMemberMachineReportInput,
  GymMachineOpsSummary,
  InspectionDashboardStats,
  InspectionTemplateItem,
  MachineFault,
  MachineInspection,
  MemberMachineReport,
  PaginatedResponse,
} from '@machinefit/shared';
import { healthScoreBand } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';
import { buildPaginationMeta } from '../utils/pagination.util.js';
import {
  computeHealthScore,
  nextInspectionDate,
  summarizeInspectionResult,
} from '../utils/inspection-health.util.js';

type JsonName = Record<string, string>;

async function assertGymManager(userId: string, gymId: string, roleCode?: string): Promise<void> {
  const pool = getPool();
  if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
  if (roleCode === 'admin') return;

  const result = await pool.query(
    `SELECT 1
     FROM gyms g
     LEFT JOIN gym_owner_permissions p
       ON p.gym_id = g.id AND p.user_id = $2 AND p.status = 'active'
     WHERE g.id = $1
       AND g.is_active = TRUE
       AND (g.owner_id = $2 OR p.id IS NOT NULL)
     LIMIT 1`,
    [gymId, userId]
  );
  if (!result.rows[0]) {
    throw new AppError(403, 'FORBIDDEN', 'Not allowed to manage this gym');
  }
}

function mapTemplate(row: {
  id: string;
  brand_id: string | null;
  machine_category: string | null;
  item_key: string;
  item_name: JsonName;
  display_order: number;
  required: boolean;
  active: boolean;
}): InspectionTemplateItem {
  return {
    id: row.id,
    brandId: row.brand_id,
    machineCategory: row.machine_category,
    itemKey: row.item_key,
    itemName: row.item_name ?? {},
    displayOrder: row.display_order,
    required: row.required,
    active: row.active,
  };
}

export const inspectionRepository = {
  async listTemplates(brandId?: string | null): Promise<InspectionTemplateItem[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query(
      `SELECT id, brand_id, machine_category, item_key, item_name, display_order, required, active
       FROM inspection_templates
       WHERE active = TRUE
         AND (brand_id IS NULL OR brand_id = $1)
       ORDER BY display_order ASC, item_key ASC`,
      [brandId ?? null]
    );
    return result.rows.map(mapTemplate);
  },

  async listGymMachinesOps(
    userId: string,
    gymId: string,
    filters: { opsStatus?: string; q?: string },
    roleCode?: string
  ): Promise<GymMachineOpsSummary[]> {
    await assertGymManager(userId, gymId, roleCode);
    const pool = getPool();
    if (!pool) return [];

    const params: unknown[] = [gymId];
    let idx = 2;
    const conditions = [`gm.gym_id = $1`, `gm.deleted_at IS NULL`];
    if (filters.opsStatus) {
      conditions.push(`gm.ops_status = $${idx++}`);
      params.push(filters.opsStatus);
    }
    if (filters.q?.trim()) {
      conditions.push(
        `(gm.nickname ILIKE $${idx} OR gm.machine_code ILIKE $${idx} OR gm.serial_number ILIKE $${idx} OR gm.location ILIKE $${idx} OR m.name->>'ko' ILIKE $${idx} OR m.name->>'en' ILIKE $${idx})`
      );
      params.push(`%${filters.q.trim()}%`);
      idx++;
    }

    const result = await pool.query(
      `SELECT gm.id, gm.gym_id, gm.machine_id, gm.machine_code, gm.nickname, gm.location,
              gm.serial_number, gm.qr_code, gm.ops_status, gm.health_score, gm.inspection_cycle,
              gm.last_inspection_at, gm.next_inspection_at, gm.is_available,
              m.code AS catalog_code, m.name AS machine_name,
              b.code AS brand_code, b.name AS brand_name
       FROM gym_machines gm
       JOIN machines m ON m.id = gm.machine_id
       LEFT JOIN brands b ON b.id = COALESCE(gm.brand_id, m.brand_id)
       WHERE ${conditions.join(' AND ')}
       ORDER BY gm.next_inspection_at NULLS LAST, gm.nickname NULLS LAST, m.code ASC`,
      params
    );

    return result.rows.map((row) => {
      const score = Number(row.health_score ?? 100);
      return {
        id: row.id,
        gymId: row.gym_id,
        machineId: row.machine_id,
        machineCode: row.machine_code ?? row.catalog_code,
        machineName:
          row.machine_name?.ko || row.machine_name?.en || row.catalog_code,
        brandCode: row.brand_code ?? undefined,
        brandName: row.brand_name?.ko || row.brand_name?.en || undefined,
        nickname: row.nickname ?? undefined,
        location: row.location ?? undefined,
        serialNumber: row.serial_number ?? undefined,
        qrCode: row.qr_code ?? undefined,
        opsStatus: row.ops_status,
        healthScore: score,
        healthBand: healthScoreBand(score),
        inspectionCycle: row.inspection_cycle,
        lastInspectionAt: row.last_inspection_at
          ? new Date(row.last_inspection_at).toISOString()
          : null,
        nextInspectionAt: row.next_inspection_at
          ? new Date(row.next_inspection_at).toISOString()
          : null,
        isAvailable: row.is_available,
      };
    });
  },

  async getGymMachineOps(
    userId: string,
    gymMachineId: string,
    roleCode?: string
  ): Promise<GymMachineOpsSummary | null> {
    const pool = getPool();
    if (!pool) return null;
    const found = await pool.query<{ gym_id: string }>(
      `SELECT gym_id FROM gym_machines WHERE id = $1 AND deleted_at IS NULL`,
      [gymMachineId]
    );
    if (!found.rows[0]) return null;
    await assertGymManager(userId, found.rows[0].gym_id, roleCode);
    const list = await this.listGymMachinesOps(
      userId,
      found.rows[0].gym_id,
      {},
      roleCode
    );
    return list.find((m) => m.id === gymMachineId) ?? null;
  },

  async getGymMachineOpsByCode(
    userId: string,
    gymId: string,
    machineCode: string,
    roleCode?: string
  ): Promise<GymMachineOpsSummary | null> {
    await assertGymManager(userId, gymId, roleCode);
    const list = await this.listGymMachinesOps(userId, gymId, { q: machineCode }, roleCode);
    const code = machineCode.trim().toLowerCase();
    return (
      list.find(
        (m) =>
          m.machineCode?.toLowerCase() === code ||
          m.qrCode?.toLowerCase() === code ||
          m.id === machineCode
      ) ?? null
    );
  },

  /** Public lookup for QR / member report (any authenticated user). */
  async findGymMachineOpsPublic(
    gymId: string,
    machineCode: string
  ): Promise<GymMachineOpsSummary | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query(
      `SELECT gm.id, gm.gym_id, gm.machine_id, gm.machine_code, gm.nickname, gm.location,
              gm.serial_number, gm.qr_code, gm.ops_status, gm.health_score, gm.inspection_cycle,
              gm.last_inspection_at, gm.next_inspection_at, gm.is_available,
              m.code AS catalog_code, m.name AS machine_name,
              b.code AS brand_code, b.name AS brand_name
       FROM gym_machines gm
       JOIN machines m ON m.id = gm.machine_id
       LEFT JOIN brands b ON b.id = COALESCE(gm.brand_id, m.brand_id)
       WHERE gm.gym_id = $1
         AND gm.deleted_at IS NULL
         AND (
           lower(gm.machine_code) = lower($2)
           OR lower(gm.qr_code) = lower($2)
           OR lower(m.code) = lower($2)
           OR gm.id::text = $2
         )
       LIMIT 1`,
      [gymId, machineCode.trim()]
    );
    const row = result.rows[0];
    if (!row) return null;
    const score = Number(row.health_score ?? 100);
    return {
      id: row.id,
      gymId: row.gym_id,
      machineId: row.machine_id,
      machineCode: row.machine_code ?? row.catalog_code,
      machineName: row.machine_name?.ko || row.machine_name?.en || row.catalog_code,
      brandCode: row.brand_code ?? undefined,
      brandName: row.brand_name?.ko || row.brand_name?.en || undefined,
      nickname: row.nickname ?? undefined,
      location: row.location ?? undefined,
      serialNumber: row.serial_number ?? undefined,
      qrCode: row.qr_code ?? undefined,
      opsStatus: row.ops_status,
      healthScore: score,
      healthBand: healthScoreBand(score),
      inspectionCycle: row.inspection_cycle,
      lastInspectionAt: row.last_inspection_at
        ? new Date(row.last_inspection_at).toISOString()
        : null,
      nextInspectionAt: row.next_inspection_at
        ? new Date(row.next_inspection_at).toISOString()
        : null,
      isAvailable: row.is_available,
    };
  },

  async createInspection(
    userId: string,
    input: CreateMachineInspectionInput,
    roleCode?: string
  ): Promise<MachineInspection> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');

    const machine = await pool.query<{
      id: string;
      gym_id: string;
      inspection_cycle: string;
      last_inspection_at: Date | null;
      brand_id: string | null;
    }>(
      `SELECT id, gym_id, inspection_cycle, last_inspection_at, brand_id
       FROM gym_machines WHERE id = $1 AND deleted_at IS NULL`,
      [input.gymMachineId]
    );
    const gm = machine.rows[0];
    if (!gm) throw new AppError(404, 'NOT_FOUND', 'Gym machine not found');
    await assertGymManager(userId, gm.gym_id, roleCode);

    const inspectionResult = summarizeInspectionResult(input.items);
    const failCount = input.items.filter((i) => i.result === 'FAIL').length;

    const faultCount = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM machine_faults
       WHERE gym_machine_id = $1 AND deleted_at IS NULL
         AND created_at > NOW() - INTERVAL '90 days'`,
      [gm.id]
    );
    const repairCount = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM machine_repairs r
       JOIN machine_faults f ON f.id = r.fault_id
       WHERE f.gym_machine_id = $1 AND r.deleted_at IS NULL
         AND r.completed_at > NOW() - INTERVAL '90 days'`,
      [gm.id]
    );
    const reportCount = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM member_machine_reports
       WHERE gym_machine_id = $1 AND deleted_at IS NULL AND status = 'OPEN'`,
      [gm.id]
    );
    const pmOverdue = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM machine_pm_schedules
       WHERE gym_machine_id = $1 AND deleted_at IS NULL
         AND status IN ('DUE', 'SCHEDULED')
         AND next_due_at < NOW()`,
      [gm.id]
    );

    const daysSince = gm.last_inspection_at
      ? Math.floor((Date.now() - new Date(gm.last_inspection_at).getTime()) / 86_400_000)
      : null;

    const healthScore = computeHealthScore({
      daysSinceLastInspection: daysSince,
      failItemCount: failCount,
      recentFaultCount: Number(faultCount.rows[0]?.count ?? 0),
      recentRepairCount: Number(repairCount.rows[0]?.count ?? 0),
      openMemberReportCount: Number(reportCount.rows[0]?.count ?? 0),
      usageOverLimit: false,
      pmOverdue: Number(pmOverdue.rows[0]?.count ?? 0) > 0,
    });

    const inspectedAt = input.inspectionDate ? new Date(input.inspectionDate) : new Date();
    const nextAt = nextInspectionDate(inspectedAt, gm.inspection_cycle || 'MONTHLY');
    const opsStatus =
      inspectionResult === 'FAIL'
        ? 'UNDER_REPAIR'
        : inspectionResult === 'WARNING'
          ? 'NEED_INSPECTION'
          : 'ACTIVE';

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query<{ id: string; created_at: Date; updated_at: Date }>(
        `INSERT INTO machine_inspections (
           gym_id, gym_machine_id, inspection_date, inspector_user_id,
           inspection_result, health_score, next_inspection_date, duration_seconds, note
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id, created_at, updated_at`,
        [
          gm.gym_id,
          gm.id,
          inspectedAt.toISOString(),
          userId,
          inspectionResult,
          healthScore,
          nextAt.toISOString(),
          input.durationSeconds ?? null,
          input.note ?? null,
        ]
      );
      const inspectionId = inserted.rows[0].id;

      for (const item of input.items) {
        await client.query(
          `INSERT INTO machine_inspection_items (
             inspection_id, template_item_id, item_key, result, score, note, photo_url, video_url
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            inspectionId,
            item.templateItemId ?? null,
            item.itemKey ?? null,
            item.result,
            item.score ?? null,
            item.note ?? null,
            item.photoUrl || null,
            item.videoUrl || null,
          ]
        );
      }

      await client.query(
        `UPDATE gym_machines SET
           health_score = $2,
           last_inspection_at = $3,
           next_inspection_at = $4,
           ops_status = $5,
           updated_at = NOW()
         WHERE id = $1`,
        [gm.id, healthScore, inspectedAt.toISOString(), nextAt.toISOString(), opsStatus]
      );

      let faultId: string | null = null;
      if (inspectionResult === 'FAIL') {
        const failNotes = input.items
          .filter((i) => i.result === 'FAIL')
          .map((i) => i.itemKey || i.note || 'FAIL')
          .join(', ');
        const fault = await client.query<{ id: string }>(
          `INSERT INTO machine_faults (
             gym_id, gym_machine_id, inspection_id, reporter_user_id,
             severity, symptom, status
           ) VALUES ($1,$2,$3,$4,'HIGH',$5,'OPEN')
           RETURNING id`,
          [gm.gym_id, gm.id, inspectionId, userId, `Inspection FAIL: ${failNotes}`]
        );
        faultId = fault.rows[0].id;
      }

      await client.query(
        `INSERT INTO inspection_audit_logs (gym_id, actor_user_id, entity_type, entity_id, action, payload)
         VALUES ($1,$2,'machine_inspection',$3,'create',$4::jsonb)`,
        [
          gm.gym_id,
          userId,
          inspectionId,
          JSON.stringify({
            result: inspectionResult,
            healthScore,
            faultId,
            itemCount: input.items.length,
          }),
        ]
      );

      await client.query('COMMIT');

      const detailed = await this.getInspection(userId, inspectionId, roleCode);
      if (!detailed) throw new AppError(500, 'CREATE_FAILED', 'Inspection create failed');
      return detailed;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async listInspections(
    userId: string,
    query: { gymId: string; gymMachineId?: string; page: number; limit: number },
    roleCode?: string
  ): Promise<PaginatedResponse<MachineInspection>> {
    await assertGymManager(userId, query.gymId, roleCode);
    const pool = getPool();
    if (!pool) {
      return { items: [], meta: buildPaginationMeta(query.page, query.limit, 0) };
    }

    const params: unknown[] = [query.gymId];
    let idx = 2;
    const conditions = [`i.gym_id = $1`, `i.deleted_at IS NULL`];
    if (query.gymMachineId) {
      conditions.push(`i.gym_machine_id = $${idx++}`);
      params.push(query.gymMachineId);
    }

    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM machine_inspections i WHERE ${conditions.join(' AND ')}`,
      params
    );
    const total = Number(count.rows[0]?.count ?? 0);
    const offset = (query.page - 1) * query.limit;

    const result = await pool.query(
      `SELECT i.*, gm.machine_code, gm.nickname, gm.location,
              m.name AS machine_name, b.name AS brand_name,
              u.display_name AS inspector_name
       FROM machine_inspections i
       JOIN gym_machines gm ON gm.id = i.gym_machine_id
       JOIN machines m ON m.id = gm.machine_id
       LEFT JOIN brands b ON b.id = COALESCE(gm.brand_id, m.brand_id)
       LEFT JOIN users u ON u.id = i.inspector_user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY i.inspection_date DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, query.limit, offset]
    );

    return {
      items: result.rows.map((row) => ({
        id: row.id,
        gymId: row.gym_id,
        gymMachineId: row.gym_machine_id,
        inspectionDate: new Date(row.inspection_date).toISOString(),
        inspectorUserId: row.inspector_user_id,
        inspectionResult: row.inspection_result,
        healthScore: Number(row.health_score),
        nextInspectionDate: row.next_inspection_date
          ? new Date(row.next_inspection_date).toISOString()
          : null,
        durationSeconds: row.duration_seconds,
        note: row.note,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
        machineCode: row.machine_code ?? undefined,
        machineName: row.machine_name?.ko || row.machine_name?.en || undefined,
        brandName: row.brand_name?.ko || row.brand_name?.en || undefined,
        nickname: row.nickname ?? undefined,
        location: row.location ?? undefined,
        inspectorName: row.inspector_name ?? undefined,
      })),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  },

  async getInspection(
    userId: string,
    inspectionId: string,
    roleCode?: string
  ): Promise<MachineInspection | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query(
      `SELECT i.*, gm.machine_code, gm.nickname, gm.location,
              m.name AS machine_name, b.name AS brand_name,
              u.display_name AS inspector_name
       FROM machine_inspections i
       JOIN gym_machines gm ON gm.id = i.gym_machine_id
       JOIN machines m ON m.id = gm.machine_id
       LEFT JOIN brands b ON b.id = COALESCE(gm.brand_id, m.brand_id)
       LEFT JOIN users u ON u.id = i.inspector_user_id
       WHERE i.id = $1 AND i.deleted_at IS NULL`,
      [inspectionId]
    );
    const row = result.rows[0];
    if (!row) return null;
    await assertGymManager(userId, row.gym_id, roleCode);

    const items = await pool.query(
      `SELECT id, inspection_id, template_item_id, item_key, result, score, note, photo_url, video_url, created_at
       FROM machine_inspection_items WHERE inspection_id = $1 ORDER BY created_at ASC`,
      [inspectionId]
    );

    return {
      id: row.id,
      gymId: row.gym_id,
      gymMachineId: row.gym_machine_id,
      inspectionDate: new Date(row.inspection_date).toISOString(),
      inspectorUserId: row.inspector_user_id,
      inspectionResult: row.inspection_result,
      healthScore: Number(row.health_score),
      nextInspectionDate: row.next_inspection_date
        ? new Date(row.next_inspection_date).toISOString()
        : null,
      durationSeconds: row.duration_seconds,
      note: row.note,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
      machineCode: row.machine_code ?? undefined,
      machineName: row.machine_name?.ko || row.machine_name?.en || undefined,
      brandName: row.brand_name?.ko || row.brand_name?.en || undefined,
      nickname: row.nickname ?? undefined,
      location: row.location ?? undefined,
      inspectorName: row.inspector_name ?? undefined,
      items: items.rows.map((item) => ({
        id: item.id,
        inspectionId: item.inspection_id,
        templateItemId: item.template_item_id,
        itemKey: item.item_key ?? undefined,
        result: item.result,
        score: item.score,
        note: item.note,
        photoUrl: item.photo_url,
        videoUrl: item.video_url,
        createdAt: new Date(item.created_at).toISOString(),
      })),
    };
  },

  async listFaults(
    userId: string,
    gymId: string,
    roleCode?: string
  ): Promise<MachineFault[]> {
    await assertGymManager(userId, gymId, roleCode);
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query(
      `SELECT f.*, gm.machine_code, gm.nickname,
              m.name AS machine_name
       FROM machine_faults f
       JOIN gym_machines gm ON gm.id = f.gym_machine_id
       JOIN machines m ON m.id = gm.machine_id
       WHERE f.gym_id = $1 AND f.deleted_at IS NULL
       ORDER BY
         CASE f.status WHEN 'DONE' THEN 1 ELSE 0 END,
         CASE f.severity
           WHEN 'CRITICAL' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'NORMAL' THEN 2 ELSE 3
         END,
         f.created_at DESC
       LIMIT 200`,
      [gymId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      gymId: row.gym_id,
      gymMachineId: row.gym_machine_id,
      inspectionId: row.inspection_id,
      reporterUserId: row.reporter_user_id,
      severity: row.severity,
      symptom: row.symptom,
      suspectedCause: row.suspected_cause,
      status: row.status,
      assigneeUserId: row.assignee_user_id,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
      machineCode: row.machine_code ?? undefined,
      machineName: row.machine_name?.ko || row.machine_name?.en || undefined,
    }));
  },

  async updateFault(
    userId: string,
    faultId: string,
    input: {
      status?: string;
      severity?: string;
      assigneeUserId?: string | null;
      suspectedCause?: string | null;
    },
    roleCode?: string
  ): Promise<MachineFault> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await pool.query<{ id: string; gym_id: string; gym_machine_id: string }>(
      `SELECT id, gym_id, gym_machine_id FROM machine_faults WHERE id = $1 AND deleted_at IS NULL`,
      [faultId]
    );
    const fault = existing.rows[0];
    if (!fault) throw new AppError(404, 'NOT_FOUND', 'Fault not found');
    await assertGymManager(userId, fault.gym_id, roleCode);

    const updated = await pool.query(
      `UPDATE machine_faults SET
         status = COALESCE($2, status),
         severity = COALESCE($3, severity),
         assignee_user_id = CASE WHEN $4::boolean THEN $5::uuid ELSE assignee_user_id END,
         suspected_cause = COALESCE($6, suspected_cause),
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        faultId,
        input.status ?? null,
        input.severity ?? null,
        input.assigneeUserId !== undefined,
        input.assigneeUserId ?? null,
        input.suspectedCause ?? null,
      ]
    );
    const row = updated.rows[0];
    if (input.status === 'DONE') {
      await pool.query(
        `UPDATE gym_machines SET ops_status = 'ACTIVE', updated_at = NOW()
         WHERE id = $1 AND ops_status = 'UNDER_REPAIR'`,
        [fault.gym_machine_id]
      );
    }
    await pool.query(
      `INSERT INTO inspection_audit_logs (gym_id, actor_user_id, entity_type, entity_id, action, payload)
       VALUES ($1,$2,'machine_fault',$3,'update',$4::jsonb)`,
      [fault.gym_id, userId, faultId, JSON.stringify(input)]
    );
    return {
      id: row.id,
      gymId: row.gym_id,
      gymMachineId: row.gym_machine_id,
      inspectionId: row.inspection_id,
      reporterUserId: row.reporter_user_id,
      severity: row.severity,
      symptom: row.symptom,
      suspectedCause: row.suspected_cause,
      status: row.status,
      assigneeUserId: row.assignee_user_id,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  },

  async createFault(
    userId: string,
    input: CreateMachineFaultInput,
    roleCode?: string
  ): Promise<MachineFault> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const machine = await pool.query<{ id: string; gym_id: string }>(
      `SELECT id, gym_id FROM gym_machines WHERE id = $1 AND deleted_at IS NULL`,
      [input.gymMachineId]
    );
    const gm = machine.rows[0];
    if (!gm) throw new AppError(404, 'NOT_FOUND', 'Gym machine not found');
    await assertGymManager(userId, gm.gym_id, roleCode);

    const inserted = await pool.query(
      `INSERT INTO machine_faults (
         gym_id, gym_machine_id, inspection_id, reporter_user_id, severity, symptom, suspected_cause, status
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,'OPEN')
       RETURNING *`,
      [
        gm.gym_id,
        gm.id,
        input.inspectionId ?? null,
        userId,
        input.severity ?? 'NORMAL',
        input.symptom,
        input.suspectedCause ?? null,
      ]
    );
    await pool.query(
      `UPDATE gym_machines SET ops_status = 'UNDER_REPAIR', updated_at = NOW() WHERE id = $1`,
      [gm.id]
    );
    const row = inserted.rows[0];
    return {
      id: row.id,
      gymId: row.gym_id,
      gymMachineId: row.gym_machine_id,
      inspectionId: row.inspection_id,
      reporterUserId: row.reporter_user_id,
      severity: row.severity,
      symptom: row.symptom,
      suspectedCause: row.suspected_cause,
      status: row.status,
      assigneeUserId: row.assignee_user_id,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  },

  async createMemberReport(
    userId: string,
    input: CreateMemberMachineReportInput
  ): Promise<MemberMachineReport> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const machine = await pool.query<{ id: string; gym_id: string }>(
      `SELECT id, gym_id FROM gym_machines WHERE id = $1 AND deleted_at IS NULL`,
      [input.gymMachineId]
    );
    const gm = machine.rows[0];
    if (!gm) throw new AppError(404, 'NOT_FOUND', 'Gym machine not found');

    const inserted = await pool.query(
      `INSERT INTO member_machine_reports (
         gym_id, gym_machine_id, member_id, report_type, description, image_url, video_url, status
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,'OPEN')
       RETURNING *`,
      [
        gm.gym_id,
        gm.id,
        userId,
        input.reportType,
        input.description ?? null,
        input.imageUrl || null,
        input.videoUrl || null,
      ]
    );

    // Auto open fault when same symptom reaches 3 open reports
    const same = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM member_machine_reports
       WHERE gym_machine_id = $1 AND report_type = $2 AND status = 'OPEN' AND deleted_at IS NULL`,
      [gm.id, input.reportType]
    );
    if (Number(same.rows[0]?.count ?? 0) >= 3) {
      await pool.query(
        `INSERT INTO machine_faults (
           gym_id, gym_machine_id, reporter_user_id, severity, symptom, status
         ) VALUES ($1,$2,$3,'HIGH',$4,'OPEN')`,
        [gm.gym_id, gm.id, userId, `Member reports ≥3: ${input.reportType}`]
      );
      await pool.query(
        `UPDATE gym_machines SET ops_status = 'NEED_INSPECTION', updated_at = NOW() WHERE id = $1`,
        [gm.id]
      );
    }

    const row = inserted.rows[0];
    return {
      id: row.id,
      gymId: row.gym_id,
      gymMachineId: row.gym_machine_id,
      memberId: row.member_id,
      reportType: row.report_type,
      description: row.description,
      imageUrl: row.image_url,
      videoUrl: row.video_url,
      status: row.status,
      createdAt: new Date(row.created_at).toISOString(),
    };
  },

  async dashboard(
    userId: string,
    gymId: string,
    roleCode?: string
  ): Promise<InspectionDashboardStats> {
    await assertGymManager(userId, gymId, roleCode);
    const pool = getPool();
    if (!pool) {
      return {
        gymId,
        totalMachines: 0,
        active: 0,
        needInspection: 0,
        underRepair: 0,
        outOfService: 0,
        avgHealthScore: 0,
        inspectionsThisMonth: 0,
        openFaults: 0,
        overdueInspections: 0,
      };
    }

    const stats = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE deleted_at IS NULL)::int AS total,
         COUNT(*) FILTER (WHERE deleted_at IS NULL AND ops_status = 'ACTIVE')::int AS active,
         COUNT(*) FILTER (WHERE deleted_at IS NULL AND ops_status = 'NEED_INSPECTION')::int AS need_inspection,
         COUNT(*) FILTER (WHERE deleted_at IS NULL AND ops_status = 'UNDER_REPAIR')::int AS under_repair,
         COUNT(*) FILTER (WHERE deleted_at IS NULL AND ops_status = 'OUT_OF_SERVICE')::int AS out_of_service,
         COALESCE(AVG(health_score) FILTER (WHERE deleted_at IS NULL), 0)::float AS avg_health,
         COUNT(*) FILTER (
           WHERE deleted_at IS NULL AND next_inspection_at IS NOT NULL AND next_inspection_at < NOW()
         )::int AS overdue
       FROM gym_machines
       WHERE gym_id = $1`,
      [gymId]
    );
    const inspections = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM machine_inspections
       WHERE gym_id = $1 AND deleted_at IS NULL
         AND inspection_date >= date_trunc('month', NOW())`,
      [gymId]
    );
    const faults = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM machine_faults
       WHERE gym_id = $1 AND deleted_at IS NULL AND status <> 'DONE'`,
      [gymId]
    );
    const row = stats.rows[0];
    return {
      gymId,
      totalMachines: Number(row.total ?? 0),
      active: Number(row.active ?? 0),
      needInspection: Number(row.need_inspection ?? 0),
      underRepair: Number(row.under_repair ?? 0),
      outOfService: Number(row.out_of_service ?? 0),
      avgHealthScore: Math.round(Number(row.avg_health ?? 0)),
      inspectionsThisMonth: Number(inspections.rows[0]?.count ?? 0),
      openFaults: Number(faults.rows[0]?.count ?? 0),
      overdueInspections: Number(row.overdue ?? 0),
    };
  },
};
