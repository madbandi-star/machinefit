import type {
  AddGymMachineInput,
  GymInventoryCapabilities,
  GymMachine,
  GymMachineRegistrantRole,
  RoleCode,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { pickLocalized } from '../utils/localize.util.js';

interface GymMachineRow {
  id: string;
  gym_id: string;
  machine_id: string;
  machine_code: string;
  machine_name: Record<string, string>;
  brand_code: string | null;
  brand_name: Record<string, string> | null;
  muscle_group: string;
  quantity: number;
  notes: string | null;
  is_available: boolean;
  instance_label: string | null;
  floor_zone: string | null;
  registered_by: string | null;
  registered_by_role: string | null;
  is_verified: boolean;
  status: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function mapGymMachine(
  row: GymMachineRow,
  locale = 'ko',
  canDelete = false
): GymMachine {
  return {
    id: row.id,
    gymId: row.gym_id,
    machineId: row.machine_id,
    machineCode: row.machine_code,
    machineName:
      pickLocalized(row.machine_name, locale as 'ko') ??
      row.machine_name?.en ??
      row.machine_code,
    brandCode: row.brand_code ?? undefined,
    brandName: row.brand_name
      ? pickLocalized(row.brand_name, locale as 'ko') ?? row.brand_name.en
      : undefined,
    muscleGroup: row.muscle_group,
    quantity: row.quantity,
    notes: row.notes ?? undefined,
    isAvailable: row.is_available,
    instanceLabel: row.instance_label ?? undefined,
    floorZone: row.floor_zone ?? undefined,
    registeredBy: row.registered_by ?? undefined,
    registeredByRole: (row.registered_by_role as GymMachineRegistrantRole) ?? undefined,
    isVerified: Boolean(row.is_verified),
    status: (row.status as GymMachine['status']) ?? 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    canDelete,
  };
}

const MACHINE_SELECT = `
  gm.id, gm.gym_id, gm.machine_id, gm.quantity, gm.notes, gm.is_available,
  gm.instance_label, gm.floor_zone, gm.registered_by, gm.registered_by_role,
  gm.is_verified, gm.status, gm.created_at, gm.updated_at, gm.deleted_at,
  m.code AS machine_code, m.name AS machine_name, m.muscle_group,
  b.code AS brand_code, b.name AS brand_name
`;

export const gymInventoryRepository = {
  async resolveGymId(idOrSlug: string): Promise<string | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<{ id: string }>(
      `SELECT id FROM gyms
       WHERE (id::text = $1 OR slug = $1)
         AND is_active = TRUE
         AND (registration_status IS NULL OR registration_status = 'approved')`,
      [idOrSlug]
    );
    return result.rows[0]?.id ?? null;
  },

  async isGymOperator(userId: string, gymId: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;

    const perm = await pool.query<{ id: string }>(
      `SELECT id FROM gym_owner_permissions
       WHERE gym_id = $1 AND user_id = $2 AND status = 'active'
       LIMIT 1`,
      [gymId, userId]
    );
    if (perm.rows[0]) return true;

    const owner = await pool.query<{ id: string }>(
      `SELECT id FROM gyms WHERE id = $1 AND owner_id = $2 LIMIT 1`,
      [gymId, userId]
    );
    return Boolean(owner.rows[0]);
  },

  async listActive(
    gymId: string,
    options: {
      locale?: string;
      brandCode?: string;
      q?: string;
      viewerUserId?: string;
      viewerRole?: RoleCode;
      isOperator?: boolean;
    } = {}
  ): Promise<GymMachine[]> {
    const pool = getPool();
    if (!pool) return [];

    const params: unknown[] = [gymId];
    let filters = '';

    if (options.brandCode) {
      params.push(options.brandCode);
      filters += ` AND b.code = $${params.length}`;
    }
    if (options.q) {
      params.push(`%${options.q}%`);
      filters += ` AND (m.name::text ILIKE $${params.length} OR m.code ILIKE $${params.length} OR b.name::text ILIKE $${params.length})`;
    }

    const result = await pool.query<GymMachineRow>(
      `SELECT ${MACHINE_SELECT}
       FROM gym_machines gm
       JOIN machines m ON m.id = gm.machine_id
       LEFT JOIN brands b ON b.id = m.brand_id
       WHERE gm.gym_id = $1 AND gm.deleted_at IS NULL${filters}
       ORDER BY gm.is_verified DESC, b.code ASC NULLS LAST, m.code ASC`,
      params
    );

    const isAdmin = options.viewerRole === 'admin';
    const isOperator = Boolean(options.isOperator);

    return result.rows.map((row) => {
      const canDelete =
        isAdmin ||
        isOperator ||
        (!row.is_verified &&
          Boolean(options.viewerUserId) &&
          row.registered_by === options.viewerUserId);
      return mapGymMachine(row, options.locale ?? 'ko', canDelete);
    });
  },

  async listAllForAdmin(gymId: string, includeDeleted = true): Promise<GymMachine[]> {
    const pool = getPool();
    if (!pool) return [];

    const result = await pool.query<GymMachineRow>(
      `SELECT ${MACHINE_SELECT}
       FROM gym_machines gm
       JOIN machines m ON m.id = gm.machine_id
       LEFT JOIN brands b ON b.id = m.brand_id
       WHERE gm.gym_id = $1
         ${includeDeleted ? '' : 'AND gm.deleted_at IS NULL'}
       ORDER BY gm.deleted_at NULLS FIRST, m.code ASC`,
      [gymId]
    );
    return result.rows.map((row) => mapGymMachine(row, 'ko', true));
  },

  async findActiveByMachine(gymId: string, machineId: string): Promise<GymMachine | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<GymMachineRow>(
      `SELECT ${MACHINE_SELECT}
       FROM gym_machines gm
       JOIN machines m ON m.id = gm.machine_id
       LEFT JOIN brands b ON b.id = m.brand_id
       WHERE gm.gym_id = $1 AND gm.machine_id = $2 AND gm.deleted_at IS NULL
       LIMIT 1`,
      [gymId, machineId]
    );
    return result.rows[0] ? mapGymMachine(result.rows[0]) : null;
  },

  async add(options: {
    gymId: string;
    machineId: string;
    input: AddGymMachineInput;
    registeredBy: string;
    registeredByRole: GymMachineRegistrantRole;
    isVerified: boolean;
  }): Promise<GymMachine> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');

    const result = await pool.query<GymMachineRow>(
      `INSERT INTO gym_machines (
         gym_id, machine_id, quantity, notes, floor_zone, is_available,
         registered_by, registered_by_role, is_verified, status
       ) VALUES ($1,$2,$3,$4,$5,TRUE,$6,$7,$8,'active')
       RETURNING id`,
      [
        options.gymId,
        options.machineId,
        options.input.quantity,
        options.input.notes ?? null,
        options.input.floorZone ?? null,
        options.registeredBy,
        options.registeredByRole,
        options.isVerified,
      ]
    );

    const created = await pool.query<GymMachineRow>(
      `SELECT ${MACHINE_SELECT}
       FROM gym_machines gm
       JOIN machines m ON m.id = gm.machine_id
       LEFT JOIN brands b ON b.id = m.brand_id
       WHERE gm.id = $1`,
      [result.rows[0].id]
    );
    return mapGymMachine(created.rows[0], 'ko', true);
  },

  async softDelete(itemId: string, deletedBy: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    const result = await pool.query(
      `UPDATE gym_machines
       SET deleted_at = NOW(), deleted_by = $2, status = 'deleted', updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL`,
      [itemId, deletedBy]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async restore(itemId: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;

    const current = await pool.query<{ gym_id: string; machine_id: string }>(
      `SELECT gym_id, machine_id FROM gym_machines WHERE id = $1`,
      [itemId]
    );
    if (!current.rows[0]) return false;

    const conflict = await pool.query<{ id: string }>(
      `SELECT id FROM gym_machines
       WHERE gym_id = $1 AND machine_id = $2 AND deleted_at IS NULL AND id <> $3
       LIMIT 1`,
      [current.rows[0].gym_id, current.rows[0].machine_id, itemId]
    );
    if (conflict.rows[0]) {
      throw new Error('ACTIVE_DUPLICATE');
    }

    const result = await pool.query(
      `UPDATE gym_machines
       SET deleted_at = NULL, deleted_by = NULL, status = 'active', updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NOT NULL`,
      [itemId]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async forceDelete(itemId: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    const result = await pool.query(`DELETE FROM gym_machines WHERE id = $1`, [itemId]);
    return (result.rowCount ?? 0) > 0;
  },

  async findById(itemId: string): Promise<GymMachine | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<GymMachineRow>(
      `SELECT ${MACHINE_SELECT}
       FROM gym_machines gm
       JOIN machines m ON m.id = gm.machine_id
       LEFT JOIN brands b ON b.id = m.brand_id
       WHERE gm.id = $1`,
      [itemId]
    );
    return result.rows[0] ? mapGymMachine(result.rows[0]) : null;
  },

  buildCapabilities(
    roleCode: RoleCode | undefined,
    isOperator: boolean
  ): GymInventoryCapabilities {
    const canAdd = Boolean(roleCode && roleCode !== 'guest');
    return {
      canAdd,
      canManageOfficial: Boolean(isOperator || roleCode === 'admin'),
      isGymOperator: isOperator,
      roleCode,
    };
  },
};
