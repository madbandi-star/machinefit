import type {
  Locale,
  RecommendationSettings,
  TargetMuscleGroup,
  WorkoutCard,
  WorkoutCardDaySummary,
  WorkoutCardStatus,
  WorkoutCardTemplate,
  WorkoutCardTemplateItem,
  WorkoutCardVoicePrefs,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { pickLocalized } from '../utils/localize.util.js';

interface WorkoutCardRow {
  id: string;
  gym_id: string;
  member_id: string;
  machine_id: string;
  machine_code: string;
  machine_name: Record<string, string>;
  brand_name: Record<string, string> | null;
  muscle_group: string | null;
  recommendation_id: string | null;
  target_muscle_group: string;
  scheduled_date: string | Date;
  status: WorkoutCardStatus;
  set_count: number;
  set_weights_kg: number[];
  set_reps: number[] | null;
  set_completed: boolean[] | null;
  diary: string | null;
  rest_seconds: number | null;
  voice_prefs: WorkoutCardVoicePrefs | null;
  display_order: number;
  workout_log_id: string | null;
  source_card_id: string | null;
  template_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  seat_position?: number | null;
  back_pad_position?: number | null;
  foot_position?: number | null;
  handle_position?: number | null;
  rom_setting?: string | null;
  recommended_weight_kg?: string | null;
  recommended_reps_min?: number | null;
  recommended_reps_max?: number | null;
  primary_image_url?: string | null;
}

interface WorkoutCardTemplateRow {
  id: string;
  gym_id: string | null;
  name: string;
  payload: WorkoutCardTemplateItem[];
  created_at: string;
  updated_at: string;
  is_original?: boolean | null;
  original_template_id?: string | null;
  source_template_id?: string | null;
  source_share_post_id?: string | null;
  origin_author_name?: string | null;
  origin_title?: string | null;
  share_post_id?: string | null;
  share_post_status?: string | null;
}

/** Full lineage row for share eligibility / usage tracking. */
export interface WorkoutCardTemplateShareCheck {
  id: string;
  userId: string;
  gymId?: string;
  name: string;
  payload: WorkoutCardTemplateItem[];
  isOriginal: boolean;
  originalTemplateId: string | null;
  sourceTemplateId: string | null;
  sourceSharePostId: string | null;
  originAuthorName: string | null;
  originTitle: string | null;
}

function formatDateKey(value: string | Date): string {
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    return value.slice(0, 10);
  }
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, '0');
  const d = String(value.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function mapRecommendationSettings(row: WorkoutCardRow): RecommendationSettings | undefined {
  if (!row.recommendation_id) return undefined;
  const settings: RecommendationSettings = {};
  if (row.seat_position != null) settings.seatPosition = row.seat_position;
  if (row.back_pad_position != null) settings.backPadPosition = row.back_pad_position;
  if (row.foot_position != null) settings.footPosition = row.foot_position;
  if (row.handle_position != null) settings.handlePosition = row.handle_position;
  if (row.rom_setting) settings.romSetting = row.rom_setting;
  if (row.recommended_weight_kg != null) {
    settings.recommendedWeightKg = parseFloat(row.recommended_weight_kg);
  }
  if (row.recommended_reps_min != null) {
    settings.recommendedRepsMin = row.recommended_reps_min;
  }
  if (row.recommended_reps_max != null) {
    settings.recommendedRepsMax = row.recommended_reps_max;
  }
  return Object.keys(settings).length > 0 ? settings : undefined;
}

function mapCardRow(row: WorkoutCardRow, locale: Locale = 'en'): WorkoutCard {
  const settings = mapRecommendationSettings(row);
  return {
    id: row.id,
    gymId: row.gym_id,
    memberId: row.member_id,
    machineCode: row.machine_code,
    machineName: pickLocalized(row.machine_name, locale) ?? row.machine_code,
    brandName: row.brand_name
      ? pickLocalized(row.brand_name, locale) ?? undefined
      : undefined,
    primaryImageUrl: row.primary_image_url ?? undefined,
    muscleGroup: row.muscle_group || undefined,
    recommendationId: row.recommendation_id ?? undefined,
    ...(settings ? { settings } : {}),
    targetMuscleGroup: row.target_muscle_group
      ? (row.target_muscle_group as TargetMuscleGroup)
      : undefined,
    scheduledDate: formatDateKey(row.scheduled_date),
    status: row.status,
    setCount: row.set_count,
    setWeightsKg: row.set_weights_kg,
    setReps: row.set_reps ?? undefined,
    setCompleted:
      row.set_completed && row.set_completed.length > 0
        ? row.set_completed
        : undefined,
    diary: row.diary ?? undefined,
    restSeconds: row.rest_seconds ?? undefined,
    voicePrefs: row.voice_prefs ?? undefined,
    displayOrder: row.display_order,
    workoutLogId: row.workout_log_id ?? undefined,
    sourceCardId: row.source_card_id ?? undefined,
    templateId: row.template_id ?? undefined,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const TEMPLATE_SELECT = `
  t.id, t.gym_id, t.name, t.payload, t.created_at, t.updated_at,
  COALESCE(t.is_original, TRUE) AS is_original,
  t.original_template_id, t.source_template_id, t.source_share_post_id,
  t.origin_author_name, t.origin_title,
  tsp.id AS share_post_id, tsp.status AS share_post_status
`;

/** Pre-migration 116 select — keeps My Templates usable if share tables lag. */
const LEGACY_TEMPLATE_SELECT = `
  t.id, t.gym_id, t.name, t.payload, t.created_at, t.updated_at,
  TRUE AS is_original,
  NULL::uuid AS original_template_id,
  NULL::uuid AS source_template_id,
  NULL::uuid AS source_share_post_id,
  NULL::text AS origin_author_name,
  NULL::text AS origin_title,
  NULL::uuid AS share_post_id,
  NULL::text AS share_post_status
`;

function isMissingTemplateShareSchema(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  // undefined_table | undefined_column
  return code === '42P01' || code === '42703';
}

function canShareTemplate(row: {
  is_original?: boolean | null;
  original_template_id?: string | null;
  source_template_id?: string | null;
  source_share_post_id?: string | null;
}): boolean {
  return (
    (row.is_original ?? true) === true &&
    !row.source_share_post_id &&
    !row.original_template_id &&
    !row.source_template_id
  );
}

function mapTemplateRow(row: WorkoutCardTemplateRow): WorkoutCardTemplate {
  const items = Array.isArray(row.payload) ? row.payload : [];
  const isOriginal = row.is_original ?? true;
  return {
    id: row.id,
    gymId: row.gym_id ?? undefined,
    name: row.name,
    items,
    isOriginal,
    canShare: canShareTemplate(row),
    originalTemplateId: row.original_template_id ?? null,
    sourceTemplateId: row.source_template_id ?? null,
    sourceSharePostId: row.source_share_post_id ?? null,
    originAuthorName: row.origin_author_name ?? null,
    originTitle: row.origin_title ?? null,
    sharePostId: row.share_post_id ?? null,
    sharePostStatus:
      (row.share_post_status as WorkoutCardTemplate['sharePostStatus']) ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Prefer muscle cover → default cover → machine_images → standard type. */
const PRIMARY_IMAGE_SQL = `COALESCE(
              (
                SELECT CASE
                  WHEN c.image_url IS NULL THEN NULL
                  WHEN POSITION('?' IN c.image_url) > 0
                    THEN c.image_url || '&v=' || COALESCE(c.version, 0)::text
                  ELSE c.image_url || '?v=' || COALESCE(c.version, 0)::text
                END
                FROM machine_cover_images c
                WHERE c.machine_id = m.id
                  AND c.target_muscle_group IS NOT DISTINCT FROM wc.target_muscle_group
                LIMIT 1
              ),
              (
                SELECT CASE
                  WHEN c.image_url IS NULL THEN NULL
                  WHEN POSITION('?' IN c.image_url) > 0
                    THEN c.image_url || '&v=' || COALESCE(c.version, 0)::text
                  ELSE c.image_url || '?v=' || COALESCE(c.version, 0)::text
                END
                FROM machine_cover_images c
                WHERE c.machine_id = m.id AND c.target_muscle_group IS NULL
                LIMIT 1
              ),
              (
                SELECT mi.image_url
                FROM machine_images mi
                WHERE mi.machine_id = m.id
                ORDER BY mi.is_primary DESC, mi.sort_order ASC
                LIMIT 1
              ),
              (
                SELECT CASE
                  WHEN s.image_url IS NULL THEN NULL
                  WHEN POSITION('?' IN s.image_url) > 0
                    THEN s.image_url || '&v=' || COALESCE(s.version, 0)::text
                  ELSE s.image_url || '?v=' || COALESCE(s.version, 0)::text
                END
                FROM standard_machine_images s
                WHERE s.standard_type_id = m.standard_type_id
                ORDER BY s.is_primary DESC, s.display_order ASC
                LIMIT 1
              )
            ) AS primary_image_url`;

const SELECT_FIELDS = `wc.id, wc.gym_id, wc.member_id, wc.machine_id, wc.recommendation_id,
              wc.target_muscle_group, wc.scheduled_date, wc.status, wc.set_count,
              wc.set_weights_kg, wc.set_reps, wc.set_completed, wc.diary, wc.rest_seconds,
              wc.voice_prefs,
              wc.display_order, wc.workout_log_id, wc.source_card_id, wc.template_id,
              wc.started_at, wc.completed_at, wc.created_at, wc.updated_at,
              m.code AS machine_code, m.name AS machine_name, m.muscle_group, b.name AS brand_name,
              r.seat_position, r.back_pad_position, r.foot_position, r.handle_position,
              r.rom_setting, r.recommended_weight_kg, r.recommended_reps_min, r.recommended_reps_max,
              ${PRIMARY_IMAGE_SQL}`;

const MACHINE_JOINS = `JOIN machines m ON m.id = wc.machine_id
       LEFT JOIN brands b ON b.id = m.brand_id
       LEFT JOIN machine_recommendations r ON r.id = wc.recommendation_id`;

export type WorkoutCardCreateData = {
  gymId: string;
  memberId: string;
  machineId: string;
  recommendationId?: string;
  targetMuscleGroup?: string;
  scheduledDate: string;
  status: WorkoutCardStatus;
  setCount: number;
  setWeightsKg: number[];
  setReps?: number[];
  setCompleted?: boolean[];
  diary?: string;
  restSeconds?: number;
  voicePrefs?: WorkoutCardVoicePrefs | null;
  displayOrder?: number;
  sourceCardId?: string;
  templateId?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  workoutLogId?: string | null;
};

export type WorkoutCardUpdateData = {
  setCount?: number;
  setWeightsKg?: number[];
  setReps?: number[] | null;
  setCompleted?: boolean[] | null;
  diary?: string | null;
  restSeconds?: number | null;
  voicePrefs?: WorkoutCardVoicePrefs | null;
  displayOrder?: number;
  recommendationId?: string | null;
};

export const workoutCardRepository = {
  async findById(
    userId: string,
    id: string,
    locale: Locale = 'en'
  ): Promise<(WorkoutCard & { machineId: string }) | null> {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query<WorkoutCardRow>(
      `SELECT ${SELECT_FIELDS}
       FROM workout_cards wc
       ${MACHINE_JOINS}
       WHERE wc.id = $1 AND wc.user_id = $2`,
      [id, userId]
    );
    const row = result.rows[0];
    if (!row) return null;
    return { ...mapCardRow(row, locale), machineId: row.machine_id };
  },

  async listByUser(
    userId: string,
    options: {
      gymId: string;
      memberId: string;
      scheduledDate?: string;
      from?: string;
      to?: string;
      status?: WorkoutCardStatus[];
      limit?: number;
    },
    locale: Locale = 'en'
  ): Promise<WorkoutCard[]> {
    const pool = getPool();
    if (!pool) return [];

    const params: unknown[] = [userId, options.gymId, options.memberId];
    let filters = ` WHERE wc.user_id = $1 AND wc.gym_id = $2 AND wc.member_id = $3`;

    if (options.scheduledDate) {
      params.push(options.scheduledDate);
      filters += ` AND wc.scheduled_date = $${params.length}::date`;
    }
    if (options.from) {
      params.push(options.from);
      filters += ` AND wc.scheduled_date >= $${params.length}::date`;
    }
    if (options.to) {
      params.push(options.to);
      filters += ` AND wc.scheduled_date <= $${params.length}::date`;
    }
    if (options.status && options.status.length > 0) {
      params.push(options.status);
      filters += ` AND wc.status = ANY($${params.length}::text[])`;
    }

    let limitSql = '';
    if (options.limit !== undefined) {
      params.push(options.limit);
      limitSql = ` LIMIT $${params.length}`;
    }

    const result = await pool.query<WorkoutCardRow>(
      `SELECT ${SELECT_FIELDS}
       FROM workout_cards wc
       ${MACHINE_JOINS}
       ${filters}
       ORDER BY wc.scheduled_date ASC, wc.display_order ASC, wc.created_at ASC${limitSql}`,
      params
    );
    return result.rows.map((row) => mapCardRow(row, locale));
  },

  async listMissed(
    userId: string,
    gymId: string,
    memberId: string,
    today: string,
    locale: Locale = 'en'
  ): Promise<WorkoutCard[]> {
    const pool = getPool();
    if (!pool) return [];

    const result = await pool.query<WorkoutCardRow>(
      `SELECT ${SELECT_FIELDS}
       FROM workout_cards wc
       ${MACHINE_JOINS}
       WHERE wc.user_id = $1 AND wc.gym_id = $2 AND wc.member_id = $3
         AND wc.status = 'PLANNED' AND wc.scheduled_date < $4::date
       ORDER BY wc.scheduled_date ASC, wc.display_order ASC`,
      [userId, gymId, memberId, today]
    );
    return result.rows.map((row) => mapCardRow(row, locale));
  },

  /** Snapshot cards + logs for a gym+date; performed sets/weights prefer workout_logs. */
  async listTemplateSourceItems(
    userId: string,
    gymId: string,
    scheduledDate: string
  ): Promise<WorkoutCardTemplateItem[]> {
    const pool = getPool();
    if (!pool) return [];

    const result = await pool.query<WorkoutCardRow>(
      `SELECT ${SELECT_FIELDS}
       FROM workout_cards wc
       ${MACHINE_JOINS}
       WHERE wc.user_id = $1 AND wc.gym_id = $2 AND wc.scheduled_date = $3::date
       ORDER BY wc.display_order ASC, wc.created_at ASC`,
      [userId, gymId, scheduledDate]
    );

    const logResult = await pool.query<{
      machine_code: string;
      target_muscle_group: string;
      set_count: number;
      set_weights_kg: number[];
      diary: string | null;
      recommendation_id: string | null;
    }>(
      `SELECT m.code AS machine_code,
              wl.target_muscle_group,
              wl.set_count,
              wl.set_weights_kg,
              wl.diary,
              wl.recommendation_id
       FROM workout_logs wl
       JOIN machines m ON m.id = wl.machine_id
       WHERE wl.user_id = $1 AND wl.gym_id = $2 AND wl.log_date = $3::date
       ORDER BY wl.created_at ASC`,
      [userId, gymId, scheduledDate]
    );

    const normalizeWeights = (setCount: number, raw: number[] | null | undefined) => {
      const count = Math.max(1, setCount || 1);
      const weights = Array.isArray(raw) ? [...raw] : [];
      while (weights.length < count) weights.push(weights[weights.length - 1] ?? 0);
      return weights.slice(0, count);
    };

    const logByKey = new Map<string, (typeof logResult.rows)[number]>();
    for (const row of logResult.rows) {
      logByKey.set(`${row.machine_code}:${row.target_muscle_group ?? ''}`, row);
    }

    const usedKeys = new Set<string>();
    const items: WorkoutCardTemplateItem[] = [];

    for (const row of result.rows) {
      const key = `${row.machine_code}:${row.target_muscle_group ?? ''}`;
      usedKeys.add(key);
      const log = logByKey.get(key);
      const setCount = Math.max(1, log?.set_count || row.set_count || 1);
      const setWeightsKg = normalizeWeights(
        setCount,
        log?.set_weights_kg?.length ? log.set_weights_kg : row.set_weights_kg
      );
      const diary = (log?.diary?.trim() || row.diary?.trim() || '') || undefined;
      items.push({
        machineCode: row.machine_code,
        machineName: pickLocalized(row.machine_name, 'ko') ?? row.machine_code,
        brandName: row.brand_name
          ? pickLocalized(row.brand_name, 'ko') ?? undefined
          : undefined,
        primaryImageUrl: row.primary_image_url ?? undefined,
        targetMuscleGroup: row.target_muscle_group
          ? (row.target_muscle_group as TargetMuscleGroup)
          : undefined,
        setCount,
        setWeightsKg,
        setReps: row.set_reps ?? undefined,
        diary,
        restSeconds: row.rest_seconds ?? undefined,
        voicePrefs: row.voice_prefs ?? undefined,
        displayOrder: row.display_order,
        recommendationId: row.recommendation_id ?? log?.recommendation_id ?? undefined,
      });
    }

    logResult.rows.forEach((row, index) => {
      const key = `${row.machine_code}:${row.target_muscle_group ?? ''}`;
      if (usedKeys.has(key)) return;
      usedKeys.add(key);
      const setCount = Math.max(1, row.set_count || 1);
      items.push({
        machineCode: row.machine_code,
        targetMuscleGroup: row.target_muscle_group
          ? (row.target_muscle_group as TargetMuscleGroup)
          : undefined,
        setCount,
        setWeightsKg: normalizeWeights(setCount, row.set_weights_kg),
        diary: row.diary ?? undefined,
        displayOrder: items.length > 0 ? items.length : index,
        recommendationId: row.recommendation_id ?? undefined,
      });
    });

    return items;
  },

  async create(
    userId: string,
    data: WorkoutCardCreateData,
    locale: Locale = 'en'
  ): Promise<WorkoutCard & { machineId: string }> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');

    const setCompleted =
      data.setCompleted && data.setCompleted.length === data.setCount
        ? data.setCompleted
        : null;

    const result = await pool.query<WorkoutCardRow>(
      `INSERT INTO workout_cards (
         user_id, gym_id, member_id, machine_id, recommendation_id, target_muscle_group,
         scheduled_date, status, set_count, set_weights_kg, set_reps, set_completed,
         diary, rest_seconds, voice_prefs, display_order, source_card_id, template_id,
         started_at, completed_at, workout_log_id
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7::date, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb,
         $13, $14, $15::jsonb, $16, $17, $18, $19, $20, $21
       )
       RETURNING id, gym_id, member_id, machine_id, recommendation_id, target_muscle_group,
                 scheduled_date, status, set_count, set_weights_kg, set_reps, set_completed,
                 diary, rest_seconds, voice_prefs, display_order, workout_log_id, source_card_id, template_id,
                 started_at, completed_at, created_at, updated_at,
                 (SELECT code FROM machines WHERE id = $4) AS machine_code,
                 (SELECT name FROM machines WHERE id = $4) AS machine_name,
                 (SELECT muscle_group FROM machines WHERE id = $4) AS muscle_group,
                 (SELECT b.name FROM machines m2 LEFT JOIN brands b ON b.id = m2.brand_id WHERE m2.id = $4) AS brand_name`,
      [
        userId,
        data.gymId,
        data.memberId,
        data.machineId,
        data.recommendationId ?? null,
        data.targetMuscleGroup ?? '',
        data.scheduledDate,
        data.status,
        data.setCount,
        JSON.stringify(data.setWeightsKg),
        data.setReps ? JSON.stringify(data.setReps) : null,
        setCompleted ? JSON.stringify(setCompleted) : null,
        data.diary ?? null,
        data.restSeconds ?? null,
        data.voicePrefs ? JSON.stringify(data.voicePrefs) : null,
        data.displayOrder ?? 0,
        data.sourceCardId ?? null,
        data.templateId ?? null,
        data.startedAt ?? null,
        data.completedAt ?? null,
        data.workoutLogId ?? null,
      ]
    );

    const row = result.rows[0];
    if (!row) throw new Error('Failed to create workout card');
    return { ...mapCardRow(row, locale), machineId: row.machine_id };
  },

  async update(
    userId: string,
    id: string,
    data: WorkoutCardUpdateData,
    locale: Locale = 'en'
  ): Promise<(WorkoutCard & { machineId: string }) | null> {
    const pool = getPool();
    if (!pool) return null;

    const sets: string[] = [];
    const params: unknown[] = [];

    if (data.setCount !== undefined) {
      params.push(data.setCount);
      sets.push(`set_count = $${params.length}`);
    }
    if (data.setWeightsKg !== undefined) {
      params.push(JSON.stringify(data.setWeightsKg));
      sets.push(`set_weights_kg = $${params.length}::jsonb`);
    }
    if (data.setReps !== undefined) {
      if (data.setReps === null) {
        sets.push(`set_reps = NULL`);
      } else {
        params.push(JSON.stringify(data.setReps));
        sets.push(`set_reps = $${params.length}::jsonb`);
      }
    }
    if (data.setCompleted !== undefined) {
      if (data.setCompleted === null) {
        sets.push(`set_completed = NULL`);
      } else {
        params.push(JSON.stringify(data.setCompleted));
        sets.push(`set_completed = $${params.length}::jsonb`);
      }
    }
    if (data.diary !== undefined) {
      params.push(data.diary);
      sets.push(`diary = $${params.length}`);
    }
    if (data.restSeconds !== undefined) {
      params.push(data.restSeconds);
      sets.push(`rest_seconds = $${params.length}`);
    }
    if (data.voicePrefs !== undefined) {
      if (data.voicePrefs === null) {
        sets.push(`voice_prefs = NULL`);
      } else {
        params.push(JSON.stringify(data.voicePrefs));
        sets.push(`voice_prefs = $${params.length}::jsonb`);
      }
    }
    if (data.displayOrder !== undefined) {
      params.push(data.displayOrder);
      sets.push(`display_order = $${params.length}`);
    }
    if (data.recommendationId !== undefined) {
      params.push(data.recommendationId);
      sets.push(`recommendation_id = $${params.length}`);
    }

    if (sets.length === 0) {
      return this.findById(userId, id, locale);
    }

    params.push(id, userId);
    const result = await pool.query(
      `UPDATE workout_cards SET ${sets.join(', ')}
       WHERE id = $${params.length - 1} AND user_id = $${params.length}
       RETURNING id`,
      params
    );
    if (!result.rows[0]) return null;
    return this.findById(userId, id, locale);
  },

  /**
   * Keep plan-card diary/sets aligned with workout_logs after 「계획 저장」
   * so date-copy can snapshot card fields (and logs) together.
   */
  async syncFromWorkoutLog(
    userId: string,
    data: {
      gymId: string;
      memberId: string;
      machineId: string;
      scheduledDate: string;
      targetMuscleGroup: string;
      setCount: number;
      setWeightsKg: number[];
      setCompleted?: boolean[] | null;
      diary?: string | null;
      workoutLogId?: string | null;
    }
  ): Promise<void> {
    const pool = getPool();
    if (!pool) return;

    await pool.query(
      `UPDATE workout_cards
       SET set_count = $6,
           set_weights_kg = $7::jsonb,
           set_completed = $8::jsonb,
           diary = $9,
           workout_log_id = COALESCE($10::uuid, workout_log_id),
           updated_at = NOW()
       WHERE user_id = $1
         AND gym_id = $2
         AND member_id = $3
         AND machine_id = $4
         AND scheduled_date = $5::date
         AND target_muscle_group = $11`,
      [
        userId,
        data.gymId,
        data.memberId,
        data.machineId,
        data.scheduledDate,
        data.setCount,
        JSON.stringify(data.setWeightsKg),
        data.setCompleted == null ? null : JSON.stringify(data.setCompleted),
        data.diary ?? null,
        data.workoutLogId ?? null,
        data.targetMuscleGroup,
      ]
    );
  },

  async updateStatus(
    userId: string,
    id: string,
    patch: {
      status: WorkoutCardStatus;
      startedAt?: string | null;
      completedAt?: string | null;
      workoutLogId?: string | null;
      clearStartedAt?: boolean;
      clearCompletedAt?: boolean;
    },
    locale: Locale = 'en'
  ): Promise<(WorkoutCard & { machineId: string }) | null> {
    const pool = getPool();
    if (!pool) return null;

    const sets = [`status = $1`];
    const params: unknown[] = [patch.status];

    if (patch.startedAt !== undefined) {
      params.push(patch.startedAt);
      sets.push(`started_at = $${params.length}`);
    } else if (patch.clearStartedAt) {
      sets.push(`started_at = NULL`);
    }

    if (patch.completedAt !== undefined) {
      params.push(patch.completedAt);
      sets.push(`completed_at = $${params.length}`);
    } else if (patch.clearCompletedAt) {
      sets.push(`completed_at = NULL`);
    }

    if (patch.workoutLogId !== undefined) {
      params.push(patch.workoutLogId);
      sets.push(`workout_log_id = $${params.length}`);
    }

    params.push(id, userId);
    const result = await pool.query(
      `UPDATE workout_cards SET ${sets.join(', ')}
       WHERE id = $${params.length - 1} AND user_id = $${params.length}
       RETURNING id`,
      params
    );
    if (!result.rows[0]) return null;
    return this.findById(userId, id, locale);
  },

  async moveDate(
    userId: string,
    id: string,
    scheduledDate: string,
    locale: Locale = 'en'
  ): Promise<(WorkoutCard & { machineId: string }) | null> {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query(
      `UPDATE workout_cards SET scheduled_date = $1::date
       WHERE id = $2 AND user_id = $3
       RETURNING id`,
      [scheduledDate, id, userId]
    );
    if (!result.rows[0]) return null;
    return this.findById(userId, id, locale);
  },

  async delete(userId: string, id: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;

    const result = await pool.query(
      `DELETE FROM workout_cards WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async getStatusCounts(
    userId: string,
    gymId: string,
    memberId: string,
    from?: string,
    to?: string
  ): Promise<Record<WorkoutCardStatus, number>> {
    const pool = getPool();
    const empty: Record<WorkoutCardStatus, number> = {
      PLANNED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      SKIPPED: 0,
    };
    if (!pool) return empty;

    const params: unknown[] = [userId, gymId, memberId];
    let dateFilter = '';
    if (from) {
      params.push(from);
      dateFilter += ` AND scheduled_date >= $${params.length}::date`;
    }
    if (to) {
      params.push(to);
      dateFilter += ` AND scheduled_date <= $${params.length}::date`;
    }

    const result = await pool.query<{ status: WorkoutCardStatus; count: string }>(
      `SELECT status, COUNT(*)::text AS count
       FROM workout_cards
       WHERE user_id = $1 AND gym_id = $2 AND member_id = $3${dateFilter}
       GROUP BY status`,
      params
    );

    for (const row of result.rows) {
      empty[row.status] = parseInt(row.count, 10) || 0;
    }
    return empty;
  },

  async calendarSummary(
    userId: string,
    gymId: string,
    memberId: string,
    from: string,
    to: string
  ): Promise<WorkoutCardDaySummary[]> {
    const pool = getPool();
    if (!pool) return [];

    const result = await pool.query<{
      scheduled_date: string | Date;
      planned_count: string;
      in_progress_count: string;
      completed_count: string;
      skipped_count: string;
      total_count: string;
    }>(
      `SELECT scheduled_date,
              COUNT(*) FILTER (WHERE status = 'PLANNED')::text AS planned_count,
              COUNT(*) FILTER (WHERE status = 'IN_PROGRESS')::text AS in_progress_count,
              COUNT(*) FILTER (WHERE status = 'COMPLETED')::text AS completed_count,
              COUNT(*) FILTER (WHERE status = 'SKIPPED')::text AS skipped_count,
              COUNT(*)::text AS total_count
       FROM workout_cards
       WHERE user_id = $1 AND gym_id = $2 AND member_id = $3
         AND scheduled_date >= $4::date AND scheduled_date <= $5::date
       GROUP BY scheduled_date
       ORDER BY scheduled_date ASC`,
      [userId, gymId, memberId, from, to]
    );

    return result.rows.map((row) => ({
      scheduledDate: formatDateKey(row.scheduled_date),
      plannedCount: parseInt(row.planned_count, 10) || 0,
      inProgressCount: parseInt(row.in_progress_count, 10) || 0,
      completedCount: parseInt(row.completed_count, 10) || 0,
      skippedCount: parseInt(row.skipped_count, 10) || 0,
      totalCount: parseInt(row.total_count, 10) || 0,
    }));
  },

  async createTemplate(
    userId: string,
    data: { gymId?: string; name: string; items: WorkoutCardTemplateItem[] }
  ): Promise<WorkoutCardTemplate> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');

    const result = await pool.query<WorkoutCardTemplateRow>(
      `INSERT INTO workout_card_templates (
         user_id, gym_id, name, payload,
         is_original, original_template_id, source_template_id, source_share_post_id,
         origin_author_name, origin_title
       )
       VALUES ($1, $2, $3, $4::jsonb, TRUE, NULL, NULL, NULL, NULL, NULL)
       RETURNING id, gym_id, name, payload, created_at, updated_at,
                 is_original, original_template_id, source_template_id, source_share_post_id,
                 origin_author_name, origin_title`,
      [userId, data.gymId ?? null, data.name, JSON.stringify(data.items)]
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to create template');
    return mapTemplateRow(row);
  },

  /**
   * Insert a downloaded (non-original) template copy from a share-hub post.
   */
  async createDownloadedTemplate(
    userId: string,
    data: {
      name: string;
      items: WorkoutCardTemplateItem[];
      originalTemplateId: string | null;
      sourceTemplateId: string | null;
      sourceSharePostId: string;
      originAuthorName: string;
      originTitle: string;
    }
  ): Promise<WorkoutCardTemplate> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');

    const result = await pool.query<WorkoutCardTemplateRow>(
      `INSERT INTO workout_card_templates (
         user_id, gym_id, name, payload,
         is_original, original_template_id, source_template_id, source_share_post_id,
         origin_author_name, origin_title
       )
       VALUES ($1, NULL, $2, $3::jsonb, FALSE, $4, $5, $6, $7, $8)
       RETURNING id, gym_id, name, payload, created_at, updated_at,
                 is_original, original_template_id, source_template_id, source_share_post_id,
                 origin_author_name, origin_title`,
      [
        userId,
        data.name,
        JSON.stringify(data.items),
        data.originalTemplateId,
        data.sourceTemplateId,
        data.sourceSharePostId,
        data.originAuthorName,
        data.originTitle,
      ]
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to create downloaded template');
    return mapTemplateRow(row);
  },

  async listTemplates(userId: string, gymId?: string): Promise<WorkoutCardTemplate[]> {
    const pool = getPool();
    if (!pool) return [];

    const params: unknown[] = [userId];
    let gymFilter = '';
    if (gymId) {
      params.push(gymId);
      gymFilter = ` AND (t.gym_id IS NULL OR t.gym_id = $${params.length})`;
    }

    try {
      const result = await pool.query<WorkoutCardTemplateRow>(
        `SELECT ${TEMPLATE_SELECT}
         FROM workout_card_templates t
         LEFT JOIN template_share_posts tsp ON tsp.source_template_id = t.id
         WHERE t.user_id = $1${gymFilter}
         ORDER BY t.created_at DESC`,
        params
      );
      return result.rows.map(mapTemplateRow);
    } catch (err) {
      if (!isMissingTemplateShareSchema(err)) throw err;
      const result = await pool.query<WorkoutCardTemplateRow>(
        `SELECT ${LEGACY_TEMPLATE_SELECT}
         FROM workout_card_templates t
         WHERE t.user_id = $1${gymFilter}
         ORDER BY t.created_at DESC`,
        params
      );
      return result.rows.map(mapTemplateRow);
    }
  },

  async findTemplateById(
    userId: string,
    id: string
  ): Promise<WorkoutCardTemplate | null> {
    const pool = getPool();
    if (!pool) return null;

    try {
      const result = await pool.query<WorkoutCardTemplateRow>(
        `SELECT ${TEMPLATE_SELECT}
         FROM workout_card_templates t
         LEFT JOIN template_share_posts tsp ON tsp.source_template_id = t.id
         WHERE t.id = $1 AND t.user_id = $2`,
        [id, userId]
      );
      const row = result.rows[0];
      return row ? mapTemplateRow(row) : null;
    } catch (err) {
      if (!isMissingTemplateShareSchema(err)) throw err;
      const result = await pool.query<WorkoutCardTemplateRow>(
        `SELECT ${LEGACY_TEMPLATE_SELECT}
         FROM workout_card_templates t
         WHERE t.id = $1 AND t.user_id = $2`,
        [id, userId]
      );
      const row = result.rows[0];
      return row ? mapTemplateRow(row) : null;
    }
  },

  /** Full lineage for share-hub publish checks (owned by userId). */
  async getTemplateForShareCheck(
    userId: string,
    id: string
  ): Promise<WorkoutCardTemplateShareCheck | null> {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query<{
      id: string;
      user_id: string;
      gym_id: string | null;
      name: string;
      payload: WorkoutCardTemplateItem[];
      is_original: boolean;
      original_template_id: string | null;
      source_template_id: string | null;
      source_share_post_id: string | null;
      origin_author_name: string | null;
      origin_title: string | null;
    }>(
      `SELECT id, user_id, gym_id, name, payload,
              COALESCE(is_original, TRUE) AS is_original,
              original_template_id, source_template_id, source_share_post_id,
              origin_author_name, origin_title
       FROM workout_card_templates
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      gymId: row.gym_id ?? undefined,
      name: row.name,
      payload: Array.isArray(row.payload) ? row.payload : [],
      isOriginal: row.is_original,
      originalTemplateId: row.original_template_id,
      sourceTemplateId: row.source_template_id,
      sourceSharePostId: row.source_share_post_id,
      originAuthorName: row.origin_author_name,
      originTitle: row.origin_title,
    };
  },

  async deleteTemplate(userId: string, id: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;

    const result = await pool.query(
      `DELETE FROM workout_card_templates WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  },

  /**
   * Users with at least one reminder-eligible card on the given date.
   * Includes COMPLETED so today’s plan-add (auto-COMPLETED) still gets a reminder.
   */
  async listUserIdsWithPlannedOnDate(scheduledDate: string): Promise<string[]> {
    const pool = getPool();
    if (!pool) return [];

    const result = await pool.query<{ user_id: string }>(
      `SELECT DISTINCT user_id
       FROM workout_cards
       WHERE status IN ('PLANNED', 'COMPLETED', 'IN_PROGRESS')
         AND scheduled_date = $1::date`,
      [scheduledDate]
    );
    return result.rows.map((r) => r.user_id);
  },

  async countPlannedForUserOnDate(userId: string, scheduledDate: string): Promise<number> {
    const pool = getPool();
    if (!pool) return 0;

    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM workout_cards
       WHERE user_id = $1
         AND status IN ('PLANNED', 'COMPLETED', 'IN_PROGRESS')
         AND scheduled_date = $2::date`,
      [userId, scheduledDate]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10) || 0;
  },

  async hasReminderNotificationForDate(userId: string, dateKey: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;

    const result = await pool.query<{ id: string }>(
      `SELECT id FROM notifications
       WHERE user_id = $1
         AND type = 'push_schedule'
         AND payload->>'kind' = 'workout_card_reminder'
         AND payload->>'date' = $2
       LIMIT 1`,
      [userId, dateKey]
    );
    return Boolean(result.rows[0]);
  },
};
