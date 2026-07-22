import type { MuscleGroupImageAsset, MuscleGroupImageKey } from '@machinefit/shared';
import { TARGET_MUSCLE_GROUPS } from '@machinefit/shared';
import { getPool } from '../config/database.js';

type MuscleGroupImageRow = {
  muscle_group: string;
  image_url: string;
  thumbnail_url: string | null;
  storage_path: string | null;
  thumbnail_storage_path: string | null;
  original_filename: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  width: number | null;
  height: number | null;
  version: number;
  created_at: Date | string;
  updated_at: Date | string;
};

function withCacheBust(url: string | null, version: number): string | null {
  if (!url) return null;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${version}`;
}

function emptyAsset(muscleGroup: MuscleGroupImageKey): MuscleGroupImageAsset {
  return {
    muscleGroup,
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
  };
}

function mapRow(row: MuscleGroupImageRow): MuscleGroupImageAsset {
  const version = Number(row.version ?? 1);
  return {
    muscleGroup: row.muscle_group as MuscleGroupImageKey,
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
  };
}

export type MuscleGroupImageRecord = MuscleGroupImageAsset & {
  storagePath: string | null;
  thumbnailStoragePath: string | null;
  rawImageUrl: string | null;
  rawThumbnailUrl: string | null;
};

function mapRecord(row: MuscleGroupImageRow): MuscleGroupImageRecord {
  const asset = mapRow(row);
  return {
    ...asset,
    storagePath: row.storage_path,
    thumbnailStoragePath: row.thumbnail_storage_path,
    rawImageUrl: row.image_url,
    rawThumbnailUrl: row.thumbnail_url,
  };
}

export const muscleGroupImageRepository = {
  async list(): Promise<MuscleGroupImageAsset[]> {
    const pool = getPool();
    if (!pool) {
      return TARGET_MUSCLE_GROUPS.map((group) => emptyAsset(group));
    }

    const result = await pool.query<MuscleGroupImageRow>(
      `SELECT * FROM muscle_group_images ORDER BY muscle_group ASC`
    );
    const byGroup = new Map(result.rows.map((row) => [row.muscle_group, mapRow(row)]));
    return TARGET_MUSCLE_GROUPS.map((group) => byGroup.get(group) ?? emptyAsset(group));
  },

  async get(muscleGroup: MuscleGroupImageKey): Promise<MuscleGroupImageRecord | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<MuscleGroupImageRow>(
      `SELECT * FROM muscle_group_images WHERE muscle_group = $1 LIMIT 1`,
      [muscleGroup]
    );
    const row = result.rows[0];
    return row ? mapRecord(row) : null;
  },

  async upsert(input: {
    muscleGroup: MuscleGroupImageKey;
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
  }): Promise<MuscleGroupImageAsset> {
    const pool = getPool();
    if (!pool) {
      return {
        ...emptyAsset(input.muscleGroup),
        imageUrl: withCacheBust(input.imageUrl, input.version),
        thumbnailUrl: withCacheBust(input.thumbnailUrl, input.version),
        originalFilename: input.originalFilename,
        mimeType: input.mimeType,
        fileSizeBytes: input.fileSizeBytes,
        width: input.width,
        height: input.height,
        version: input.version,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const result = await pool.query<MuscleGroupImageRow>(
      `INSERT INTO muscle_group_images (
         muscle_group, image_url, thumbnail_url, storage_path, thumbnail_storage_path,
         original_filename, mime_type, file_size_bytes, width, height, version,
         created_at, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5,
         $6, $7, $8, $9, $10, $11,
         NOW(), NOW()
       )
       ON CONFLICT (muscle_group) DO UPDATE SET
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
         updated_at = NOW()
       RETURNING *`,
      [
        input.muscleGroup,
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
      ]
    );
    return mapRow(result.rows[0]);
  },

  async remove(muscleGroup: MuscleGroupImageKey): Promise<MuscleGroupImageRecord | null> {
    const pool = getPool();
    if (!pool) return null;
    const existing = await this.get(muscleGroup);
    if (!existing) return null;
    await pool.query(`DELETE FROM muscle_group_images WHERE muscle_group = $1`, [muscleGroup]);
    return existing;
  },
};
