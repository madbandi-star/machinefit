import type { MachineUserPreferences, RecommendationSettings } from '@machinefit/shared';
import { getPool } from '../config/database.js';

export const preferenceRepository = {
  async upsert(
    userId: string,
    machineId: string,
    fields: {
      customSettings?: Partial<RecommendationSettings>;
      personalTipMemo?: string;
    }
  ): Promise<MachineUserPreferences> {
    const pool = getPool();
    if (!pool) {
      return {
        customSettings: fields.customSettings ?? {},
        personalTipMemo: fields.personalTipMemo ?? '',
      };
    }

    const existing = await this.findByUserMachine(userId, machineId);
    const customSettings =
      fields.customSettings !== undefined
        ? fields.customSettings
        : (existing?.customSettings ?? {});
    const personalTipMemo =
      fields.personalTipMemo !== undefined
        ? fields.personalTipMemo
        : (existing?.personalTipMemo ?? '');

    const result = await pool.query<{
      custom_settings: Partial<RecommendationSettings>;
      personal_tip_memo: string;
    }>(
      `INSERT INTO user_machine_preferences (user_id, machine_id, custom_settings, personal_tip_memo)
       VALUES ($1, $2, $3::jsonb, $4)
       ON CONFLICT (user_id, machine_id)
       DO UPDATE SET
         custom_settings = EXCLUDED.custom_settings,
         personal_tip_memo = EXCLUDED.personal_tip_memo,
         updated_at = NOW()
       RETURNING custom_settings, personal_tip_memo`,
      [userId, machineId, JSON.stringify(customSettings), personalTipMemo]
    );

    const row = result.rows[0];
    return {
      customSettings: row?.custom_settings ?? customSettings,
      personalTipMemo: row?.personal_tip_memo ?? personalTipMemo,
    };
  },

  async findByUserMachine(
    userId: string,
    machineId: string
  ): Promise<MachineUserPreferences | null> {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query<{
      custom_settings: Partial<RecommendationSettings>;
      personal_tip_memo: string;
    }>(
      `SELECT custom_settings, personal_tip_memo FROM user_machine_preferences
       WHERE user_id = $1 AND machine_id = $2`,
      [userId, machineId]
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
      customSettings: row.custom_settings ?? {},
      personalTipMemo: row.personal_tip_memo ?? '',
    };
  },

  async findCustomSettingsByUserMachineCodes(
    userId: string,
    machineCodes: string[]
  ): Promise<Record<string, Partial<RecommendationSettings> | null>> {
    if (machineCodes.length === 0) return {};

    const pool = getPool();
    if (!pool) {
      return Object.fromEntries(machineCodes.map((machineCode) => [machineCode, null]));
    }

    const result = await pool.query<{
      machine_code: string;
      custom_settings: Partial<RecommendationSettings>;
    }>(
      `SELECT m.code AS machine_code, ump.custom_settings
       FROM user_machine_preferences ump
       JOIN machines m ON m.id = ump.machine_id
       WHERE ump.user_id = $1
         AND m.code = ANY($2::text[])`,
      [userId, machineCodes]
    );

    const preferencesByMachine = Object.fromEntries(
      machineCodes.map((machineCode) => [machineCode, null])
    ) as Record<string, Partial<RecommendationSettings> | null>;

    for (const row of result.rows) {
      preferencesByMachine[row.machine_code] = row.custom_settings ?? {};
    }

    return preferencesByMachine;
  },
};
