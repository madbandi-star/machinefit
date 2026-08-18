import { calculateMachineRarity, type MachineRarityGrade } from '@machinefit/shared';
import { getPool } from '../config/database.js';

export interface RarityCounts {
  gymHoldingCount: number;
  totalGyms: number;
  userGymHoldingCount: number;
  postCount: number;
  discoveryCount: number;
  adminWeight: number;
  uniqueFlag: boolean;
  gradeOverride: MachineRarityGrade | null;
}

const VISIBLE_POST = `deleted_at IS NULL AND is_hidden = FALSE AND status = 'published'`;

export const machineRarityService = {
  async loadCounts(machineId: string): Promise<RarityCounts | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<{
      gym_holding_count: string;
      total_gyms: string;
      user_gym_holding_count: string;
      post_count: string;
      discovery_count: string;
      admin_weight: number | null;
      unique_flag: boolean | null;
      grade_override: MachineRarityGrade | null;
    }>(
      `SELECT
         (
           SELECT COUNT(*)::text FROM (
             SELECT gm.gym_id
             FROM gym_machines gm
             WHERE gm.machine_id = $1
               AND gm.deleted_at IS NULL
               AND COALESCE(gm.status, 'active') <> 'deleted'
             UNION
             SELECT p.gym_id
             FROM machine_showcase_posts p
             WHERE p.machine_id = $1
               AND p.gym_id IS NOT NULL
               AND ${VISIBLE_POST}
           ) holdings
         ) AS gym_holding_count,
         (SELECT COUNT(*)::text FROM gyms WHERE is_active = TRUE) AS total_gyms,
         (SELECT COUNT(*)::text FROM user_gym_machines WHERE machine_id = $1) AS user_gym_holding_count,
         (SELECT COUNT(*)::text FROM machine_showcase_posts WHERE machine_id = $1 AND ${VISIBLE_POST}) AS post_count,
         (
           SELECT COUNT(*)::text FROM machine_discoveries
           WHERE machine_id = $1 AND discovery_rank IS NOT NULL
         ) AS discovery_count,
         COALESCE((SELECT admin_weight FROM machine_rarity WHERE machine_id = $1), 0) AS admin_weight,
         COALESCE((SELECT unique_flag FROM machine_rarity WHERE machine_id = $1), FALSE) AS unique_flag,
         (SELECT grade_override FROM machine_rarity WHERE machine_id = $1) AS grade_override`,
      [machineId]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      gymHoldingCount: parseInt(row.gym_holding_count, 10) || 0,
      totalGyms: parseInt(row.total_gyms, 10) || 0,
      userGymHoldingCount: parseInt(row.user_gym_holding_count, 10) || 0,
      postCount: parseInt(row.post_count, 10) || 0,
      discoveryCount: parseInt(row.discovery_count, 10) || 0,
      adminWeight: row.admin_weight ?? 0,
      uniqueFlag: Boolean(row.unique_flag),
      gradeOverride: row.grade_override,
    };
  },

  async recalculate(machineId: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    const counts = await this.loadCounts(machineId);
    if (!counts) return;
    const result = calculateMachineRarity({
      gymHoldingCount: counts.gymHoldingCount,
      totalGyms: counts.totalGyms,
      userGymHoldingCount: counts.userGymHoldingCount,
      postCount: counts.postCount,
      discoveryCount: counts.discoveryCount,
      adminWeight: counts.adminWeight,
      uniqueFlag: counts.uniqueFlag,
      gradeOverride: counts.gradeOverride,
    });
    await pool.query(
      `INSERT INTO machine_rarity (
         machine_id, grade, auto_grade, score, gym_holding_count, user_gym_holding_count,
         post_count, discovery_count, admin_weight, unique_flag, grade_override, calculated_at, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
       ON CONFLICT (machine_id) DO UPDATE SET
         grade = EXCLUDED.grade,
         auto_grade = EXCLUDED.auto_grade,
         score = EXCLUDED.score,
         gym_holding_count = EXCLUDED.gym_holding_count,
         user_gym_holding_count = EXCLUDED.user_gym_holding_count,
         post_count = EXCLUDED.post_count,
         discovery_count = EXCLUDED.discovery_count,
         calculated_at = NOW(),
         updated_at = NOW()`,
      [
        machineId,
        result.grade,
        result.autoGrade,
        result.score,
        counts.gymHoldingCount,
        counts.userGymHoldingCount,
        counts.postCount,
        counts.discoveryCount,
        counts.adminWeight,
        counts.uniqueFlag,
        counts.gradeOverride,
      ]
    );
  },

  async recalculateSafe(machineId: string): Promise<void> {
    try {
      await this.recalculate(machineId);
    } catch {
      // Non-fatal: feed still works with default COMMON until next write.
    }
  },
};
