import type {
  MachineUserPreferences,
  RecommendationSettings,
  SettingsActiveSource,
} from '@machinefit/shared';
import { hasMeaningfulCustomSettings } from '@machinefit/shared';
import { getPool } from '../config/database.js';

type PrefRow = {
  custom_settings: Partial<RecommendationSettings>;
  personal_tip_memo: string;
  active_source: SettingsActiveSource;
};

export type PreferenceScope = {
  gymId: string;
  memberId: string;
};

function mapRow(row: PrefRow): MachineUserPreferences {
  return {
    customSettings: row.custom_settings ?? {},
    personalTipMemo: row.personal_tip_memo ?? '',
    activeSource: row.active_source === 'adjusted' ? 'adjusted' : 'recommended',
  };
}

export const preferenceRepository = {
  async upsert(
    userId: string,
    machineId: string,
    fields: {
      customSettings?: Partial<RecommendationSettings>;
      personalTipMemo?: string;
      activeSource?: SettingsActiveSource;
      clearAdjusted?: boolean;
    },
    scope?: PreferenceScope
  ): Promise<MachineUserPreferences> {
    const pool = getPool();
    if (!pool) {
      const customSettings = fields.clearAdjusted
        ? {}
        : (fields.customSettings ?? {});
      const activeSource: SettingsActiveSource = fields.clearAdjusted
        ? 'recommended'
        : (fields.activeSource ??
          (hasMeaningfulCustomSettings(customSettings) ? 'adjusted' : 'recommended'));
      return {
        customSettings,
        personalTipMemo: fields.personalTipMemo ?? '',
        activeSource,
      };
    }

    const existing = await this.findByUserMachine(userId, machineId, scope);

    let customSettings: Partial<RecommendationSettings>;
    if (fields.clearAdjusted) {
      customSettings = {};
    } else if (fields.customSettings !== undefined) {
      customSettings = fields.customSettings;
    } else {
      customSettings = existing?.customSettings ?? {};
    }

    const personalTipMemo =
      fields.personalTipMemo !== undefined
        ? fields.personalTipMemo
        : (existing?.personalTipMemo ?? '');

    let activeSource: SettingsActiveSource;
    if (fields.clearAdjusted) {
      activeSource = 'recommended';
    } else if (fields.activeSource) {
      activeSource = fields.activeSource;
    } else if (fields.customSettings !== undefined && hasMeaningfulCustomSettings(customSettings)) {
      activeSource = 'adjusted';
    } else {
      activeSource = existing?.activeSource ?? 'recommended';
    }

    if (activeSource === 'adjusted' && !hasMeaningfulCustomSettings(customSettings)) {
      activeSource = 'recommended';
    }

    const result = scope
      ? await pool.query<PrefRow>(
          `INSERT INTO user_machine_preferences (
             user_id, gym_id, member_id, machine_id, custom_settings, personal_tip_memo, active_source
           )
           VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
           ON CONFLICT (user_id, gym_id, member_id, machine_id)
           DO UPDATE SET
             custom_settings = EXCLUDED.custom_settings,
             personal_tip_memo = EXCLUDED.personal_tip_memo,
             active_source = EXCLUDED.active_source,
             updated_at = NOW()
           RETURNING custom_settings, personal_tip_memo, active_source`,
          [
            userId,
            scope.gymId,
            scope.memberId,
            machineId,
            JSON.stringify(customSettings),
            personalTipMemo,
            activeSource,
          ]
        )
      : await pool.query<PrefRow>(
          `INSERT INTO user_machine_preferences (user_id, machine_id, custom_settings, personal_tip_memo, active_source)
           VALUES ($1, $2, $3::jsonb, $4, $5)
           ON CONFLICT (user_id, machine_id)
           DO UPDATE SET
             custom_settings = EXCLUDED.custom_settings,
             personal_tip_memo = EXCLUDED.personal_tip_memo,
             active_source = EXCLUDED.active_source,
             updated_at = NOW()
           RETURNING custom_settings, personal_tip_memo, active_source`,
          [userId, machineId, JSON.stringify(customSettings), personalTipMemo, activeSource]
        );

    const row = result.rows[0];
    return row
      ? mapRow(row)
      : { customSettings, personalTipMemo, activeSource };
  },

  async setActiveSource(
    userId: string,
    machineId: string,
    activeSource: SettingsActiveSource,
    scope?: PreferenceScope
  ): Promise<MachineUserPreferences> {
    return this.upsert(userId, machineId, { activeSource }, scope);
  },

  async findByUserMachine(
    userId: string,
    machineId: string,
    scope?: PreferenceScope
  ): Promise<MachineUserPreferences | null> {
    const pool = getPool();
    if (!pool) return null;

    if (scope) {
      const result = await pool.query<PrefRow>(
        `SELECT custom_settings, personal_tip_memo, active_source FROM user_machine_preferences
         WHERE user_id = $1 AND machine_id = $2 AND gym_id = $3 AND member_id = $4`,
        [userId, machineId, scope.gymId, scope.memberId]
      );
      const row = result.rows[0];
      if (!row) return null;
      return mapRow(row);
    }

    const result = await pool.query<PrefRow>(
      `SELECT custom_settings, personal_tip_memo, active_source FROM user_machine_preferences
       WHERE user_id = $1 AND machine_id = $2`,
      [userId, machineId]
    );

    const row = result.rows[0];
    if (!row) return null;
    return mapRow(row);
  },

  async findByUserMachineCodes(
    userId: string,
    machineCodes: string[],
    scope?: PreferenceScope
  ): Promise<Record<string, MachineUserPreferences | null>> {
    if (machineCodes.length === 0) return {};

    const pool = getPool();
    if (!pool) {
      return Object.fromEntries(machineCodes.map((machineCode) => [machineCode, null]));
    }

    const params: unknown[] = [userId, machineCodes];
    let scopeFilter = '';
    if (scope) {
      params.push(scope.gymId, scope.memberId);
      scopeFilter = ` AND ump.gym_id = $3 AND ump.member_id = $4`;
    }

    const result = await pool.query<{
      machine_code: string;
      custom_settings: Partial<RecommendationSettings>;
      personal_tip_memo: string;
      active_source: SettingsActiveSource;
    }>(
      `SELECT m.code AS machine_code,
              ump.custom_settings,
              ump.personal_tip_memo,
              ump.active_source
       FROM user_machine_preferences ump
       JOIN machines m ON m.id = ump.machine_id
       WHERE ump.user_id = $1
         AND m.code = ANY($2::text[])${scopeFilter}`,
      params
    );

    const preferencesByMachine = Object.fromEntries(
      machineCodes.map((machineCode) => [machineCode, null])
    ) as Record<string, MachineUserPreferences | null>;

    for (const row of result.rows) {
      preferencesByMachine[row.machine_code] = mapRow({
        custom_settings: row.custom_settings,
        personal_tip_memo: row.personal_tip_memo,
        active_source: row.active_source,
      });
    }

    return preferencesByMachine;
  },

  /** @deprecated Prefer findByUserMachineCodes — kept for callers expecting settings-only map. */
  async findCustomSettingsByUserMachineCodes(
    userId: string,
    machineCodes: string[],
    scope?: PreferenceScope
  ): Promise<Record<string, Partial<RecommendationSettings> | null>> {
    const full = await this.findByUserMachineCodes(userId, machineCodes, scope);
    return Object.fromEntries(
      Object.entries(full).map(([code, prefs]) => [code, prefs?.customSettings ?? null])
    );
  },
};
