import type { RecommendationInput, YoutubeVideo } from '@machinefit/shared';
import { EXPERIENCE_WEIGHT_MULTIPLIERS } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { MOCK_SETTINGS, type MockSettingRule } from '../data/mock.js';
import { pickLocalizedArray } from '../utils/localize.util.js';
import { AppError } from '../middlewares/error.middleware.js';

interface SettingRow {
  id: string;
  machine_id: string;
  gender: string;
  experience_level: string;
  height_min_cm: string;
  height_max_cm: string;
  seat_position: number | null;
  back_pad_position: number | null;
  foot_position: number | null;
  handle_position: number | null;
  rom_setting: string | null;
  weight_kg: string | null;
  tips: Record<string, string[]> | null;
  warnings: Record<string, string[]> | null;
}

interface RecommendationRow {
  id: string;
  machine_id: string;
  machine_code: string;
  machine_name: Record<string, string>;
  gender: string;
  height_cm: string;
  weight_kg: string | null;
  experience_level: string;
  seat_position: number | null;
  back_pad_position: number | null;
  foot_position: number | null;
  handle_position: number | null;
  rom_setting: string | null;
  recommended_weight_kg: string | null;
  tips: Record<string, string[]> | null;
  warnings: Record<string, string[]> | null;
  created_at: string;
}

function mapSettingRow(row: SettingRow): MockSettingRule {
  return {
    gender: row.gender,
    experienceLevel: row.experience_level,
    heightMinCm: parseFloat(row.height_min_cm),
    heightMaxCm: parseFloat(row.height_max_cm),
    seatPosition: row.seat_position ?? undefined,
    backPadPosition: row.back_pad_position ?? undefined,
    footPosition: row.foot_position ?? undefined,
    handlePosition: row.handle_position ?? undefined,
    romSetting: row.rom_setting ?? undefined,
    weightKg: row.weight_kg ? parseFloat(row.weight_kg) : undefined,
    tips: (row.tips as Record<string, string[]>) ?? {},
    warnings: (row.warnings as Record<string, string[]>) ?? {},
  };
}

export const recommendationRepository = {
  async findSettingsForMachine(machineId: string, machineCode: string): Promise<MockSettingRule[]> {
    const pool = getPool();
    if (!pool) return MOCK_SETTINGS[machineCode] ?? [];

    const result = await pool.query<SettingRow>(
      'SELECT * FROM machine_settings WHERE machine_id = $1 ORDER BY height_min_cm ASC',
      [machineId]
    );
    return result.rows.map(mapSettingRow);
  },

  async findYoutubeVideos(machineId: string): Promise<YoutubeVideo[]> {
    const pool = getPool();
    if (!pool) return [];

    const result = await pool.query<{
      id: string;
      machine_id: string;
      youtube_id: string;
      title: Record<string, string> | null;
      channel_name: string | null;
      thumbnail_url: string | null;
      language_code: string | null;
      sort_order: number;
      is_official: boolean;
    }>(
      'SELECT * FROM youtube_videos WHERE machine_id = $1 ORDER BY sort_order ASC',
      [machineId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      machineId: row.machine_id,
      youtubeId: row.youtube_id,
      title: row.title ?? undefined,
      channelName: row.channel_name ?? undefined,
      thumbnailUrl: row.thumbnail_url ?? undefined,
      languageCode: row.language_code ?? undefined,
      sortOrder: row.sort_order,
      isOfficial: row.is_official,
    }));
  },

  async save(
    input: RecommendationInput,
    machineId: string,
    settingId: string | null,
    match: MockSettingRule | undefined,
    recommendedWeightKg: number | undefined,
    userId?: string,
    sessionId?: string
  ): Promise<string> {
    const pool = getPool();
    const id = crypto.randomUUID();

    if (!pool) return id;

    await pool.query(
      `INSERT INTO machine_recommendations (
        id, user_id, machine_id, machine_setting_id,
        gender, height_cm, weight_kg, experience_level,
        seat_position, back_pad_position, foot_position, handle_position,
        rom_setting, recommended_weight_kg, tips, warnings, session_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        id,
        userId ?? null,
        machineId,
        settingId,
        input.gender,
        input.heightCm,
        input.weightKg ?? null,
        input.experienceLevel,
        match?.seatPosition ?? null,
        match?.backPadPosition ?? null,
        match?.footPosition ?? null,
        match?.handlePosition ?? null,
        match?.romSetting ?? null,
        recommendedWeightKg ?? null,
        match?.tips ? JSON.stringify(match.tips) : null,
        match?.warnings ? JSON.stringify(match.warnings) : null,
        sessionId ?? null,
      ]
    );

    return id;
  },

  async findById(id: string, locale = 'en') {
    const pool = getPool();
    if (!pool) throw new AppError(404, 'NOT_FOUND', `Recommendation not found: ${id}`);

    const result = await pool.query<RecommendationRow>(
      `SELECT r.*, m.code AS machine_code, m.name AS machine_name, m.id AS machine_id
       FROM machine_recommendations r
       JOIN machines m ON m.id = r.machine_id
       WHERE r.id = $1`,
      [id]
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', `Recommendation not found: ${id}`);
    }

    const row = result.rows[0];
    return {
      id: row.id,
      machineCode: row.machine_code,
      machineName: row.machine_name[locale] ?? row.machine_name.en,
      settings: {
        seatPosition: row.seat_position ?? undefined,
        backPadPosition: row.back_pad_position ?? undefined,
        footPosition: row.foot_position ?? undefined,
        handlePosition: row.handle_position ?? undefined,
        romSetting: row.rom_setting ?? undefined,
        recommendedWeightKg: row.recommended_weight_kg
          ? parseFloat(row.recommended_weight_kg)
          : undefined,
      },
      tips: pickLocalizedArray(row.tips, locale),
      warnings: pickLocalizedArray(row.warnings, locale),
      youtubeVideos: await this.findYoutubeVideos(row.machine_id),
      createdAt: row.created_at,
    };
  },

  computeRecommendedWeight(
    input: RecommendationInput,
    baseWeight?: number
  ): number | undefined {
    if (!baseWeight && !input.weightKg) return baseWeight;
    if (input.weightKg) {
      const multiplier = EXPERIENCE_WEIGHT_MULTIPLIERS[input.experienceLevel];
      return Math.round(input.weightKg * multiplier * 0.5 * 10) / 10;
    }
    return baseWeight;
  },
};
