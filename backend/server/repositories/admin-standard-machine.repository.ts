import type {
  AdminBrandMachineImageMeta,
  AdminStandardMachineImageMeta,
  AdminStandardMachineListQuery,
  AdminStandardMachineUpsertInput,
  BrandMachineGalleryImage,
  PaginatedResponse,
  StandardMachineImage,
  StandardMachineType,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';
import { buildPaginationMeta } from '../utils/pagination.util.js';
import { withCacheBust } from '../utils/cache-bust-url.js';
import { publicApiBase } from '../utils/public-api-base.js';

interface StandardTypeRow {
  id: string;
  code: string;
  name: Record<string, string>;
  description: Record<string, string> | null;
  primary_muscle_group: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  machine_count?: string | number;
  primary_image_url?: string | null;
  muscle_groups?: string[] | null;
  aliases?: string[] | null;
}

interface StandardImageRow {
  id: string;
  standard_type_id: string;
  image_url: string;
  thumbnail_url: string | null;
  image_type: string;
  display_order: number;
  is_primary: boolean;
  alt_text: Record<string, string> | null;
  source_type: string | null;
  source_url: string | null;
  copyright_note: string | null;
  license_note: string | null;
  original_filename: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  width: number | null;
  height: number | null;
  version: number | null;
  created_at: string;
  updated_at: string;
}

interface GalleryImageRow {
  id: string;
  machine_id: string;
  image_url: string;
  image_type: string;
  sort_order: number;
  is_primary: boolean;
  alt_text: Record<string, string> | null;
  source_type: string | null;
  source_url: string | null;
  copyright_note: string | null;
  license_note: string | null;
  original_filename: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  width: number | null;
  height: number | null;
  version: number | null;
  created_at: string;
  updated_at: string;
}

function standardMediaUrl(imageId: string, kind: 'main' | 'thumb' = 'main'): string {
  return `${publicApiBase()}/media/standard-machine-images/${encodeURIComponent(imageId)}/${kind}`;
}

function brandGalleryMediaUrl(imageId: string, kind: 'main' | 'thumb' = 'main'): string {
  return `${publicApiBase()}/media/machine-images/${encodeURIComponent(imageId)}/${kind}`;
}

function mapStandardType(
  row: StandardTypeRow,
  linkedBrandIds?: string[]
): StandardMachineType {
  const versionMatch = row.primary_image_url?.match(/[?&]v=(\d+)/);
  const version = versionMatch ? Number(versionMatch[1]) : undefined;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? undefined,
    primaryMuscleGroup: row.primary_muscle_group,
    muscleGroups: row.muscle_groups?.filter(Boolean) ?? undefined,
    aliases: row.aliases?.filter(Boolean) ?? undefined,
    sortOrder: row.sort_order ?? 0,
    isActive: row.is_active,
    primaryImageUrl: withCacheBust(row.primary_image_url ?? null, version ?? 0) ?? undefined,
    machineCount: row.machine_count != null ? Number(row.machine_count) : undefined,
    linkedBrandIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Idempotent fan-out: create brand machines linked to a standard type. */
async function linkBrandsToStandardType(
  typeId: string,
  brandIds: string[]
): Promise<number> {
  const pool = getPool();
  if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
  const unique = Array.from(new Set(brandIds.map((id) => id.trim()).filter(Boolean)));
  if (unique.length === 0) return 0;

  const result = await pool.query<{ id: string }>(
    `INSERT INTO machines (
       brand_id, code, name, muscle_group, machine_type, description,
       standard_type_id, sort_order, is_active,
       has_seat, has_back_pad, has_foot_plate, has_handle
     )
     SELECT
       b.id AS brand_id,
       LEFT(b.code || '_' || regexp_replace(t.code, '^STD_', ''), 80) AS code,
       jsonb_strip_nulls(
         jsonb_build_object(
           'ko',
           trim(BOTH FROM concat_ws(
             ' ',
             NULLIF(trim(COALESCE(b.name->>'ko', '')), ''),
             NULLIF(trim(COALESCE(t.name->>'ko', '')), '')
           )),
           'en',
           trim(BOTH FROM concat_ws(
             ' ',
             NULLIF(trim(COALESCE(b.name->>'en', b.code)), ''),
             NULLIF(trim(COALESCE(t.name->>'en', t.code)), '')
           )),
           'ja',
           NULLIF(trim(BOTH FROM concat_ws(
             ' ',
             NULLIF(trim(COALESCE(b.name->>'ja', '')), ''),
             NULLIF(trim(COALESCE(t.name->>'ja', '')), '')
           )), ''),
           'zh',
           NULLIF(trim(BOTH FROM concat_ws(
             ' ',
             NULLIF(trim(COALESCE(b.name->>'zh', '')), ''),
             NULLIF(trim(COALESCE(t.name->>'zh', '')), '')
           )), '')
         )
       ) AS name,
       t.primary_muscle_group AS muscle_group,
       CASE
         WHEN t.code = 'STD_SMITH_MACHINE' THEN 'smith'
         WHEN t.code IN (
           'STD_CABLE_CROSSOVER',
           'STD_DUAL_ADJUSTABLE_PULLEY',
           'STD_MULTI_JUNGLE_GYM',
           'STD_SEATED_CABLE'
         ) THEN 'cable'
         WHEN t.code IN ('STD_POWER_RACK', 'STD_HALF_RACK', 'STD_BARBELL_RACK') THEN 'free_weight'
         WHEN t.code LIKE '%PLATE_LOADED%'
           OR t.code IN (
             'STD_VIKING_PRESS',
             'STD_STANDING_CHEST_PRESS',
             'STD_MACHINE_PULLOVER',
             'STD_PENDULUM_SQUAT'
           ) THEN 'plate_loaded'
         ELSE 'selectorized'
       END AS machine_type,
       t.description AS description,
       t.id AS standard_type_id,
       t.sort_order AS sort_order,
       TRUE AS is_active,
       TRUE AS has_seat,
       FALSE AS has_back_pad,
       FALSE AS has_foot_plate,
       TRUE AS has_handle
     FROM brands b
     INNER JOIN standard_machine_types t ON t.id = $2
     WHERE b.id = ANY($1::uuid[])
       AND NOT EXISTS (
         SELECT 1 FROM machines m
         WHERE m.brand_id = b.id AND m.standard_type_id = t.id
       )
     ON CONFLICT (code) DO NOTHING
     RETURNING id`,
    [unique, typeId]
  );
  return result.rows.length;
}

function mapStandardImage(row: StandardImageRow): StandardMachineImage {
  const version = Number(row.version ?? 0);
  const url =
    withCacheBust(row.image_url || standardMediaUrl(row.id, 'main'), version) ??
    standardMediaUrl(row.id, 'main');
  return {
    id: row.id,
    standardTypeId: row.standard_type_id,
    imageUrl: url,
    thumbnailUrl: withCacheBust(row.thumbnail_url, version),
    imageType: row.image_type,
    displayOrder: row.display_order ?? 0,
    isPrimary: row.is_primary,
    altText: row.alt_text ?? undefined,
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    copyrightNote: row.copyright_note,
    licenseNote: row.license_note,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes != null ? Number(row.file_size_bytes) : null,
    width: row.width != null ? Number(row.width) : null,
    height: row.height != null ? Number(row.height) : null,
    version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGalleryImage(row: GalleryImageRow): BrandMachineGalleryImage {
  const version = Number(row.version ?? 0);
  const hasDurable = Boolean(row.mime_type);
  const baseUrl = hasDurable
    ? brandGalleryMediaUrl(row.id, 'main')
    : row.image_url;
  return {
    id: row.id,
    machineId: row.machine_id,
    imageUrl: withCacheBust(baseUrl, version) ?? baseUrl,
    imageType: row.image_type || 'other',
    sortOrder: row.sort_order ?? 0,
    isPrimary: row.is_primary,
    altText: row.alt_text ?? undefined,
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    copyrightNote: row.copyright_note,
    licenseNote: row.license_note,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes != null ? Number(row.file_size_bytes) : null,
    width: row.width != null ? Number(row.width) : null,
    height: row.height != null ? Number(row.height) : null,
    version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function replaceMuscleGroups(
  typeId: string,
  primary: string,
  extras?: string[]
): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  const groups = Array.from(
    new Set([primary, ...(extras ?? []).map((g) => g.trim()).filter(Boolean)])
  );
  await pool.query('DELETE FROM standard_machine_muscle_groups WHERE standard_type_id = $1', [
    typeId,
  ]);
  for (let i = 0; i < groups.length; i++) {
    const mg = groups[i]!;
    await pool.query(
      `INSERT INTO standard_machine_muscle_groups (standard_type_id, muscle_group, is_primary, sort_order)
       VALUES ($1, $2, $3, $4)`,
      [typeId, mg, mg === primary, i * 10]
    );
  }
}

async function replaceAliases(typeId: string, aliases?: string[]): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query('DELETE FROM standard_machine_aliases WHERE standard_type_id = $1', [typeId]);
  const cleaned = Array.from(
    new Set((aliases ?? []).map((a) => a.trim()).filter((a) => a.length > 0))
  );
  for (const alias of cleaned) {
    await pool.query(
      `INSERT INTO standard_machine_aliases (standard_type_id, alias)
       SELECT $1, $2
       WHERE NOT EXISTS (
         SELECT 1 FROM standard_machine_aliases a
         WHERE a.standard_type_id = $1 AND lower(a.alias) = lower($2)
       )`,
      [typeId, alias]
    );
  }
}

async function loadType(idOrCode: string): Promise<StandardMachineType | null> {
  const pool = getPool();
  if (!pool) return null;
  const result = await pool.query<StandardTypeRow>(
    `SELECT t.*,
            (
              SELECT CASE
                WHEN s.image_url IS NULL THEN NULL
                WHEN POSITION('?' IN s.image_url) > 0
                  THEN s.image_url || '&v=' || COALESCE(s.version, 0)::text
                ELSE s.image_url || '?v=' || COALESCE(s.version, 0)::text
              END
              FROM standard_machine_images s
              WHERE s.standard_type_id = t.id
              ORDER BY s.is_primary DESC, s.display_order ASC
              LIMIT 1
            ) AS primary_image_url,
            (SELECT COUNT(*)::int FROM machines m WHERE m.standard_type_id = t.id) AS machine_count
     FROM standard_machine_types t
     WHERE t.id::text = $1 OR t.code = $1`,
    [idOrCode]
  );
  const row = result.rows[0];
  if (!row) return null;

  const muscles = await pool.query<{ muscle_group: string }>(
    `SELECT muscle_group FROM standard_machine_muscle_groups
     WHERE standard_type_id = $1
     ORDER BY is_primary DESC, sort_order ASC`,
    [row.id]
  );
  const aliases = await pool.query<{ alias: string }>(
    `SELECT alias FROM standard_machine_aliases WHERE standard_type_id = $1 ORDER BY alias`,
    [row.id]
  );
  const linked = await pool.query<{ brand_id: string }>(
    `SELECT DISTINCT brand_id::text AS brand_id
     FROM machines
     WHERE standard_type_id = $1 AND brand_id IS NOT NULL
     ORDER BY brand_id::text`,
    [row.id]
  );

  return mapStandardType(
    {
      ...row,
      muscle_groups:
        muscles.rows.length > 0
          ? muscles.rows.map((r) => r.muscle_group)
          : [row.primary_muscle_group],
      aliases: aliases.rows.map((r) => r.alias),
    },
    linked.rows.map((r) => r.brand_id)
  );
}

export const adminStandardMachineRepository = {
  async list(query: AdminStandardMachineListQuery): Promise<PaginatedResponse<StandardMachineType>> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (query.q) {
      conditions.push(
        `(t.code ILIKE $${idx} OR t.name::text ILIKE $${idx} OR EXISTS (
           SELECT 1 FROM standard_machine_aliases a
           WHERE a.standard_type_id = t.id AND a.alias ILIKE $${idx}
         ))`
      );
      params.push(`%${query.q}%`);
      idx++;
    }
    if (query.muscleGroup) {
      conditions.push(
        `(t.primary_muscle_group = $${idx} OR EXISTS (
           SELECT 1 FROM standard_machine_muscle_groups mg
           WHERE mg.standard_type_id = t.id AND mg.muscle_group = $${idx}
         ))`
      );
      params.push(query.muscleGroup);
      idx++;
    }
    if (query.isActive !== undefined) {
      conditions.push(`t.is_active = $${idx++}`);
      params.push(query.isActive);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortMap: Record<string, string> = {
      name: `t.name->>'ko'`,
      createdAt: 't.created_at',
      sortOrder: 't.sort_order',
      code: 't.code',
    };
    const sortCol = sortMap[query.sort ?? 'sortOrder'] ?? 't.sort_order';
    const order = query.order === 'desc' ? 'DESC' : 'ASC';
    const limit = query.limit ?? 50;
    const page = query.page ?? 1;
    const offset = (page - 1) * limit;

    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM standard_machine_types t ${where}`,
      params
    );
    const total = Number(countResult.rows[0]?.count ?? 0);

    const result = await pool.query<StandardTypeRow>(
      `SELECT t.*,
              (
                SELECT CASE
                  WHEN s.image_url IS NULL THEN NULL
                  WHEN POSITION('?' IN s.image_url) > 0
                    THEN s.image_url || '&v=' || COALESCE(s.version, 0)::text
                  ELSE s.image_url || '?v=' || COALESCE(s.version, 0)::text
                END
                FROM standard_machine_images s
                WHERE s.standard_type_id = t.id
                ORDER BY s.is_primary DESC, s.display_order ASC
                LIMIT 1
              ) AS primary_image_url,
              (SELECT COUNT(*)::int FROM machines m WHERE m.standard_type_id = t.id) AS machine_count
       FROM standard_machine_types t
       ${where}
       ORDER BY ${sortCol} ${order}, t.code ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return {
      items: result.rows.map((row) =>
        mapStandardType({
          ...row,
          muscle_groups: [row.primary_muscle_group],
          aliases: [],
        })
      ),
      meta: buildPaginationMeta(page, limit, total),
    };
  },

  async get(id: string): Promise<StandardMachineType | null> {
    return loadType(id);
  },

  async create(input: AdminStandardMachineUpsertInput): Promise<StandardMachineType> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    try {
      const result = await pool.query<{ id: string }>(
        `INSERT INTO standard_machine_types (
           code, name, description, primary_muscle_group, sort_order, is_active
         ) VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id`,
        [
          input.code.trim().toUpperCase(),
          input.name,
          input.description ?? null,
          input.primaryMuscleGroup,
          input.sortOrder ?? 0,
          input.isActive ?? true,
        ]
      );
      const id = result.rows[0]!.id;
      await replaceMuscleGroups(id, input.primaryMuscleGroup, input.muscleGroups);
      await replaceAliases(id, input.aliases);
      if (input.brandIds?.length) {
        await linkBrandsToStandardType(id, input.brandIds);
      }
      const created = await loadType(id);
      if (!created) throw new AppError(500, 'CREATE_FAILED', 'Standard machine create failed');
      return created;
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === '23505') {
        throw new AppError(409, 'CODE_EXISTS', 'Standard machine code already exists');
      }
      throw err;
    }
  },

  async update(id: string, input: AdminStandardMachineUpsertInput): Promise<StandardMachineType> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await loadType(id);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Standard machine not found');

    try {
      await pool.query(
        `UPDATE standard_machine_types SET
           code = $2,
           name = $3,
           description = $4,
           primary_muscle_group = $5,
           sort_order = $6,
           is_active = $7,
           updated_at = NOW()
         WHERE id = $1`,
        [
          existing.id,
          input.code.trim().toUpperCase(),
          input.name,
          input.description ?? null,
          input.primaryMuscleGroup,
          input.sortOrder ?? 0,
          input.isActive ?? true,
        ]
      );
      await replaceMuscleGroups(existing.id, input.primaryMuscleGroup, input.muscleGroups);
      if (input.aliases !== undefined) {
        await replaceAliases(existing.id, input.aliases);
      }
      if (input.brandIds?.length) {
        await linkBrandsToStandardType(existing.id, input.brandIds);
      }
      const updated = await loadType(existing.id);
      if (!updated) throw new AppError(500, 'UPDATE_FAILED', 'Standard machine update failed');
      return updated;
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === '23505') {
        throw new AppError(409, 'CODE_EXISTS', 'Standard machine code already exists');
      }
      throw err;
    }
  },

  async setActive(id: string, isActive: boolean): Promise<StandardMachineType> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await loadType(id);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Standard machine not found');
    await pool.query(
      'UPDATE standard_machine_types SET is_active = $2, updated_at = NOW() WHERE id = $1',
      [existing.id, isActive]
    );
    const updated = await loadType(existing.id);
    if (!updated) throw new AppError(500, 'UPDATE_FAILED', 'Standard machine update failed');
    return updated;
  },

  async delete(id: string): Promise<{ deleted: boolean; deactivated: boolean }> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await loadType(id);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Standard machine not found');

    const linked = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM machines WHERE standard_type_id = $1',
      [existing.id]
    );
    if (Number(linked.rows[0]?.count ?? 0) > 0) {
      await pool.query(
        'UPDATE standard_machine_types SET is_active = FALSE, updated_at = NOW() WHERE id = $1',
        [existing.id]
      );
      return { deleted: false, deactivated: true };
    }

    await pool.query('DELETE FROM standard_machine_types WHERE id = $1', [existing.id]);
    return { deleted: true, deactivated: false };
  },

  async listImages(standardTypeId: string): Promise<StandardMachineImage[]> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const type = await loadType(standardTypeId);
    if (!type) throw new AppError(404, 'NOT_FOUND', 'Standard machine not found');
    const result = await pool.query<StandardImageRow>(
      `SELECT id, standard_type_id, image_url, thumbnail_url, image_type, display_order, is_primary,
              alt_text, source_type, source_url, copyright_note, license_note, original_filename,
              mime_type, file_size_bytes, width, height, version, created_at, updated_at
       FROM standard_machine_images
       WHERE standard_type_id = $1
       ORDER BY is_primary DESC, display_order ASC, created_at ASC`,
      [type.id]
    );
    return result.rows.map(mapStandardImage);
  },

  async insertImage(params: {
    standardTypeId: string;
    imageUrl: string;
    thumbnailUrl?: string | null;
    imageType: string;
    isPrimary: boolean;
    displayOrder: number;
    sourceType?: string | null;
    sourceUrl?: string | null;
    copyrightNote?: string | null;
    licenseNote?: string | null;
    originalFilename?: string | null;
    mimeType?: string | null;
    fileSizeBytes?: number | null;
    width?: number | null;
    height?: number | null;
    imageData?: Buffer | null;
    thumbnailData?: Buffer | null;
  }): Promise<StandardMachineImage> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const type = await loadType(params.standardTypeId);
    if (!type) throw new AppError(404, 'NOT_FOUND', 'Standard machine not found');

    if (params.isPrimary) {
      await pool.query(
        'UPDATE standard_machine_images SET is_primary = FALSE WHERE standard_type_id = $1',
        [type.id]
      );
    }

    const orderResult = await pool.query<{ max: number | null }>(
      'SELECT MAX(display_order) AS max FROM standard_machine_images WHERE standard_type_id = $1',
      [type.id]
    );
    const displayOrder =
      params.displayOrder ??
      (orderResult.rows[0]?.max == null ? 0 : Number(orderResult.rows[0].max) + 10);

    const result = await pool.query<{ id: string }>(
      `INSERT INTO standard_machine_images (
         standard_type_id, image_url, thumbnail_url, image_type, display_order, is_primary,
         source_type, source_url, copyright_note, license_note, original_filename, mime_type,
         file_size_bytes, width, height, image_data, thumbnail_data, version
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,1)
       RETURNING id`,
      [
        type.id,
        params.imageUrl,
        params.thumbnailUrl ?? null,
        params.imageType,
        displayOrder,
        params.isPrimary,
        params.sourceType ?? 'uploaded',
        params.sourceUrl || null,
        params.copyrightNote || null,
        params.licenseNote || null,
        params.originalFilename ?? null,
        params.mimeType ?? null,
        params.fileSizeBytes ?? null,
        params.width ?? null,
        params.height ?? null,
        params.imageData ?? null,
        params.thumbnailData ?? null,
      ]
    );

    const imageId = result.rows[0]!.id;
    const mediaUrl = standardMediaUrl(imageId, 'main');
    await pool.query(
      'UPDATE standard_machine_images SET image_url = $2, thumbnail_url = $3 WHERE id = $1',
      [imageId, mediaUrl, standardMediaUrl(imageId, 'thumb')]
    );

    const images = await this.listImages(type.id);
    const created = images.find((img) => img.id === imageId);
    if (!created) throw new AppError(500, 'CREATE_FAILED', 'Image create failed');
    return created;
  },

  async updateImageMeta(
    imageId: string,
    meta: AdminStandardMachineImageMeta
  ): Promise<StandardMachineImage> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await pool.query<{ id: string; standard_type_id: string }>(
      'SELECT id, standard_type_id FROM standard_machine_images WHERE id = $1',
      [imageId]
    );
    if (!existing.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Image not found');
    const typeId = existing.rows[0].standard_type_id;

    if (meta.isPrimary === true) {
      await pool.query(
        'UPDATE standard_machine_images SET is_primary = FALSE WHERE standard_type_id = $1',
        [typeId]
      );
    }

    await pool.query(
      `UPDATE standard_machine_images SET
         image_type = COALESCE($2, image_type),
         is_primary = COALESCE($3, is_primary),
         display_order = COALESCE($4, display_order),
         source_type = COALESCE($5, source_type),
         source_url = COALESCE($6, source_url),
         copyright_note = COALESCE($7, copyright_note),
         license_note = COALESCE($8, license_note),
         updated_at = NOW()
       WHERE id = $1`,
      [
        imageId,
        meta.imageType ?? null,
        meta.isPrimary ?? null,
        meta.displayOrder ?? null,
        meta.sourceType ?? null,
        meta.sourceUrl === '' ? null : (meta.sourceUrl ?? null),
        meta.copyrightNote ?? null,
        meta.licenseNote ?? null,
      ]
    );

    const images = await this.listImages(typeId);
    const updated = images.find((img) => img.id === imageId);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Image not found');
    return updated;
  },

  async reorderImages(standardTypeId: string, orderedIds: string[]): Promise<StandardMachineImage[]> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const type = await loadType(standardTypeId);
    if (!type) throw new AppError(404, 'NOT_FOUND', 'Standard machine not found');

    for (let i = 0; i < orderedIds.length; i++) {
      await pool.query(
        `UPDATE standard_machine_images
         SET display_order = $3, is_primary = ($4::boolean), updated_at = NOW()
         WHERE id = $1 AND standard_type_id = $2`,
        [orderedIds[i], type.id, i * 10, i === 0]
      );
    }
    return this.listImages(type.id);
  },

  async deleteImage(imageId: string): Promise<{ deleted: true }> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const result = await pool.query('DELETE FROM standard_machine_images WHERE id = $1 RETURNING id', [
      imageId,
    ]);
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Image not found');
    return { deleted: true };
  },

  async getImageBlob(imageId: string, kind: 'main' | 'thumb') {
    const pool = getPool();
    if (!pool) return null;
    const col = kind === 'thumb' ? 'thumbnail_data' : 'image_data';
    const result = await pool.query<{
      data: Buffer | null;
      mime_type: string | null;
      version: number | null;
    }>(
      `SELECT ${col} AS data, mime_type, version FROM standard_machine_images WHERE id = $1`,
      [imageId]
    );
    const row = result.rows[0];
    if (!row?.data) return null;
    return {
      buffer: row.data,
      mimeType: row.mime_type || 'image/jpeg',
      version: Number(row.version ?? 0),
    };
  },

  /* ---- Brand machine gallery (machine_images) ---- */

  async listBrandMachineImages(machineId: string): Promise<BrandMachineGalleryImage[]> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const machine = await pool.query<{ id: string }>(
      'SELECT id FROM machines WHERE id::text = $1 OR code = $1',
      [machineId]
    );
    if (!machine.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Machine not found');
    const result = await pool.query<GalleryImageRow>(
      `SELECT id, machine_id, image_url, COALESCE(image_type, 'other') AS image_type,
              sort_order, is_primary, alt_text, source_type, source_url, copyright_note,
              license_note, original_filename, mime_type, file_size_bytes, width, height,
              version, created_at, updated_at
       FROM machine_images
       WHERE machine_id = $1
       ORDER BY is_primary DESC, sort_order ASC, created_at ASC`,
      [machine.rows[0].id]
    );
    return result.rows.map(mapGalleryImage);
  },

  async insertBrandMachineImage(params: {
    machineId: string;
    imageUrl: string;
    imageType: string;
    isPrimary: boolean;
    sortOrder?: number;
    sourceType?: string | null;
    sourceUrl?: string | null;
    copyrightNote?: string | null;
    licenseNote?: string | null;
    originalFilename?: string | null;
    mimeType?: string | null;
    fileSizeBytes?: number | null;
    width?: number | null;
    height?: number | null;
    imageData?: Buffer | null;
    thumbnailData?: Buffer | null;
  }): Promise<BrandMachineGalleryImage> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const machine = await pool.query<{ id: string }>(
      'SELECT id FROM machines WHERE id::text = $1 OR code = $1',
      [params.machineId]
    );
    if (!machine.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Machine not found');
    const mid = machine.rows[0].id;

    if (params.isPrimary) {
      await pool.query('UPDATE machine_images SET is_primary = FALSE WHERE machine_id = $1', [mid]);
    }

    const orderResult = await pool.query<{ max: number | null }>(
      'SELECT MAX(sort_order) AS max FROM machine_images WHERE machine_id = $1',
      [mid]
    );
    const sortOrder =
      params.sortOrder ??
      (orderResult.rows[0]?.max == null ? 0 : Number(orderResult.rows[0].max) + 10);

    const result = await pool.query<{ id: string }>(
      `INSERT INTO machine_images (
         machine_id, image_url, image_type, sort_order, is_primary,
         source_type, source_url, copyright_note, license_note, original_filename,
         mime_type, file_size_bytes, width, height, image_data, thumbnail_data, version
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,1)
       RETURNING id`,
      [
        mid,
        params.imageUrl,
        params.imageType,
        sortOrder,
        params.isPrimary,
        params.sourceType ?? 'uploaded',
        params.sourceUrl || null,
        params.copyrightNote || null,
        params.licenseNote || null,
        params.originalFilename ?? null,
        params.mimeType ?? null,
        params.fileSizeBytes ?? null,
        params.width ?? null,
        params.height ?? null,
        params.imageData ?? null,
        params.thumbnailData ?? null,
      ]
    );

    const imageId = result.rows[0]!.id;
    const mediaUrl = brandGalleryMediaUrl(imageId, 'main');
    await pool.query('UPDATE machine_images SET image_url = $2 WHERE id = $1', [imageId, mediaUrl]);

    const images = await this.listBrandMachineImages(mid);
    const created = images.find((img) => img.id === imageId);
    if (!created) throw new AppError(500, 'CREATE_FAILED', 'Image create failed');
    return created;
  },

  async updateBrandMachineImageMeta(
    imageId: string,
    meta: AdminBrandMachineImageMeta
  ): Promise<BrandMachineGalleryImage> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await pool.query<{ id: string; machine_id: string }>(
      'SELECT id, machine_id FROM machine_images WHERE id = $1',
      [imageId]
    );
    if (!existing.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Image not found');
    const machineId = existing.rows[0].machine_id;

    if (meta.isPrimary === true) {
      await pool.query('UPDATE machine_images SET is_primary = FALSE WHERE machine_id = $1', [
        machineId,
      ]);
    }

    await pool.query(
      `UPDATE machine_images SET
         image_type = COALESCE($2, image_type),
         is_primary = COALESCE($3, is_primary),
         sort_order = COALESCE($4, sort_order),
         source_type = COALESCE($5, source_type),
         source_url = COALESCE($6, source_url),
         copyright_note = COALESCE($7, copyright_note),
         license_note = COALESCE($8, license_note),
         updated_at = NOW()
       WHERE id = $1`,
      [
        imageId,
        meta.imageType ?? null,
        meta.isPrimary ?? null,
        meta.sortOrder ?? null,
        meta.sourceType ?? null,
        meta.sourceUrl === '' ? null : (meta.sourceUrl ?? null),
        meta.copyrightNote ?? null,
        meta.licenseNote ?? null,
      ]
    );

    const images = await this.listBrandMachineImages(machineId);
    const updated = images.find((img) => img.id === imageId);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Image not found');
    return updated;
  },

  async reorderBrandMachineImages(
    machineId: string,
    orderedIds: string[]
  ): Promise<BrandMachineGalleryImage[]> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const machine = await pool.query<{ id: string }>(
      'SELECT id FROM machines WHERE id::text = $1 OR code = $1',
      [machineId]
    );
    if (!machine.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Machine not found');
    const mid = machine.rows[0].id;

    for (let i = 0; i < orderedIds.length; i++) {
      await pool.query(
        `UPDATE machine_images
         SET sort_order = $3, is_primary = ($4::boolean), updated_at = NOW()
         WHERE id = $1 AND machine_id = $2`,
        [orderedIds[i], mid, i * 10, i === 0]
      );
    }
    return this.listBrandMachineImages(mid);
  },

  async deleteBrandMachineImage(imageId: string): Promise<{ deleted: true }> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const result = await pool.query('DELETE FROM machine_images WHERE id = $1 RETURNING id', [
      imageId,
    ]);
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Image not found');
    return { deleted: true };
  },

  async getBrandMachineImageBlob(
    imageId: string,
    kind: 'main' | 'thumb'
  ): Promise<{ buffer: Buffer; mimeType: string; version: number } | null> {
    const pool = getPool();
    if (!pool) return null;
    const col = kind === 'thumb' ? 'thumbnail_data' : 'image_data';
    const result = await pool.query<{
      data: Buffer | null;
      mime_type: string | null;
      version: number | null;
    }>(`SELECT ${col} AS data, mime_type, version FROM machine_images WHERE id = $1`, [imageId]);
    const row = result.rows[0];
    if (!row?.data) {
      // Fall back to main if thumb missing
      if (kind === 'thumb') return this.getBrandMachineImageBlob(imageId, 'main');
      return null;
    }
    return {
      buffer: row.data,
      mimeType: row.mime_type || 'image/jpeg',
      version: Number(row.version ?? 0),
    };
  },

  /** Options for admin machine form dropdown. */
  async listOptions(activeOnly = true): Promise<
    Array<{ id: string; code: string; name: Record<string, string>; primaryMuscleGroup: string }>
  > {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query<{
      id: string;
      code: string;
      name: Record<string, string>;
      primary_muscle_group: string;
    }>(
      `SELECT id, code, name, primary_muscle_group
       FROM standard_machine_types
       ${activeOnly ? 'WHERE is_active = TRUE' : ''}
       ORDER BY sort_order ASC, code ASC`
    );
    return result.rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      primaryMuscleGroup: row.primary_muscle_group,
    }));
  },
};
