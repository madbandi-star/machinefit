import type {
  MachineCoverBrandOption,
  MachineCoverImageAsset,
  MachineCoverImagesPage,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';

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
};

function withCacheBust(url: string | null, version: number): string | null {
  if (!url) return null;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${version}`;
}

function mapAsset(row: CoverRow): MachineCoverImageAsset {
  const version = Number(row.version ?? 0);
  const hasCustomImage = Boolean(row.image_url);
  return {
    machineId: row.machine_id,
    machineCode: row.machine_code,
    machineName: row.machine_name,
    brandCode: row.brand_code,
    brandName: row.brand_name,
    muscleGroup: row.muscle_group,
    imageUrl: withCacheBust(row.image_url, version),
    thumbnailUrl: withCacheBust(row.thumbnail_url, version),
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes != null ? Number(row.file_size_bytes) : null,
    width: row.width != null ? Number(row.width) : null,
    height: row.height != null ? Number(row.height) : null,
    version,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    hasCustomImage,
  };
}

export type MachineCoverRecord = {
  machineId: string;
  machineCode: string;
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
        `(m.code ILIKE $${params.length} OR m.name::text ILIKE $${params.length} OR b.code ILIKE $${params.length})`
      );
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM machines m
       JOIN brands b ON b.id = m.brand_id
       ${whereSql}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);
    const offset = (filters.page - 1) * filters.pageSize;
    params.push(filters.pageSize, offset);

    const result = await pool.query<CoverRow>(
      `SELECT
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
         c.updated_at
       FROM machines m
       JOIN brands b ON b.id = m.brand_id
       LEFT JOIN machine_cover_images c ON c.machine_id = m.id
       ${whereSql}
       ORDER BY b.code ASC, m.code ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      items: result.rows.map(mapAsset),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  },

  async getByCode(machineCode: string): Promise<MachineCoverRecord | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<{
      machine_id: string;
      machine_code: string;
      storage_path: string | null;
      thumbnail_storage_path: string | null;
      version: number;
    }>(
      `SELECT machine_id, machine_code, storage_path, thumbnail_storage_path, version
       FROM machine_cover_images
       WHERE machine_code = $1
       LIMIT 1`,
      [machineCode]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      machineId: row.machine_id,
      machineCode: row.machine_code,
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

  async getBlob(
    machineCode: string,
    kind: 'main' | 'thumb'
  ): Promise<{ data: Buffer; mimeType: string; version: number } | null> {
    const pool = getPool();
    if (!pool) return null;
    const column = kind === 'thumb' ? 'thumbnail_data' : 'image_data';
    const result = await pool.query<{
      blob: Buffer | null;
      mime_type: string | null;
      version: number;
    }>(
      `SELECT ${column} AS blob, mime_type, version
       FROM machine_cover_images
       WHERE machine_code = $1
       LIMIT 1`,
      [machineCode]
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

    await pool.query(
      `INSERT INTO machine_cover_images (
         machine_id, machine_code, image_url, thumbnail_url, storage_path, thumbnail_storage_path,
         original_filename, mime_type, file_size_bytes, width, height, version,
         image_data, thumbnail_data, created_at, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10, $11, $12,
         $13, $14, NOW(), NOW()
       )
       ON CONFLICT (machine_id) DO UPDATE SET
         machine_code = EXCLUDED.machine_code,
         image_url = EXCLUDED.image_url,
         thumbnail_url = EXCLUDED.thumbnail_url,
         storage_path = EXCLUDED.storage_path,
         thumbnail_storage_path = EXCLUDED.thumbnail_storage_path,
         original_filename = EXCLUDED.original_filename,
         mime_type = EXCLUDED.mime_type,
         file_size_bytes = EXCLUDED.file_size_bytes,
         width = EXCLUDED.width,
         height = EXCLUDED.height,
         version = EXCLUDED.version,
         image_data = EXCLUDED.image_data,
         thumbnail_data = EXCLUDED.thumbnail_data,
         updated_at = NOW()`,
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

    // Prefer admin cover in the existing primaryImageUrl resolution chain.
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
      [input.machineId, input.imageUrl]
    );

    const listed = await this.list({ q: input.machineCode, page: 1, pageSize: 1 });
    const found = listed.items.find((item) => item.machineCode === input.machineCode);
    if (!found) {
      throw new Error('Failed to load uploaded machine cover');
    }
    return found;
  },

  async remove(machineCode: string): Promise<MachineCoverRecord | null> {
    const pool = getPool();
    if (!pool) return null;
    const existing = await this.getByCode(machineCode);
    if (!existing) return null;

    await pool.query(`DELETE FROM machine_cover_images WHERE machine_code = $1`, [machineCode]);
    await pool.query(
      `DELETE FROM machine_images
       WHERE machine_id = $1
         AND image_url LIKE '%/media/machine-covers/%'`,
      [existing.machineId]
    );
    // Restore next available catalog/other image as primary when present.
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
    return existing;
  },
};
