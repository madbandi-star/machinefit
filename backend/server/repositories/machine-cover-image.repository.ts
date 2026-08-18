import type {
  MachineCoverBrandOption,
  MachineCoverImageAsset,
  MachineCoverImageVariant,
  MachineCoverImagesPage,
  TargetMuscleGroup,
} from '@machinefit/shared';
import { isFreeWeightMachineCode, TARGET_MUSCLE_GROUPS } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { storageService } from '../services/storage.service.js';
import { isDirectObjectUrl } from '../utils/media-cdn.js';
import { withCacheBust } from '../utils/cache-bust-url.js';
import { supportsMachineCoverMuscleVariants } from '../utils/machine-cover-schema.util.js';

function normalizeCoverUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace(/^https?:\/\/localhost(?::\d+)?\/api\/v1/i, 'https://machinefit.onrender.com/api/v1');
}

type CoverRow = {
  machine_id: string;
  machine_code: string;
  machine_name: Record<string, string>;
  brand_code: string;
  brand_name: Record<string, string>;
  muscle_group: string;
  image_url: string | null;
  thumbnail_url: string | null;
  original_filename: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  width: number | null;
  height: number | null;
  version: number | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  variants_json?: unknown;
};

type VariantRow = {
  target_muscle_group: string;
  image_url: string | null;
  thumbnail_url: string | null;
  original_filename: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  width: number | null;
  height: number | null;
  version: number | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
};

function mapVariant(row: VariantRow): MachineCoverImageVariant {
  const version = Number(row.version ?? 0);
  return {
    targetMuscleGroup: row.target_muscle_group as TargetMuscleGroup,
    imageUrl: withCacheBust(normalizeCoverUrl(row.image_url), version),
    thumbnailUrl: withCacheBust(normalizeCoverUrl(row.thumbnail_url), version),
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes != null ? Number(row.file_size_bytes) : null,
    width: row.width != null ? Number(row.width) : null,
    height: row.height != null ? Number(row.height) : null,
    version,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    hasCustomImage: Boolean(row.image_url),
  };
}

function parseVariants(raw: unknown): MachineCoverImageVariant[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (row): row is VariantRow =>
        Boolean(row && typeof row === 'object' && 'target_muscle_group' in row)
    )
    .map(mapVariant);
}

function emptyVariants(): MachineCoverImageVariant[] {
  return TARGET_MUSCLE_GROUPS.map((targetMuscleGroup) => ({
    targetMuscleGroup,
    imageUrl: null,
    thumbnailUrl: null,
    originalFilename: null,
    mimeType: null,
    fileSizeBytes: null,
    width: null,
    height: null,
    version: 0,
    createdAt: null,
    updatedAt: null,
    hasCustomImage: false,
  }));
}

function mergeVariantSlots(existing: MachineCoverImageVariant[]): MachineCoverImageVariant[] {
  const byMuscle = new Map(existing.map((v) => [v.targetMuscleGroup, v]));
  return TARGET_MUSCLE_GROUPS.map(
    (muscle) => byMuscle.get(muscle) ?? emptyVariants().find((v) => v.targetMuscleGroup === muscle)!
  );
}

function mapAsset(row: CoverRow): MachineCoverImageAsset {
  const version = Number(row.version ?? 0);
  const hasCustomImage = Boolean(row.image_url);
  const supportsMuscleVariants = isFreeWeightMachineCode(row.machine_code);
  const muscleVariants = supportsMuscleVariants
    ? mergeVariantSlots(parseVariants(row.variants_json))
    : undefined;
  return {
    machineId: row.machine_id,
    machineCode: row.machine_code,
    machineName: row.machine_name,
    brandCode: row.brand_code,
    brandName: row.brand_name,
    muscleGroup: row.muscle_group,
    targetMuscleGroup: null,
    imageUrl: withCacheBust(normalizeCoverUrl(row.image_url), version),
    thumbnailUrl: withCacheBust(normalizeCoverUrl(row.thumbnail_url), version),
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes != null ? Number(row.file_size_bytes) : null,
    width: row.width != null ? Number(row.width) : null,
    height: row.height != null ? Number(row.height) : null,
    version,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    hasCustomImage,
    supportsMuscleVariants,
    muscleVariants,
  };
}

