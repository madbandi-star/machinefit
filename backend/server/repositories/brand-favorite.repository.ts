import type { Locale, LocalizedString } from '@machinefit/shared';
import { getPool } from '../config/database.js';

export interface FavoriteBrandRow {
  id: string;
  brandId: string;
  brandCode: string;
  brandName: LocalizedString;
  logoUrl?: string;
  countryCode?: string;
  createdAt: string;
}

export const brandFavoriteRepository = {
  async listByUser(userId: string): Promise<FavoriteBrandRow[]> {
    const pool = getPool();
    if (!pool) return [];

    const result = await pool.query<{
      id: string;
      brand_id: string;
      brand_code: string;
      brand_name: LocalizedString;
      logo_url: string | null;
      country_code: string | null;
      created_at: string;
    }>(
      `SELECT f.id, f.brand_id, f.created_at,
              b.code AS brand_code, b.name AS brand_name, b.logo_url,
              c.code AS country_code
       FROM user_favorite_brands f
       JOIN brands b ON b.id = f.brand_id
       LEFT JOIN countries c ON c.id = b.country_id
       WHERE f.user_id = $1
         AND b.is_active = TRUE
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      brandId: row.brand_id,
      brandCode: row.brand_code,
      brandName: row.brand_name,
      logoUrl: row.logo_url ?? undefined,
      countryCode: row.country_code ?? undefined,
      createdAt: row.created_at,
    }));
  },

  async listBrandIds(userId: string): Promise<string[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query<{ brand_id: string }>(
      `SELECT f.brand_id
       FROM user_favorite_brands f
       JOIN brands b ON b.id = f.brand_id
       WHERE f.user_id = $1 AND b.is_active = TRUE
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return result.rows.map((r) => r.brand_id);
  },

  async add(userId: string, brandId: string): Promise<FavoriteBrandRow> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');

    const brand = await pool.query<{
      id: string;
      code: string;
      name: LocalizedString;
      logo_url: string | null;
      country_code: string | null;
      is_active: boolean;
    }>(
      `SELECT b.id, b.code, b.name, b.logo_url, b.is_active, c.code AS country_code
       FROM brands b
       LEFT JOIN countries c ON c.id = b.country_id
       WHERE b.id = $1`,
      [brandId]
    );
    const brandRow = brand.rows[0];
    if (!brandRow || !brandRow.is_active) {
      throw Object.assign(new Error('Brand not found'), { code: 'NOT_FOUND' });
    }

    const result = await pool.query<{ id: string; created_at: string }>(
      `INSERT INTO user_favorite_brands (user_id, brand_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, brand_id) DO UPDATE SET updated_at = NOW()
       RETURNING id, created_at`,
      [userId, brandId]
    );

    const row = result.rows[0];
    if (!row) throw new Error('Failed to add brand favorite');

    return {
      id: row.id,
      brandId: brandRow.id,
      brandCode: brandRow.code,
      brandName: brandRow.name,
      logoUrl: brandRow.logo_url ?? undefined,
      countryCode: brandRow.country_code ?? undefined,
      createdAt: row.created_at,
    };
  },

  async removeByBrandId(userId: string, brandId: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    const result = await pool.query(
      `DELETE FROM user_favorite_brands WHERE user_id = $1 AND brand_id = $2`,
      [userId, brandId]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async countByBrand(_locale: Locale = 'en'): Promise<{ brandId: string; brandCode: string; count: number }[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query<{ brand_id: string; brand_code: string; cnt: string }>(
      `SELECT b.id AS brand_id, b.code AS brand_code, COUNT(f.id)::text AS cnt
       FROM brands b
       LEFT JOIN user_favorite_brands f ON f.brand_id = b.id
       WHERE b.is_active = TRUE
       GROUP BY b.id, b.code
       HAVING COUNT(f.id) > 0
       ORDER BY COUNT(f.id) DESC`
    );
    return result.rows.map((r) => ({
      brandId: r.brand_id,
      brandCode: r.brand_code,
      count: Number(r.cnt) || 0,
    }));
  },
};
