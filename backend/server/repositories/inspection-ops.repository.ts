import type {
  CreateMachinePartInput,
  CreateMachinePmScheduleInput,
  CreateMachineRepairInput,
  GymMachinePhoto,
  GymMachinePhotoType,
  InspectionDashboardStats,
  InspectionTemplateItem,
  MachinePart,
  MachinePmSchedule,
  MachineRepair,
  PmCycleType,
  UpdateMachinePartInput,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';
import { nextInspectionDate } from '../utils/inspection-health.util.js';

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

export async function listGymManagerUserIds(gymId: string): Promise<string[]> {
  const pool = getPool();
  if (!pool) return [];
  const result = await pool.query<{ user_id: string }>(
    `SELECT g.owner_id AS user_id
     FROM gyms g WHERE g.id = $1 AND g.owner_id IS NOT NULL
     UNION
     SELECT p.user_id
     FROM gym_owner_permissions p
     WHERE p.gym_id = $1 AND p.status = 'active'`,
    [gymId]
  );
  return [...new Set(result.rows.map((r) => r.user_id).filter(Boolean))];
}

function mapPm(row: Record<string, unknown>): MachinePmSchedule {
  return {
    id: String(row.id),
    gymId: String(row.gym_id),
    gymMachineId: String(row.gym_machine_id),
    cycleType: row.cycle_type as PmCycleType,
    usageLimitCount: row.usage_limit_count == null ? null : Number(row.usage_limit_count),
    usageLimitVolume: row.usage_limit_volume == null ? null : Number(row.usage_limit_volume),
    lastCompletedAt: row.last_completed_at
      ? new Date(String(row.last_completed_at)).toISOString()
      : null,
    nextDueAt: row.next_due_at ? new Date(String(row.next_due_at)).toISOString() : null,
    status: row.status as MachinePmSchedule['status'],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: row.updated_at ? new Date(String(row.updated_at)).toISOString() : undefined,
    machineName:
      (row.machine_name as JsonName | undefined)?.ko ||
      (row.machine_name as JsonName | undefined)?.en ||
      undefined,
    machineCode: (row.machine_code as string | null) ?? undefined,
    nickname: (row.nickname as string | null) ?? undefined,
  };
}

function computePmNextDue(from: Date, cycleType: string): Date | null {
  if (cycleType === 'USAGE_COUNT' || cycleType === 'USAGE_VOLUME') return null;
  return nextInspectionDate(from, cycleType === 'CUSTOM' ? 'MONTHLY' : cycleType);
}

export const inspectionOpsRepository = {
  async listPm(
    userId: string,
    gymId: string,
    roleCode?: string
  ): Promise<MachinePmSchedule[]> {
    await assertGymManager(userId, gymId, roleCode);
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query(
      `SELECT pm.*, gm.machine_code, gm.nickname, m.name AS machine_name
       FROM machine_pm_schedules pm
       JOIN gym_machines gm ON gm.id = pm.gym_machine_id
       JOIN machines m ON m.id = gm.machine_id
       WHERE pm.gym_id = $1 AND pm.deleted_at IS NULL
       ORDER BY
         CASE pm.status WHEN 'DUE' THEN 0 WHEN 'SCHEDULED' THEN 1 ELSE 2 END,
         pm.next_due_at NULLS LAST,
         pm.created_at DESC`,
      [gymId]
    );
    return result.rows.map(mapPm);
  },

  async createPm(
    userId: string,
    input: CreateMachinePmScheduleInput,
    roleCode?: string
  ): Promise<MachinePmSchedule> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const machine = await pool.query<{ id: string; gym_id: string }>(
      `SELECT id, gym_id FROM gym_machines WHERE id = $1 AND deleted_at IS NULL`,
      [input.gymMachineId]
    );
    const gm = machine.rows[0];
    if (!gm) throw new AppError(404, 'NOT_FOUND', 'Gym machine not found');
    await assertGymManager(userId, gm.gym_id, roleCode);

    const nextDue =
      input.nextDueAt != null
        ? new Date(input.nextDueAt)
        : computePmNextDue(new Date(), input.cycleType);

    const inserted = await pool.query(
      `INSERT INTO machine_pm_schedules (
         gym_id, gym_machine_id, cycle_type, usage_limit_count, usage_limit_volume,
         next_due_at, status
       ) VALUES ($1,$2,$3,$4,$5,$6,'SCHEDULED')
       RETURNING *`,
      [
        gm.gym_id,
        gm.id,
        input.cycleType,
        input.usageLimitCount ?? null,
        input.usageLimitVolume ?? null,
        nextDue?.toISOString() ?? null,
      ]
    );
    await pool.query(
      `INSERT INTO inspection_audit_logs (gym_id, actor_user_id, entity_type, entity_id, action, payload)
       VALUES ($1,$2,'machine_pm',$3,'create',$4::jsonb)`,
      [gm.gym_id, userId, inserted.rows[0].id, JSON.stringify({ cycleType: input.cycleType })]
    );
    return mapPm(inserted.rows[0]);
  },

  async updatePm(
    userId: string,
    id: string,
    input: {
      cycleType?: PmCycleType;
      usageLimitCount?: number | null;
      usageLimitVolume?: number | null;
      nextDueAt?: string | null;
      status?: MachinePmSchedule['status'];
      markCompleted?: boolean;
    },
    roleCode?: string
  ): Promise<MachinePmSchedule> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await pool.query(
      `SELECT * FROM machine_pm_schedules WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    const row = existing.rows[0];
    if (!row) throw new AppError(404, 'NOT_FOUND', 'PM schedule not found');
    await assertGymManager(userId, row.gym_id, roleCode);

    let nextDueAt = input.nextDueAt === undefined ? row.next_due_at : input.nextDueAt;
    let lastCompleted = row.last_completed_at;
    let status = input.status ?? row.status;
    const cycleType = input.cycleType ?? row.cycle_type;

    if (input.markCompleted) {
      lastCompleted = new Date();
      status = 'SCHEDULED';
      nextDueAt = computePmNextDue(lastCompleted, cycleType)?.toISOString() ?? null;
    }

    const updated = await pool.query(
      `UPDATE machine_pm_schedules SET
         cycle_type = $2,
         usage_limit_count = COALESCE($3, usage_limit_count),
         usage_limit_volume = COALESCE($4, usage_limit_volume),
         next_due_at = $5,
         last_completed_at = $6,
         status = $7,
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        cycleType,
        input.usageLimitCount === undefined ? null : input.usageLimitCount,
        input.usageLimitVolume === undefined ? null : input.usageLimitVolume,
        nextDueAt,
        lastCompleted,
        status,
      ]
    );
    return mapPm(updated.rows[0]);
  },

  async deletePm(userId: string, id: string, roleCode?: string): Promise<void> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await pool.query<{ gym_id: string }>(
      `SELECT gym_id FROM machine_pm_schedules WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    if (!existing.rows[0]) throw new AppError(404, 'NOT_FOUND', 'PM schedule not found');
    await assertGymManager(userId, existing.rows[0].gym_id, roleCode);
    await pool.query(
      `UPDATE machine_pm_schedules SET deleted_at = NOW(), status = 'SKIPPED' WHERE id = $1`,
      [id]
    );
  },

  /** Mark overdue PM as DUE; returns newly due rows for notifications. */
  async refreshPmDue(userId: string, gymId: string, roleCode?: string): Promise<MachinePmSchedule[]> {
    await assertGymManager(userId, gymId, roleCode);
    const pool = getPool();
    if (!pool) return [];

    // Usage-based: mark DUE when workout count/volume vs gym_machine catalog usage exceeds limit
    await pool.query(
      `UPDATE machine_pm_schedules pm
       SET status = 'DUE', updated_at = NOW()
       FROM gym_machines gm
       WHERE pm.gym_machine_id = gm.id
         AND pm.gym_id = $1
         AND pm.deleted_at IS NULL
         AND pm.status = 'SCHEDULED'
         AND pm.cycle_type = 'USAGE_COUNT'
         AND pm.usage_limit_count IS NOT NULL
         AND (
           SELECT COUNT(*)::int FROM workout_logs wl
           WHERE wl.gym_id = gm.gym_id AND wl.machine_id = gm.machine_id
             AND (pm.last_completed_at IS NULL OR wl.log_date >= pm.last_completed_at::date)
         ) >= pm.usage_limit_count`,
      [gymId]
    );
    await pool.query(
      `UPDATE machine_pm_schedules pm
       SET status = 'DUE', updated_at = NOW()
       FROM gym_machines gm
       WHERE pm.gym_machine_id = gm.id
         AND pm.gym_id = $1
         AND pm.deleted_at IS NULL
         AND pm.status = 'SCHEDULED'
         AND pm.cycle_type = 'USAGE_VOLUME'
         AND pm.usage_limit_volume IS NOT NULL
         AND (
           SELECT COALESCE(SUM(sub.vol), 0) FROM (
             SELECT COALESCE((
               SELECT SUM((elem)::numeric)
               FROM jsonb_array_elements_text(wl.set_weights_kg) AS elem
             ), 0) AS vol
             FROM workout_logs wl
             WHERE wl.gym_id = gm.gym_id AND wl.machine_id = gm.machine_id
               AND (pm.last_completed_at IS NULL OR wl.log_date >= pm.last_completed_at::date)
           ) sub
         ) >= pm.usage_limit_volume`,
      [gymId]
    );

    const due = await pool.query(
      `UPDATE machine_pm_schedules
       SET status = 'DUE', updated_at = NOW()
       WHERE gym_id = $1
         AND deleted_at IS NULL
         AND status = 'SCHEDULED'
         AND next_due_at IS NOT NULL
         AND next_due_at <= NOW()
       RETURNING *`,
      [gymId]
    );

    // Also surface already-DUE for caller convenience
    const allDue = await pool.query(
      `SELECT pm.*, gm.machine_code, gm.nickname, m.name AS machine_name
       FROM machine_pm_schedules pm
       JOIN gym_machines gm ON gm.id = pm.gym_machine_id
       JOIN machines m ON m.id = gm.machine_id
       WHERE pm.gym_id = $1 AND pm.deleted_at IS NULL AND pm.status = 'DUE'`,
      [gymId]
    );

    void due;
    return allDue.rows.map(mapPm);
  },

  async listRepairs(userId: string, gymId: string, roleCode?: string): Promise<MachineRepair[]> {
    await assertGymManager(userId, gymId, roleCode);
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query(
      `SELECT r.*, f.symptom, m.name AS machine_name
       FROM machine_repairs r
       JOIN machine_faults f ON f.id = r.fault_id
       JOIN gym_machines gm ON gm.id = f.gym_machine_id
       JOIN machines m ON m.id = gm.machine_id
       WHERE r.gym_id = $1 AND r.deleted_at IS NULL
       ORDER BY COALESCE(r.completed_at, r.created_at) DESC
       LIMIT 200`,
      [gymId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      faultId: row.fault_id,
      gymId: row.gym_id,
      repairCompany: row.repair_company,
      engineer: row.engineer,
      laborCost: Number(row.labor_cost ?? 0),
      partsCost: Number(row.parts_cost ?? 0),
      totalCost: Number(row.total_cost ?? 0),
      repairNote: row.repair_note,
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
      createdAt: new Date(row.created_at).toISOString(),
      machineName: row.machine_name?.ko || row.machine_name?.en || undefined,
      symptom: row.symptom ?? undefined,
    }));
  },

  async createRepair(
    userId: string,
    input: CreateMachineRepairInput,
    roleCode?: string
  ): Promise<MachineRepair> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const fault = await pool.query<{ id: string; gym_id: string; gym_machine_id: string; symptom: string }>(
      `SELECT id, gym_id, gym_machine_id, symptom FROM machine_faults WHERE id = $1 AND deleted_at IS NULL`,
      [input.faultId]
    );
    const f = fault.rows[0];
    if (!f) throw new AppError(404, 'NOT_FOUND', 'Fault not found');
    await assertGymManager(userId, f.gym_id, roleCode);

    const labor = input.laborCost ?? 0;
    const parts = input.partsCost ?? 0;
    const completedAt = input.completedAt ? new Date(input.completedAt) : new Date();

    const inserted = await pool.query(
      `INSERT INTO machine_repairs (
         fault_id, gym_id, repair_company, engineer, labor_cost, parts_cost, total_cost, repair_note, completed_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        f.id,
        f.gym_id,
        input.repairCompany ?? null,
        input.engineer ?? null,
        labor,
        parts,
        labor + parts,
        input.repairNote ?? null,
        completedAt.toISOString(),
      ]
    );
    await pool.query(
      `UPDATE machine_faults SET status = 'DONE', updated_at = NOW() WHERE id = $1`,
      [f.id]
    );
    await pool.query(
      `UPDATE gym_machines SET ops_status = 'ACTIVE', updated_at = NOW()
       WHERE id = $1 AND ops_status = 'UNDER_REPAIR'`,
      [f.gym_machine_id]
    );
    await pool.query(
      `INSERT INTO inspection_audit_logs (gym_id, actor_user_id, entity_type, entity_id, action, payload)
       VALUES ($1,$2,'machine_repair',$3,'create',$4::jsonb)`,
      [f.gym_id, userId, inserted.rows[0].id, JSON.stringify({ faultId: f.id, total: labor + parts })]
    );
    const row = inserted.rows[0];
    return {
      id: row.id,
      faultId: row.fault_id,
      gymId: row.gym_id,
      repairCompany: row.repair_company,
      engineer: row.engineer,
      laborCost: Number(row.labor_cost),
      partsCost: Number(row.parts_cost),
      totalCost: Number(row.total_cost),
      repairNote: row.repair_note,
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
      createdAt: new Date(row.created_at).toISOString(),
      symptom: f.symptom,
    };
  },

  async listParts(userId: string, gymId: string, roleCode?: string): Promise<MachinePart[]> {
    await assertGymManager(userId, gymId, roleCode);
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query(
      `SELECT p.*, gm.machine_code, m.name AS machine_name
       FROM machine_parts p
       JOIN gym_machines gm ON gm.id = p.gym_machine_id
       JOIN machines m ON m.id = gm.machine_id
       WHERE p.gym_id = $1 AND p.deleted_at IS NULL
       ORDER BY p.next_replace_date NULLS LAST, p.part_name ASC`,
      [gymId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      gymId: row.gym_id,
      gymMachineId: row.gym_machine_id,
      partName: row.part_name,
      replacementCycleDays: row.replacement_cycle_days,
      replacementCycleUsage: row.replacement_cycle_usage,
      lastReplacedAt: row.last_replaced_at
        ? new Date(row.last_replaced_at).toISOString()
        : null,
      nextReplaceDate: row.next_replace_date
        ? new Date(row.next_replace_date).toISOString().slice(0, 10)
        : null,
      stockQuantity: Number(row.stock_quantity ?? 0),
      createdAt: new Date(row.created_at).toISOString(),
      machineName: row.machine_name?.ko || row.machine_name?.en || undefined,
      machineCode: row.machine_code ?? undefined,
    }));
  },

  async createPart(
    userId: string,
    input: CreateMachinePartInput,
    roleCode?: string
  ): Promise<MachinePart> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const machine = await pool.query<{ id: string; gym_id: string }>(
      `SELECT id, gym_id FROM gym_machines WHERE id = $1 AND deleted_at IS NULL`,
      [input.gymMachineId]
    );
    const gm = machine.rows[0];
    if (!gm) throw new AppError(404, 'NOT_FOUND', 'Gym machine not found');
    await assertGymManager(userId, gm.gym_id, roleCode);

    let nextReplace = input.nextReplaceDate ?? null;
    if (!nextReplace && input.replacementCycleDays && input.lastReplacedAt) {
      const d = new Date(input.lastReplacedAt);
      d.setDate(d.getDate() + input.replacementCycleDays);
      nextReplace = d.toISOString().slice(0, 10);
    } else if (!nextReplace && input.replacementCycleDays) {
      const d = new Date();
      d.setDate(d.getDate() + input.replacementCycleDays);
      nextReplace = d.toISOString().slice(0, 10);
    }

    const inserted = await pool.query(
      `INSERT INTO machine_parts (
         gym_id, gym_machine_id, part_name, replacement_cycle_days, replacement_cycle_usage,
         last_replaced_at, next_replace_date, stock_quantity
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        gm.gym_id,
        gm.id,
        input.partName,
        input.replacementCycleDays ?? null,
        input.replacementCycleUsage ?? null,
        input.lastReplacedAt ?? null,
        nextReplace,
        input.stockQuantity ?? 0,
      ]
    );
    const row = inserted.rows[0];
    return {
      id: row.id,
      gymId: row.gym_id,
      gymMachineId: row.gym_machine_id,
      partName: row.part_name,
      replacementCycleDays: row.replacement_cycle_days,
      replacementCycleUsage: row.replacement_cycle_usage,
      lastReplacedAt: row.last_replaced_at
        ? new Date(row.last_replaced_at).toISOString()
        : null,
      nextReplaceDate: row.next_replace_date
        ? new Date(row.next_replace_date).toISOString().slice(0, 10)
        : null,
      stockQuantity: Number(row.stock_quantity ?? 0),
      createdAt: new Date(row.created_at).toISOString(),
    };
  },

  async updatePart(
    userId: string,
    id: string,
    input: UpdateMachinePartInput,
    roleCode?: string
  ): Promise<MachinePart> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await pool.query(
      `SELECT * FROM machine_parts WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    const row0 = existing.rows[0];
    if (!row0) throw new AppError(404, 'NOT_FOUND', 'Part not found');
    await assertGymManager(userId, row0.gym_id, roleCode);

    const updated = await pool.query(
      `UPDATE machine_parts SET
         part_name = COALESCE($2, part_name),
         replacement_cycle_days = CASE WHEN $3::boolean THEN $4 ELSE replacement_cycle_days END,
         replacement_cycle_usage = CASE WHEN $5::boolean THEN $6 ELSE replacement_cycle_usage END,
         last_replaced_at = CASE WHEN $7::boolean THEN $8::timestamptz ELSE last_replaced_at END,
         next_replace_date = CASE WHEN $9::boolean THEN $10::date ELSE next_replace_date END,
         stock_quantity = COALESCE($11, stock_quantity),
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        input.partName ?? null,
        input.replacementCycleDays !== undefined,
        input.replacementCycleDays ?? null,
        input.replacementCycleUsage !== undefined,
        input.replacementCycleUsage ?? null,
        input.lastReplacedAt !== undefined,
        input.lastReplacedAt ?? null,
        input.nextReplaceDate !== undefined,
        input.nextReplaceDate ?? null,
        input.stockQuantity ?? null,
      ]
    );
    const row = updated.rows[0];
    return {
      id: row.id,
      gymId: row.gym_id,
      gymMachineId: row.gym_machine_id,
      partName: row.part_name,
      replacementCycleDays: row.replacement_cycle_days,
      replacementCycleUsage: row.replacement_cycle_usage,
      lastReplacedAt: row.last_replaced_at
        ? new Date(row.last_replaced_at).toISOString()
        : null,
      nextReplaceDate: row.next_replace_date
        ? new Date(row.next_replace_date).toISOString().slice(0, 10)
        : null,
      stockQuantity: Number(row.stock_quantity ?? 0),
      createdAt: new Date(row.created_at).toISOString(),
    };
  },

  async deletePart(userId: string, id: string, roleCode?: string): Promise<void> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await pool.query<{ gym_id: string }>(
      `SELECT gym_id FROM machine_parts WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    if (!existing.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Part not found');
    await assertGymManager(userId, existing.rows[0].gym_id, roleCode);
    await pool.query(`UPDATE machine_parts SET deleted_at = NOW() WHERE id = $1`, [id]);
  },

  async addPhoto(
    userId: string,
    gymMachineId: string,
    imageType: GymMachinePhotoType,
    imageUrl: string,
    roleCode?: string
  ): Promise<GymMachinePhoto> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const machine = await pool.query<{ id: string; gym_id: string }>(
      `SELECT id, gym_id FROM gym_machines WHERE id = $1 AND deleted_at IS NULL`,
      [gymMachineId]
    );
    const gm = machine.rows[0];
    if (!gm) throw new AppError(404, 'NOT_FOUND', 'Gym machine not found');
    await assertGymManager(userId, gm.gym_id, roleCode);

    const inserted = await pool.query(
      `INSERT INTO gym_machine_photos (gym_machine_id, image_type, image_url, uploaded_by)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [gm.id, imageType, imageUrl, userId]
    );
    const row = inserted.rows[0];
    return {
      id: row.id,
      gymMachineId: row.gym_machine_id,
      imageType: row.image_type,
      imageUrl: row.image_url,
      uploadedBy: row.uploaded_by,
      createdAt: new Date(row.created_at).toISOString(),
    };
  },

  async listPhotos(
    userId: string,
    gymMachineId: string,
    roleCode?: string
  ): Promise<GymMachinePhoto[]> {
    const pool = getPool();
    if (!pool) return [];
    const machine = await pool.query<{ gym_id: string }>(
      `SELECT gym_id FROM gym_machines WHERE id = $1 AND deleted_at IS NULL`,
      [gymMachineId]
    );
    if (!machine.rows[0]) return [];
    await assertGymManager(userId, machine.rows[0].gym_id, roleCode);
    const result = await pool.query(
      `SELECT * FROM gym_machine_photos
       WHERE gym_machine_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [gymMachineId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      gymMachineId: row.gym_machine_id,
      imageType: row.image_type,
      imageUrl: row.image_url,
      uploadedBy: row.uploaded_by,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  },

  async createTemplate(
    userId: string,
    input: {
      brandId?: string | null;
      machineCategory?: string | null;
      itemKey: string;
      itemName: Record<string, string>;
      displayOrder?: number;
      required?: boolean;
    },
    roleCode?: string
  ): Promise<InspectionTemplateItem> {
    if (roleCode !== 'admin' && roleCode !== 'owner') {
      throw new AppError(403, 'FORBIDDEN', 'Only owner/admin can manage templates');
    }
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const inserted = await pool.query(
      `INSERT INTO inspection_templates (
         brand_id, machine_category, item_key, item_name, display_order, required, active
       ) VALUES ($1,$2,$3,$4::jsonb,$5,$6,TRUE)
       RETURNING *`,
      [
        input.brandId ?? null,
        input.machineCategory ?? null,
        input.itemKey,
        JSON.stringify(input.itemName ?? {}),
        input.displayOrder ?? 0,
        input.required ?? true,
      ]
    );
    void userId;
    const row = inserted.rows[0];
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
  },

  async updateTemplate(
    userId: string,
    id: string,
    input: {
      itemName?: Record<string, string>;
      displayOrder?: number;
      required?: boolean;
      active?: boolean;
      machineCategory?: string | null;
    },
    roleCode?: string
  ): Promise<InspectionTemplateItem> {
    if (roleCode !== 'admin' && roleCode !== 'owner') {
      throw new AppError(403, 'FORBIDDEN', 'Only owner/admin can manage templates');
    }
    void userId;
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const updated = await pool.query(
      `UPDATE inspection_templates SET
         item_name = COALESCE($2::jsonb, item_name),
         display_order = COALESCE($3, display_order),
         required = COALESCE($4, required),
         active = COALESCE($5, active),
         machine_category = CASE WHEN $6::boolean THEN $7 ELSE machine_category END,
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        input.itemName ? JSON.stringify(input.itemName) : null,
        input.displayOrder ?? null,
        input.required ?? null,
        input.active ?? null,
        input.machineCategory !== undefined,
        input.machineCategory ?? null,
      ]
    );
    const row = updated.rows[0];
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Template not found');
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
  },

  async extendedStatistics(
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

    const base = await pool.query(
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
       FROM gym_machines WHERE gym_id = $1`,
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

    const brandFaults = await pool.query(
      `SELECT b.code AS brand_code,
              COALESCE(b.name->>'ko', b.name->>'en', b.code, 'Unknown') AS brand_name,
              COUNT(DISTINCT gm.id)::int AS machine_count,
              COUNT(f.id)::int AS fault_count
       FROM gym_machines gm
       JOIN machines m ON m.id = gm.machine_id
       LEFT JOIN brands b ON b.id = COALESCE(gm.brand_id, m.brand_id)
       LEFT JOIN machine_faults f
         ON f.gym_machine_id = gm.id AND f.deleted_at IS NULL
       WHERE gm.gym_id = $1 AND gm.deleted_at IS NULL
       GROUP BY b.code, brand_name
       ORDER BY fault_count DESC`,
      [gymId]
    );

    const topFaulted = await pool.query(
      `SELECT gm.id, gm.machine_code,
              COALESCE(m.name->>'ko', m.name->>'en', gm.machine_code) AS machine_name,
              COUNT(f.id)::int AS fault_count
       FROM machine_faults f
       JOIN gym_machines gm ON gm.id = f.gym_machine_id
       JOIN machines m ON m.id = gm.machine_id
       WHERE f.gym_id = $1 AND f.deleted_at IS NULL AND gm.deleted_at IS NULL
       GROUP BY gm.id, gm.machine_code, machine_name
       ORDER BY fault_count DESC
       LIMIT 10`,
      [gymId]
    );

    const topUsed = await pool.query(
      `SELECT gm.id, gm.machine_code,
              COALESCE(m.name->>'ko', m.name->>'en', gm.machine_code) AS machine_name,
              COUNT(wl.id)::int AS usage_count,
              COALESCE(SUM(vol.kg), 0)::float AS total_volume
       FROM gym_machines gm
       JOIN machines m ON m.id = gm.machine_id
       LEFT JOIN workout_logs wl
         ON wl.gym_id = gm.gym_id AND wl.machine_id = gm.machine_id
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM((elem)::numeric), 0) AS kg
         FROM jsonb_array_elements_text(COALESCE(wl.set_weights_kg, '[]'::jsonb)) AS elem
       ) vol ON TRUE
       WHERE gm.gym_id = $1 AND gm.deleted_at IS NULL
       GROUP BY gm.id, gm.machine_code, machine_name
       ORDER BY usage_count DESC
       LIMIT 10`,
      [gymId]
    );

    const monthly = await pool.query(
      `WITH months AS (
         SELECT date_trunc('month', NOW()) - (n || ' months')::interval AS month_start
         FROM generate_series(0, 5) AS n
       ),
       totals AS (
         SELECT COUNT(*)::int AS total_machines
         FROM gym_machines WHERE gym_id = $1 AND deleted_at IS NULL
       )
       SELECT to_char(m.month_start, 'YYYY-MM') AS month,
              t.total_machines,
              COUNT(DISTINCT i.gym_machine_id)::int AS inspected
       FROM months m
       CROSS JOIN totals t
       LEFT JOIN machine_inspections i
         ON i.gym_id = $1
        AND i.deleted_at IS NULL
        AND date_trunc('month', i.inspection_date) = m.month_start
       GROUP BY m.month_start, t.total_machines
       ORDER BY m.month_start ASC`,
      [gymId]
    );

    const pmRate = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'DONE' OR last_completed_at IS NOT NULL)::float AS done_like,
         COUNT(*)::float AS total
       FROM machine_pm_schedules
       WHERE gym_id = $1 AND deleted_at IS NULL`,
      [gymId]
    );

    const avgRepair = await pool.query<{ avg: string | null }>(
      `SELECT AVG(total_cost)::text AS avg FROM machine_repairs
       WHERE gym_id = $1 AND deleted_at IS NULL`,
      [gymId]
    );

    const partsHistory = await pool.query(
      `SELECT p.id, p.gym_machine_id, p.part_name, p.last_replaced_at, p.next_replace_date,
              COALESCE(m.name->>'ko', m.name->>'en', gm.machine_code) AS machine_name
       FROM machine_parts p
       JOIN gym_machines gm ON gm.id = p.gym_machine_id
       JOIN machines m ON m.id = gm.machine_id
       WHERE p.gym_id = $1 AND p.deleted_at IS NULL
         AND p.last_replaced_at IS NOT NULL
       ORDER BY p.last_replaced_at DESC
       LIMIT 20`,
      [gymId]
    );

    const row = base.rows[0];
    const pmTotal = Number(pmRate.rows[0]?.total ?? 0);
    const pmDone = Number(pmRate.rows[0]?.done_like ?? 0);

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
      brandFaultRates: brandFaults.rows.map((r) => ({
        brandCode: r.brand_code ?? undefined,
        brandName: r.brand_name,
        faultCount: Number(r.fault_count),
        machineCount: Number(r.machine_count),
        faultRate:
          Number(r.machine_count) > 0
            ? Math.round((Number(r.fault_count) / Number(r.machine_count)) * 100)
            : 0,
      })),
      topFaultedMachines: topFaulted.rows.map((r) => ({
        gymMachineId: r.id,
        machineName: r.machine_name,
        machineCode: r.machine_code ?? undefined,
        faultCount: Number(r.fault_count),
      })),
      topUsedMachines: topUsed.rows.map((r) => ({
        gymMachineId: r.id,
        machineName: r.machine_name,
        machineCode: r.machine_code ?? undefined,
        usageCount: Number(r.usage_count),
        totalVolume: Math.round(Number(r.total_volume)),
      })),
      monthlyInspectionRates: monthly.rows.map((r) => ({
        month: r.month,
        inspectedMachines: Number(r.inspected),
        totalMachines: Number(r.total_machines),
        rate:
          Number(r.total_machines) > 0
            ? Math.round((Number(r.inspected) / Number(r.total_machines)) * 100)
            : 0,
      })),
      pmCompletionRate: pmTotal > 0 ? Math.round((pmDone / pmTotal) * 100) : 0,
      avgRepairCost: Math.round(Number(avgRepair.rows[0]?.avg ?? 0)),
      partsReplacementHistory: partsHistory.rows.map((r) => ({
        id: r.id,
        gymMachineId: r.gym_machine_id,
        machineName: r.machine_name,
        partName: r.part_name,
        lastReplacedAt: r.last_replaced_at
          ? new Date(r.last_replaced_at).toISOString()
          : null,
        nextReplaceDate: r.next_replace_date
          ? new Date(r.next_replace_date).toISOString().slice(0, 10)
          : null,
      })),
    };
  },

  async findGymMachineByQr(qrCode: string): Promise<{
    gymMachineId: string;
    gymId: string;
    machineCode: string;
    machineId: string;
    nickname?: string;
  } | null> {
    const pool = getPool();
    if (!pool) return null;
    const code = qrCode.trim();
    const result = await pool.query(
      `SELECT gm.id, gm.gym_id, gm.machine_id, gm.nickname,
              COALESCE(gm.machine_code, m.code) AS machine_code
       FROM gym_machines gm
       JOIN machines m ON m.id = gm.machine_id
       WHERE gm.deleted_at IS NULL
         AND (
           lower(gm.qr_code) = lower($1)
           OR lower(gm.machine_code) = lower($1)
           OR gm.id::text = $1
           OR lower('GM-' || gm.id::text) = lower($1)
         )
       LIMIT 1`,
      [code]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      gymMachineId: row.id,
      gymId: row.gym_id,
      machineCode: row.machine_code,
      machineId: row.machine_id,
      nickname: row.nickname ?? undefined,
    };
  },
};