export type MachineCoverRecord = {
  machineId: string;
  machineCode: string;
  targetMuscleGroup: string | null;
  storagePath: string | null;
  thumbnailStoragePath: string | null;
  version: number;
};

export const machineCoverImageRepository = {
  async listBrands(): Promise<MachineCoverBrandOption[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query<{ code: string; name: Record<string, string> }>(
      `SELECT code, name FROM brands WHERE is_active = TRUE ORDER BY code ASC`
    );
    return result.rows.map((row) => ({ code: row.code, name: row.name }));
  },

  async list(filters: {
    q?: string;
    brandCode?: string;
    page: number;
    pageSize: number;
  }): Promise<MachineCoverImagesPage> {
    const pool = getPool();
    if (!pool) {
      return { items: [], total: 0, page: filters.page, pageSize: filters.pageSize };
    }

    const where: string[] = ['m.is_active = TRUE'];
    const params: unknown[] = [];
    if (filters.brandCode) {
      params.push(filters.brandCode);
      where.push(`b.code = $${params.length}`);
    }
    if (filters.q?.trim()) {
      params.push(`%${filters.q.trim()}%`);
      where.push(
        `(m.code ILIKE $${params.length} OR m.name::text ILIKE $${params.length} OR b.code ILIKE $${params.length} OR b.name::text ILIKE $${params.length})`
      );
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const offset = (filters.page - 1) * filters.pageSize;
    const listParams = [...params, filters.pageSize, offset];

    // COUNT + schema capability check in parallel (same result set as sequential).
    const [countResult, muscleVariantsReady] = await Promise.all([
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM machines m
         JOIN brands b ON b.id = m.brand_id
         ${whereSql}`,
        params
      ),
      supportsMachineCoverMuscleVariants(pool),
    ]);
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const result = await pool.query<CoverRow>(
      muscleVariantsReady
        ? `SELECT
             m.id AS machine_id,
             m.code AS machine_code,
             m.name AS machine_name,
             b.code AS brand_code,
             b.name AS brand_name,
             m.muscle_group,
             c.image_url,
             c.thumbnail_url,
             c.original_filename,
             c.mime_type,
             c.file_size_bytes,
             c.width,
             c.height,
             c.version,
             c.created_at,
             c.updated_at,
             COALESCE(v.variants_json, '[]'::json) AS variants_json
           FROM machines m
           JOIN brands b ON b.id = m.brand_id
           LEFT JOIN machine_cover_images c
             ON c.machine_id = m.id AND c.target_muscle_group IS NULL
           LEFT JOIN LATERAL (
             SELECT json_agg(
               json_build_object(
                 'target_muscle_group', mv.target_muscle_group,
                 'image_url', mv.image_url,
                 'thumbnail_url', mv.thumbnail_url,
                 'original_filename', mv.original_filename,
                 'mime_type', mv.mime_type,
                 'file_size_bytes', mv.file_size_bytes,
                 'width', mv.width,
                 'height', mv.height,
                 'version', mv.version,
                 'created_at', mv.created_at,
                 'updated_at', mv.updated_at
               )
               ORDER BY mv.target_muscle_group
             ) AS variants_json
             FROM machine_cover_images mv
             WHERE mv.machine_id = m.id
               AND mv.target_muscle_group IS NOT NULL
           ) v ON TRUE
           ${whereSql}
           ORDER BY b.code ASC, m.code ASC
           LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`
        : `SELECT
             m.id AS machine_id,
             m.code AS machine_code,
             m.name AS machine_name,
             b.code AS brand_code,
             b.name AS brand_name,
             m.muscle_group,
             c.image_url,
             c.thumbnail_url,
             c.original_filename,
             c.mime_type,
             c.file_size_bytes,
             c.width,
             c.height,
             c.version,
             c.created_at,
             c.updated_at,
             '[]'::json AS variants_json
           FROM machines m
           JOIN brands b ON b.id = m.brand_id
           LEFT JOIN machine_cover_images c ON c.machine_id = m.id
           ${whereSql}
           ORDER BY b.code ASC, m.code ASC
           LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams
    );

    return {
      items: result.rows.map((row) => {
        const asset = mapAsset(row);
        if (!muscleVariantsReady) {
          asset.supportsMuscleVariants = false;
          asset.muscleVariants = undefined;
        }
        return asset;
      }),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  },

  async getByCode(
    machineCode: string,
    targetMuscleGroup?: string | null
  ): Promise<MachineCoverRecord | null> {
    const pool = getPool();
    if (!pool) return null;
    const muscle = targetMuscleGroup?.trim() || null;
    const muscleVariantsReady = await supportsMachineCoverMuscleVariants(pool);
    if (muscle && !muscleVariantsReady) return null;

    const result = await pool.query<{
      machine_id: string;
      machine_code: string;
      target_muscle_group: string | null;
      storage_path: string | null;
      thumbnail_storage_path: string | null;
      version: number;
    }>(
      muscleVariantsReady
        ? muscle
          ? `SELECT machine_id, machine_code, target_muscle_group, storage_path, thumbnail_storage_path, version
             FROM machine_cover_images
             WHERE machine_code = $1 AND target_muscle_group = $2
             LIMIT 1`
          : `SELECT machine_id, machine_code, target_muscle_group, storage_path, thumbnail_storage_path, version
             FROM machine_cover_images
             WHERE machine_code = $1 AND target_muscle_group IS NULL
             LIMIT 1`
        : `SELECT machine_id, machine_code, NULL::varchar AS target_muscle_group, storage_path, thumbnail_storage_path, version
           FROM machine_cover_images
           WHERE machine_code = $1
           LIMIT 1`,
      muscle && muscleVariantsReady ? [machineCode, muscle] : [machineCode]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      machineId: row.machine_id,
      machineCode: row.machine_code,
      targetMuscleGroup: row.target_muscle_group,
      storagePath: row.storage_path,
      thumbnailStoragePath: row.thumbnail_storage_path,
      version: Number(row.version ?? 1),
    };
  },

  async findMachine(machineCode: string): Promise<{ id: string; code: string } | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<{ id: string; code: string }>(
      `SELECT id, code FROM machines WHERE code = $1 LIMIT 1`,
      [machineCode]
    );
    return result.rows[0] ?? null;
  },

  async getBlobMeta(
    machineCode: string,
    kind: 'main' | 'thumb',
    targetMuscleGroup?: string | null
  ): Promise<{
    mimeType: string;
    version: number;
    hasBlob: boolean;
    storagePath: string | null;
    objectUrl: string | null;
  } | null> {
    const pool = getPool();
    if (!pool) return null;
    const column = kind === 'thumb' ? 'thumbnail_data' : 'image_data';
    const pathCol = kind === 'thumb' ? 'thumbnail_storage_path' : 'storage_path';
    const urlCol = kind === 'thumb' ? 'thumbnail_url' : 'image_url';
    const muscle = targetMuscleGroup?.trim() || null;
    const muscleVariantsReady = await supportsMachineCoverMuscleVariants(pool);
    if (muscle && !muscleVariantsReady) return null;

    const result = await pool.query<{
      mime_type: string | null;
      version: number;
      has_blob: boolean;
      storage_path: string | null;
      object_url: string | null;
    }>(
      muscleVariantsReady
        ? muscle
          ? `SELECT mime_type, version, (${column} IS NOT NULL) AS has_blob,
                  ${pathCol} AS storage_path, ${urlCol} AS object_url
             FROM machine_cover_images
             WHERE machine_code = $1 AND target_muscle_group = $2
             LIMIT 1`
          : `SELECT mime_type, version, (${column} IS NOT NULL) AS has_blob,
                  ${pathCol} AS storage_path, ${urlCol} AS object_url
             FROM machine_cover_images
             WHERE machine_code = $1 AND target_muscle_group IS NULL
             LIMIT 1`
        : `SELECT mime_type, version, (${column} IS NOT NULL) AS has_blob,
                ${pathCol} AS storage_path, ${urlCol} AS object_url
           FROM machine_cover_images
           WHERE machine_code = $1
           LIMIT 1`,
      muscle && muscleVariantsReady ? [machineCode, muscle] : [machineCode]
    );
    const row = result.rows[0];
    if (!row) return null;
    const storagePath = row.storage_path;
    let objectUrl = row.object_url;
    if (!isDirectObjectUrl(objectUrl) && storagePath && !storagePath.startsWith('db:')) {
      objectUrl = storageService.machineCoverPublicUrl(storagePath);
    }
    if (!row.has_blob && !isDirectObjectUrl(objectUrl)) return null;
    return {
      mimeType: row.mime_type || 'image/webp',
      version: Number(row.version ?? 1),
      hasBlob: Boolean(row.has_blob),
      storagePath,
      objectUrl: isDirectObjectUrl(objectUrl) ? objectUrl : null,
    };
  },

  async getBlob(
    machineCode: string,
    kind: 'main' | 'thumb',
    targetMuscleGroup?: string | null
  ): Promise<{ data: Buffer; mimeType: string; version: number } | null> {
    const pool = getPool();
    if (!pool) return null;
    const column = kind === 'thumb' ? 'thumbnail_data' : 'image_data';
    const muscle = targetMuscleGroup?.trim() || null;
    const muscleVariantsReady = await supportsMachineCoverMuscleVariants(pool);
    if (muscle && !muscleVariantsReady) return null;

    const result = await pool.query<{
      blob: Buffer | null;
      mime_type: string | null;
      version: number;
    }>(
      muscleVariantsReady
        ? muscle
          ? `SELECT ${column} AS blob, mime_type, version
             FROM machine_cover_images
             WHERE machine_code = $1 AND target_muscle_group = $2
             LIMIT 1`
          : `SELECT ${column} AS blob, mime_type, version
             FROM machine_cover_images
             WHERE machine_code = $1 AND target_muscle_group IS NULL
             LIMIT 1`
        : `SELECT ${column} AS blob, mime_type, version
           FROM machine_cover_images
           WHERE machine_code = $1
           LIMIT 1`,
      muscle && muscleVariantsReady ? [machineCode, muscle] : [machineCode]
    );
    const row = result.rows[0];
    if (!row?.blob) return null;
    return {
      data: Buffer.isBuffer(row.blob) ? row.blob : Buffer.from(row.blob),
      mimeType: row.mime_type || 'image/webp',
      version: Number(row.version ?? 1),
    };
  },

  async upsert(input: {
    machineId: string;
    machineCode: string;
    targetMuscleGroup?: string | null;
    imageUrl: string;
    thumbnailUrl: string | null;
    storagePath: string | null;
    thumbnailStoragePath: string | null;
    originalFilename: string | null;
    mimeType: string | null;
    fileSizeBytes: number | null;
    width: number | null;
    height: number | null;
    version: number;
    imageData: Buffer;
    thumbnailData: Buffer;
  }): Promise<MachineCoverImageAsset> {
    const pool = getPool();
    if (!pool) {
      throw new Error('DATABASE_URL required for machine cover upload');
    }

    const muscle = input.targetMuscleGroup?.trim() || null;
    const muscleVariantsReady = await supportsMachineCoverMuscleVariants(pool);
    if (muscle && !muscleVariantsReady) {
      throw new Error('Migration 083 required for per-muscle machine covers');
    }
    const existing = await this.getByCode(input.machineCode, muscle);

    if (existing) {
      if (muscleVariantsReady) {
        await pool.query(
          `UPDATE machine_cover_images SET
             machine_code = $2,
             image_url = $3,
             thumbnail_url = $4,
             storage_path = $5,
             thumbnail_storage_path = $6,
             original_filename = $7,
             mime_type = $8,
             file_size_bytes = $9,
             width = $10,
             height = $11,
             version = $12,
             image_data = $13,
             thumbnail_data = $14,
             updated_at = NOW()
           WHERE machine_id = $1
             AND (
               ($15::text IS NULL AND target_muscle_group IS NULL)
               OR target_muscle_group = $15
             )`,
          [
            input.machineId,
            input.machineCode,
            input.imageUrl,
            input.thumbnailUrl,
            input.storagePath,
            input.thumbnailStoragePath,
            input.originalFilename,
            input.mimeType,
            input.fileSizeBytes,
            input.width,
            input.height,
            input.version,
            input.imageData,
            input.thumbnailData,
            muscle,
          ]
        );
      } else {
        await pool.query(
          `UPDATE machine_cover_images SET
             machine_code = $2,
             image_url = $3,
             thumbnail_url = $4,
             storage_path = $5,
             thumbnail_storage_path = $6,
             original_filename = $7,
             mime_type = $8,
             file_size_bytes = $9,
             width = $10,
             height = $11,
             version = $12,
             image_data = $13,
             thumbnail_data = $14,
             updated_at = NOW()
           WHERE machine_id = $1`,
          [
            input.machineId,
            input.machineCode,
            input.imageUrl,
            input.thumbnailUrl,
            input.storagePath,
            input.thumbnailStoragePath,
            input.originalFilename,
            input.mimeType,
            input.fileSizeBytes,
            input.width,
            input.height,
            input.version,
            input.imageData,
            input.thumbnailData,
          ]
        );
      }
    } else if (muscleVariantsReady) {
      await pool.query(
        `INSERT INTO machine_cover_images (
           machine_id, machine_code, target_muscle_group, image_url, thumbnail_url, storage_path, thumbnail_storage_path,
           original_filename, mime_type, file_size_bytes, width, height, version,
           image_data, thumbnail_data, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7,
           $8, $9, $10, $11, $12, $13,
           $14, $15, NOW(), NOW()
         )`,
        [
          input.machineId,
          input.machineCode,
          muscle,
          input.imageUrl,
          input.thumbnailUrl,
          input.storagePath,
          input.thumbnailStoragePath,
          input.originalFilename,
          input.mimeType,
          input.fileSizeBytes,
          input.width,
          input.height,
          input.version,
          input.imageData,
          input.thumbnailData,
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO machine_cover_images (
           machine_id, machine_code, image_url, thumbnail_url, storage_path, thumbnail_storage_path,
           original_filename, mime_type, file_size_bytes, width, height, version,
           image_data, thumbnail_data, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6,
           $7, $8, $9, $10, $11, $12,
           $13, $14, NOW(), NOW()
         )`,
        [
          input.machineId,
          input.machineCode,
          input.imageUrl,
          input.thumbnailUrl,
          input.storagePath,
          input.thumbnailStoragePath,
          input.originalFilename,
          input.mimeType,
          input.fileSizeBytes,
          input.width,
          input.height,
          input.version,
          input.imageData,
          input.thumbnailData,
        ]
      );
    }

    if (!muscle) {
      // Prefer default admin cover in the existing primaryImageUrl resolution chain.
      await pool.query(`UPDATE machine_images SET is_primary = FALSE WHERE machine_id = $1`, [
        input.machineId,
      ]);
      await pool.query(
        `DELETE FROM machine_images
         WHERE machine_id = $1
           AND image_url LIKE '%/media/machine-covers/%'`,
        [input.machineId]
      );
      await pool.query(
        `INSERT INTO machine_images (machine_id, image_url, sort_order, is_primary)
         VALUES ($1, $2, 0, TRUE)`,
        [input.machineId, withCacheBust(input.imageUrl, input.version)]
      );
    }

    // Prefer exact code lookup — fuzzy list(q) can miss or time out after large blob writes.
    const found = await this.getAssetByCode(input.machineCode);
    if (!found) {
      throw new Error('Failed to load uploaded machine cover');
    }
    return found;
  },

  async getAssetByCode(machineCode: string): Promise<MachineCoverImageAsset | null> {
    const pool = getPool();
    if (!pool) return null;
    const code = machineCode.trim();
    if (!code) return null;

    // Exact code lookup — avoids ILIKE list scan used previously.
    const muscleVariantsReady = await supportsMachineCoverMuscleVariants(pool);
    const result = await pool.query<CoverRow>(
      muscleVariantsReady
        ? `SELECT
             m.id AS machine_id,
             m.code AS machine_code,
             m.name AS machine_name,
             b.code AS brand_code,
             b.name AS brand_name,
             m.muscle_group,
             c.image_url,
             c.thumbnail_url,
             c.original_filename,
             c.mime_type,
             c.file_size_bytes,
             c.width,
             c.height,
             c.version,
             c.created_at,
             c.updated_at,
             COALESCE(v.variants_json, '[]'::json) AS variants_json
           FROM machines m
           JOIN brands b ON b.id = m.brand_id
           LEFT JOIN machine_cover_images c
             ON c.machine_id = m.id AND c.target_muscle_group IS NULL
           LEFT JOIN LATERAL (
             SELECT json_agg(
               json_build_object(
                 'target_muscle_group', mv.target_muscle_group,
                 'image_url', mv.image_url,
                 'thumbnail_url', mv.thumbnail_url,
                 'original_filename', mv.original_filename,
                 'mime_type', mv.mime_type,
                 'file_size_bytes', mv.file_size_bytes,
                 'width', mv.width,
                 'height', mv.height,
                 'version', mv.version,
                 'created_at', mv.created_at,
                 'updated_at', mv.updated_at
               )
               ORDER BY mv.target_muscle_group
             ) AS variants_json
             FROM machine_cover_images mv
             WHERE mv.machine_id = m.id
               AND mv.target_muscle_group IS NOT NULL
           ) v ON TRUE
           WHERE m.is_active = TRUE AND m.code = $1
           LIMIT 1`
        : `SELECT
             m.id AS machine_id,
             m.code AS machine_code,
             m.name AS machine_name,
             b.code AS brand_code,
             b.name AS brand_name,
             m.muscle_group,
             c.image_url,
             c.thumbnail_url,
             c.original_filename,
             c.mime_type,
             c.file_size_bytes,
             c.width,
             c.height,
             c.version,
             c.created_at,
             c.updated_at,
             '[]'::json AS variants_json
           FROM machines m
           JOIN brands b ON b.id = m.brand_id
           LEFT JOIN machine_cover_images c ON c.machine_id = m.id
           WHERE m.is_active = TRUE AND m.code = $1
           LIMIT 1`,
      [code]
    );
    const row = result.rows[0];
    if (!row) return null;
    const asset = mapAsset(row);
    if (!muscleVariantsReady) {
      asset.supportsMuscleVariants = false;
      asset.muscleVariants = undefined;
    }
    return asset;
  },

  async remove(
    machineCode: string,
    targetMuscleGroup?: string | null
  ): Promise<MachineCoverRecord | null> {
    const pool = getPool();
    if (!pool) return null;
    const existing = await this.getByCode(machineCode, targetMuscleGroup);
    if (!existing) return null;

    const muscle = targetMuscleGroup?.trim() || null;
    const muscleVariantsReady = await supportsMachineCoverMuscleVariants(pool);
    if (muscle) {
      if (!muscleVariantsReady) return null;
      await pool.query(
        `DELETE FROM machine_cover_images WHERE machine_code = $1 AND target_muscle_group = $2`,
        [machineCode, muscle]
      );
    } else if (muscleVariantsReady) {
      await pool.query(
        `DELETE FROM machine_cover_images WHERE machine_code = $1 AND target_muscle_group IS NULL`,
        [machineCode]
      );
      await pool.query(
        `DELETE FROM machine_images
         WHERE machine_id = $1
           AND image_url LIKE '%/media/machine-covers/%'`,
        [existing.machineId]
      );
      await pool.query(
        `UPDATE machine_images mi
         SET is_primary = TRUE
         WHERE mi.id = (
           SELECT id FROM machine_images
           WHERE machine_id = $1
           ORDER BY sort_order ASC, created_at ASC
           LIMIT 1
         )`,
        [existing.machineId]
      );
    } else {
      await pool.query(`DELETE FROM machine_cover_images WHERE machine_code = $1`, [machineCode]);
      await pool.query(
        `DELETE FROM machine_images
         WHERE machine_id = $1
           AND image_url LIKE '%/media/machine-covers/%'`,
        [existing.machineId]
      );
      await pool.query(
        `UPDATE machine_images mi
         SET is_primary = TRUE
         WHERE mi.id = (
           SELECT id FROM machine_images
           WHERE machine_id = $1
           ORDER BY sort_order ASC, created_at ASC
           LIMIT 1
         )`,
        [existing.machineId]
      );
    }
    return existing;
  },
};
