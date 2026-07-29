import { getPool } from '../config/database.js';

export type BrandAssetKind = 'logo' | 'hero';

type BrandAssetRow = {
  brand_id: string;
  brand_code: string;
  logo_url: string | null;
  logo_mime_type: string | null;
  logo_version: number | null;
  image_url: string | null;
  image_mime_type: string | null;
  image_version: number | null;
};

export type BrandAssetMeta = {
  brandId: string;
  brandCode: string;
  logoUrl: string | null;
  logoMimeType: string | null;
  logoVersion: number;
  imageUrl: string | null;
  imageMimeType: string | null;
  imageVersion: number;
};

function mapMeta(row: BrandAssetRow): BrandAssetMeta {
  return {
    brandId: row.brand_id,
    brandCode: row.brand_code,
    logoUrl: row.logo_url,
    logoMimeType: row.logo_mime_type,
    logoVersion: Number(row.logo_version ?? 0),
    imageUrl: row.image_url,
    imageMimeType: row.image_mime_type,
    imageVersion: Number(row.image_version ?? 0),
  };
}

const META_COLUMNS = `
  brand_id, brand_code,
  logo_url, logo_mime_type, logo_version,
  image_url, image_mime_type, image_version
`;

export const brandAssetRepository = {
  async getByBrandId(brandId: string): Promise<BrandAssetMeta | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<BrandAssetRow>(
      `SELECT ${META_COLUMNS} FROM brand_assets WHERE brand_id = $1 LIMIT 1`,
      [brandId]
    );
    return result.rows[0] ? mapMeta(result.rows[0]) : null;
  },

  async getByCode(brandCode: string): Promise<BrandAssetMeta | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<BrandAssetRow>(
      `SELECT ${META_COLUMNS} FROM brand_assets WHERE UPPER(brand_code) = UPPER($1) LIMIT 1`,
      [brandCode]
    );
    return result.rows[0] ? mapMeta(result.rows[0]) : null;
  },

  async getBlob(
    brandCode: string,
    kind: BrandAssetKind
  ): Promise<{ data: Buffer; mimeType: string; version: number } | null> {
    const pool = getPool();
    if (!pool) return null;
    const dataCol = kind === 'logo' ? 'logo_data' : 'image_data';
    const mimeCol = kind === 'logo' ? 'logo_mime_type' : 'image_mime_type';
    const versionCol = kind === 'logo' ? 'logo_version' : 'image_version';
    const result = await pool.query<{
      blob: Buffer | null;
      mime_type: string | null;
      version: number | null;
    }>(
      `SELECT ${dataCol} AS blob, ${mimeCol} AS mime_type, ${versionCol} AS version
       FROM brand_assets
       WHERE UPPER(brand_code) = UPPER($1)
       LIMIT 1`,
      [brandCode]
    );
    const row = result.rows[0];
    if (!row?.blob) return null;
    return {
      data: Buffer.isBuffer(row.blob) ? row.blob : Buffer.from(row.blob),
      mimeType: row.mime_type || 'image/webp',
      version: Number(row.version ?? 0),
    };
  },

  async upsertLogo(input: {
    brandId: string;
    brandCode: string;
    logoUrl: string;
    mimeType: string;
    version: number;
    data: Buffer;
  }): Promise<BrandAssetMeta> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');
    const result = await pool.query<BrandAssetRow>(
      `INSERT INTO brand_assets (
         brand_id, brand_code, logo_url, logo_mime_type, logo_version, logo_data,
         created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (brand_id) DO UPDATE SET
         brand_code = EXCLUDED.brand_code,
         logo_url = EXCLUDED.logo_url,
         logo_mime_type = EXCLUDED.logo_mime_type,
         logo_version = EXCLUDED.logo_version,
         logo_data = EXCLUDED.logo_data,
         updated_at = NOW()
       RETURNING ${META_COLUMNS}`,
      [
        input.brandId,
        input.brandCode,
        input.logoUrl,
        input.mimeType,
        input.version,
        input.data,
      ]
    );
    return mapMeta(result.rows[0]);
  },

  async upsertHero(input: {
    brandId: string;
    brandCode: string;
    imageUrl: string;
    mimeType: string;
    version: number;
    data: Buffer;
  }): Promise<BrandAssetMeta> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');
    const result = await pool.query<BrandAssetRow>(
      `INSERT INTO brand_assets (
         brand_id, brand_code, image_url, image_mime_type, image_version, image_data,
         created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (brand_id) DO UPDATE SET
         brand_code = EXCLUDED.brand_code,
         image_url = EXCLUDED.image_url,
         image_mime_type = EXCLUDED.image_mime_type,
         image_version = EXCLUDED.image_version,
         image_data = EXCLUDED.image_data,
         updated_at = NOW()
       RETURNING ${META_COLUMNS}`,
      [
        input.brandId,
        input.brandCode,
        input.imageUrl,
        input.mimeType,
        input.version,
        input.data,
      ]
    );
    return mapMeta(result.rows[0]);
  },

  async clearLogo(brandId: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `UPDATE brand_assets
       SET logo_url = NULL, logo_mime_type = NULL, logo_version = 0, logo_data = NULL,
           updated_at = NOW()
       WHERE brand_id = $1`,
      [brandId]
    );
  },

  async clearHero(brandId: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `UPDATE brand_assets
       SET image_url = NULL, image_mime_type = NULL, image_version = 0, image_data = NULL,
           updated_at = NOW()
       WHERE brand_id = $1`,
      [brandId]
    );
  },
};
