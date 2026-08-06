import type { TargetMuscleGroup, WorkoutRecordDisplayOrder } from '@machinefit/shared';
import { getPool } from '../config/database.js';

interface OrderRow {
  gym_id: string;
  member_id: string;
  log_date: string | Date;
  machine_code: string;
  target_muscle_group: string;
  display_order: number;
}

function formatLogDate(value: string | Date): string {
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    return value.slice(0, 10);
  }
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, '0');
  const d = String(value.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function mapRow(row: OrderRow): WorkoutRecordDisplayOrder {
  return {
    gymId: row.gym_id,
    memberId: row.member_id,
    logDate: formatLogDate(row.log_date),
    machineCode: row.machine_code,
    targetMuscleGroup: row.target_muscle_group
      ? (row.target_muscle_group as TargetMuscleGroup)
      : undefined,
    displayOrder: row.display_order,
  };
}

export interface WorkoutRecordOrderWriteItem {
  machineId: string;
  targetMuscleGroup: string;
  displayOrder: number;
}

export const workoutRecordOrderRepository = {
  async listByScope(
    userId: string,
    gymId: string,
    memberId: string,
    logDate?: string
  ): Promise<WorkoutRecordDisplayOrder[]> {
    const pool = getPool();
    if (!pool) return [];

    const params: unknown[] = [userId, gymId, memberId];
    let dateFilter = '';
    if (logDate) {
      params.push(logDate);
      dateFilter = ` AND o.log_date = $${params.length}::date`;
    }

    const result = await pool.query<OrderRow>(
      `SELECT o.gym_id, o.member_id, o.log_date, m.code AS machine_code,
              o.target_muscle_group, o.display_order
       FROM workout_record_display_orders o
       JOIN machines m ON m.id = o.machine_id
       WHERE o.user_id = $1 AND o.gym_id = $2 AND o.member_id = $3${dateFilter}
       ORDER BY o.log_date DESC, o.display_order ASC`,
      params
    );

    return result.rows.map(mapRow);
  },

  /**
   * Upsert only items whose display_order differs from the stored value (or are new).
   * Entire operation runs in one transaction.
   */
  async upsertChangedOrders(
    userId: string,
    gymId: string,
    memberId: string,
    logDate: string,
    items: WorkoutRecordOrderWriteItem[]
  ): Promise<number> {
    const pool = getPool();
    if (!pool) return 0;
    if (items.length === 0) return 0;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existing = await client.query<{
        machine_id: string;
        target_muscle_group: string;
        display_order: number;
      }>(
        `SELECT machine_id, target_muscle_group, display_order
         FROM workout_record_display_orders
         WHERE user_id = $1 AND gym_id = $2 AND member_id = $3 AND log_date = $4::date
         FOR UPDATE`,
        [userId, gymId, memberId, logDate]
      );

      const current = new Map(
        existing.rows.map((row) => [
          `${row.machine_id}|${row.target_muscle_group}`,
          row.display_order,
        ])
      );

      const changed = items.filter((item) => {
        const key = `${item.machineId}|${item.targetMuscleGroup}`;
        return current.get(key) !== item.displayOrder;
      });

      if (changed.length === 0) {
        await client.query('COMMIT');
        return 0;
      }

      const machineIds = changed.map((item) => item.machineId);
      const muscles = changed.map((item) => item.targetMuscleGroup);
      const orders = changed.map((item) => item.displayOrder);

      await client.query(
        `INSERT INTO workout_record_display_orders (
           user_id, gym_id, member_id, log_date, machine_id, target_muscle_group, display_order
         )
         SELECT $1, $2, $3, $4::date, t.machine_id, t.target_muscle_group, t.display_order
         FROM UNNEST($5::uuid[], $6::text[], $7::int[]) AS t(machine_id, target_muscle_group, display_order)
         ON CONFLICT (user_id, gym_id, member_id, log_date, machine_id, target_muscle_group)
         DO UPDATE SET
           display_order = EXCLUDED.display_order,
           updated_at = NOW()
         WHERE workout_record_display_orders.display_order IS DISTINCT FROM EXCLUDED.display_order`,
        [userId, gymId, memberId, logDate, machineIds, muscles, orders]
      );

      await client.query('COMMIT');
      return changed.length;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  },

  async removeForCard(
    userId: string,
    gymId: string,
    memberId: string,
    logDate: string,
    machineId: string,
    targetMuscleGroup = ''
  ): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `DELETE FROM workout_record_display_orders
       WHERE user_id = $1 AND gym_id = $2 AND member_id = $3
         AND log_date = $4::date AND machine_id = $5 AND target_muscle_group = $6`,
      [userId, gymId, memberId, logDate, machineId, targetMuscleGroup]
    );
  },
};
