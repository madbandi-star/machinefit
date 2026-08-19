import type {
  AdminBrandListQuery,
  AdminBrandUpsertInput,
  AdminMachineListQuery,
  AdminMachineTipsUpdateInput,
  AdminMachineUpsertInput,
  Brand,
  Machine,
  PaginatedResponse,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';
import { buildPaginationMeta } from '../utils/pagination.util.js';
import { primaryImageCoalesceSql } from '../utils/primary-image-sql.js';

/** Prefer cover URL with version bust so re-uploads are not stuck on immutable browser cache. */
const PRIMARY_IMAGE_URL_SQL = primaryImageCoalesceSql('m');

type LocalizedBag = Record<string, string>;

/** Keep ja/zh (and any extra locales) when admin form only posts ko/en. */
function mergeLocalizedName(
  existing: LocalizedBag | null | undefined,
  incoming: { ko: string; en: string; ja?: string; zh?: string }
): LocalizedBag {
  const next: LocalizedBag = { ...(existing ?? {}) };
  next.ko = incoming.ko;
  next.en = incoming.en;
  if (incoming.ja !== undefined) {
    if (incoming.ja) next.ja = incoming.ja;
    else delete next.ja;
  }
  if (incoming.zh !== undefined) {
    if (incoming.zh) next.zh = incoming.zh;
    else delete next.zh;
  }
  return next;
}

/**
 * FE often omits description when ko/en are empty, or sends only ko/en.
 * Preserve ja/zh; when omitted entirely, clear only ko/en (editable fields).
 */
function mergeLocalizedDescription(
  existing: LocalizedBag | null | undefined,
  incoming: { ko?: string; en?: string; ja?: string; zh?: string } | undefined
): LocalizedBag | null {
  const next: LocalizedBag = { ...(existing ?? {}) };
  if (incoming === undefined) {
    delete next.ko;
    delete next.en;
  } else {
    for (const key of ['ko', 'en', 'ja', 'zh'] as const) {
      if (Object.prototype.hasOwnProperty.call(incoming, key)) {
        const value = incoming[key];
        if (value) next[key] = value;
        else delete next[key];
      }
    }
  }
  return Object.keys(next).length > 0 ? next : null;
}

interface BrandAdminRow {
  id: string;
  code: string;
  name: Record<string, string>;
  description: Record<string, string> | null;
  logo_url: string | null;
  image_url: string | null;
  website_url: string | null;
  country_id: string | null;
  country_code: string | null;
  sort_order: number;
  is_active: boolean;
  is_default_favorite?: boolean;
  created_at: string;
  updated_at: string;
  machine_count: string | number;
  favorite_count?: string | number;
}

interface MachineAdminRow {
  id: string;
  brand_id: string;
  code: string;
  name: Record<string, string>;
  brand_name: Record<string, string> | null;
  brand_code: string | null;
  standard_type_id?: string | null;
  standard_type_code?: string | null;
  standard_type_name?: Record<string, string> | null;
  model_code?: string | null;
  muscle_group: string;
  machine_type: string;
  description: Record<string, string> | null;
  tips: Record<string, string[]> | null;
  warnings: Record<string, string[]> | null;
  pro_tips: Record<string, string[]> | null;
  has_seat: boolean;
  has_back_pad: boolean;
  has_foot_plate: boolean;
  has_handle: boolean;
  rom_type: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  primary_image_url: string | null;
  bodyweight_load_factor?: string | number | null;
}

function mapBrand(row: BrandAdminRow): Brand {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    imageUrl: row.image_url ?? undefined,
    websiteUrl: row.website_url ?? undefined,
    countryId: row.country_id ?? undefined,
    countryCode: row.country_code ?? undefined,
    sortOrder: row.sort_order ?? 0,
    isActive: row.is_active,
    isDefaultFavorite: Boolean(row.is_default_favorite),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    machineCount: Number(row.machine_count ?? 0),
    favoriteCount: Number(row.favorite_count ?? 0),
  };
}

function mapMachine(row: MachineAdminRow): Machine {
  return {
    id: row.id,
    brandId: row.brand_id,
    code: row.code,
    name: row.name,
    brandName: row.brand_name ?? undefined,
    brandCode: row.brand_code ?? undefined,
    standardTypeId: row.standard_type_id ?? null,
    standardTypeCode: row.standard_type_code ?? null,
    standardTypeName: row.standard_type_name ?? null,
    modelCode: row.model_code ?? null,
    muscleGroup: row.muscle_group,
    machineType: row.machine_type,
    description: row.description ?? undefined,
    tips: row.tips ?? undefined,
    warnings: row.warnings ?? undefined,
    proTips: row.pro_tips ?? undefined,
    hasSeat: row.has_seat,
    hasBackPad: row.has_back_pad,
    hasFootPlate: row.has_foot_plate,
    hasHandle: row.has_handle,
    romType: row.rom_type ?? undefined,
    sortOrder: row.sort_order ?? 0,
    isActive: row.is_active,
    bodyweightLoadFactor:
      row.bodyweight_load_factor == null || row.bodyweight_load_factor === ''
        ? null
        : Number(row.bodyweight_load_factor),
    primaryImageUrl: row.primary_image_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolveCountryId(countryCode?: string): Promise<string | null> {
  if (!countryCode) return null;
  const pool = getPool();
  if (!pool) return null;
  const result = await pool.query<{ id: string }>(
    'SELECT id FROM countries WHERE UPPER(code) = UPPER($1) LIMIT 1',
    [countryCode]
  );
  if (!result.rows[0]) {
    throw new AppError(400, 'INVALID_COUNTRY', `Unknown country code: ${countryCode}`);
  }
  return result.rows[0].id;
}

export const adminCatalogRepository = {
  async listBrands(query: AdminBrandListQuery): Promise<PaginatedResponse<Brand>> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (query.q?.trim()) {
      conditions.push(
        `(b.code ILIKE $${idx} OR b.name->>'ko' ILIKE $${idx} OR b.name->>'en' ILIKE $${idx})`
      );
      params.push(`%${query.q.trim()}%`);
      idx++;
    }
    if (query.isActive !== undefined) {
      conditions.push(`b.is_active = $${idx++}`);
      params.push(query.isActive);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortCol =
      query.sort === 'name'
        ? `b.name->>'en'`
        : query.sort === 'createdAt'
          ? 'b.created_at'
          : 'b.sort_order';
    const sortDir = query.order === 'desc' ? 'DESC' : 'ASC';

    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM brands b ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);
    const page = query.page;
    const limit = query.limit;
    const offset = (page - 1) * limit;

    const result = await pool.query<BrandAdminRow>(
      `SELECT b.*, c.code AS country_code,
              (SELECT COUNT(*) FROM machines m WHERE m.brand_id = b.id) AS machine_count,
              (SELECT COUNT(*) FROM user_favorite_brands f WHERE f.brand_id = b.id) AS favorite_count
       FROM brands b
       LEFT JOIN countries c ON c.id = b.country_id
       ${where}
       ORDER BY ${sortCol} ${sortDir}, b.code ASC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, limit, offset]
    );

    return {
      items: result.rows.map(mapBrand),
      meta: buildPaginationMeta(page, limit, total),
    };
  },

  async getBrand(id: string): Promise<Brand | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<BrandAdminRow>(
      `SELECT b.*, c.code AS country_code,
              (SELECT COUNT(*) FROM machines m WHERE m.brand_id = b.id) AS machine_count,
              (SELECT COUNT(*) FROM user_favorite_brands f WHERE f.brand_id = b.id) AS favorite_count
       FROM brands b
       LEFT JOIN countries c ON c.id = b.country_id
       WHERE b.id::text = $1 OR b.code = $1`,
      [id]
    );
    return result.rows[0] ? mapBrand(result.rows[0]) : null;
  },

  async createBrand(input: AdminBrandUpsertInput): Promise<Brand> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');

    const countryId = await resolveCountryId(input.countryCode || undefined);
    try {
      const result = await pool.query<{ id: string }>(
        `INSERT INTO brands (
           code, name, description, website_url,
           country_id, sort_order, is_active, is_default_favorite
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id`,
        [
          input.code.trim().toUpperCase(),
          input.name,
          input.description ?? null,
          input.websiteUrl || null,
          countryId,
          input.sortOrder ?? 0,
          input.isActive ?? true,
          input.isDefaultFavorite ?? false,
        ]
      );
      const created = await this.getBrand(result.rows[0].id);
      if (!created) throw new AppError(500, 'CREATE_FAILED', 'Brand create failed');
      return created;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === '23505') throw new AppError(409, 'CODE_EXISTS', 'Brand code already exists');
      throw err;
    }
  },

  async updateBrand(id: string, input: AdminBrandUpsertInput): Promise<Brand> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await this.getBrand(id);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Brand not found');

    const countryId = await resolveCountryId(input.countryCode || undefined);
    try {
      await pool.query(
        `UPDATE brands SET
           code = $2,
           name = $3,
           description = $4,
           website_url = $5,
           country_id = $6,
           sort_order = $7,
           is_active = $8,
           is_default_favorite = $9,
           updated_at = NOW()
         WHERE id = $1`,
        [
          existing.id,
          input.code.trim().toUpperCase(),
          input.name,
          input.description ?? null,
          input.websiteUrl || null,
          countryId,
          input.sortOrder ?? 0,
          input.isActive ?? true,
          input.isDefaultFavorite ?? false,
        ]
      );
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === '23505') throw new AppError(409, 'CODE_EXISTS', 'Brand code already exists');
      throw err;
    }
    const updated = await this.getBrand(existing.id);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Brand not found');
    return updated;
  },

  async setBrandActive(id: string, isActive: boolean): Promise<Brand> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await this.getBrand(id);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Brand not found');
    await pool.query('UPDATE brands SET is_active = $2, updated_at = NOW() WHERE id = $1', [
      existing.id,
      isActive,
    ]);
    const updated = await this.getBrand(existing.id);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Brand not found');
    return updated;
  },

  async setBrandDefaultFavorite(id: string, isDefaultFavorite: boolean): Promise<Brand> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await this.getBrand(id);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Brand not found');
    await pool.query(
      'UPDATE brands SET is_default_favorite = $2, updated_at = NOW() WHERE id = $1',
      [existing.id, isDefaultFavorite]
    );
    const updated = await this.getBrand(existing.id);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Brand not found');
    return updated;
  },

  /**
   * Reorder brands by moving one row in the global sort_order sequence, then
   * renumber 0..n-1 so display order stays dense and stable.
   */
  async moveBrandSort(
    id: string,
    direction: 'up' | 'down' | 'top' | 'bottom'
  ): Promise<Brand> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await this.getBrand(id);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Brand not found');

    const { rows } = await pool.query<{ id: string }>(
      `SELECT id FROM brands ORDER BY sort_order ASC, code ASC`
    );
    const ids = rows.map((r) => r.id);
    const from = ids.indexOf(existing.id);
    if (from < 0) throw new AppError(404, 'NOT_FOUND', 'Brand not found');

    let to = from;
    if (direction === 'up') to = Math.max(0, from - 1);
    else if (direction === 'down') to = Math.min(ids.length - 1, from + 1);
    else if (direction === 'top') to = 0;
    else to = ids.length - 1;

    if (to === from) {
      return existing;
    }

    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < ids.length; i++) {
        await client.query(
          `UPDATE brands SET sort_order = $2, updated_at = NOW() WHERE id = $1`,
          [ids[i], i]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const updated = await this.getBrand(existing.id);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Brand not found');
    return updated;
  },

  async deleteBrand(id: string): Promise<{ deleted: true }> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await this.getBrand(id);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Brand not found');
    if ((existing.machineCount ?? 0) > 0) {
      throw new AppError(
        409,
        'BRAND_HAS_MACHINES',
        'Cannot delete a brand that still has machines. Deactivate it instead.'
      );
    }
    try {
      await pool.query('DELETE FROM brands WHERE id = $1', [existing.id]);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === '23503') {
        throw new AppError(
          409,
          'BRAND_IN_USE',
          'Cannot delete this brand because it is referenced elsewhere. Deactivate it instead.'
        );
      }
      throw err;
    }
    return { deleted: true };
  },

  async listMachines(query: AdminMachineListQuery): Promise<PaginatedResponse<Machine>> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (query.q?.trim()) {
      conditions.push(
        `(m.code ILIKE $${idx} OR m.name->>'ko' ILIKE $${idx} OR m.name->>'en' ILIKE $${idx}
          OR b.code ILIKE $${idx} OR b.name->>'ko' ILIKE $${idx} OR b.name->>'en' ILIKE $${idx})`
      );
      params.push(`%${query.q.trim()}%`);
      idx++;
    }
    if (query.brandId) {
      conditions.push(`m.brand_id = $${idx++}`);
      params.push(query.brandId);
    }
    if (query.brandCode) {
      conditions.push(`b.code = $${idx++}`);
      params.push(query.brandCode);
    }
    if (query.muscleGroup) {
      conditions.push(`m.muscle_group = $${idx++}`);
      params.push(query.muscleGroup);
    }
    if (query.isActive !== undefined) {
      conditions.push(`m.is_active = $${idx++}`);
      params.push(query.isActive);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortCol =
      query.sort === 'name'
        ? `m.name->>'en'`
        : query.sort === 'createdAt'
          ? 'm.created_at'
          : query.sort === 'code'
            ? 'm.code'
            : 'm.sort_order';
    const sortDir = query.order === 'desc' ? 'DESC' : 'ASC';

    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM machines m
       JOIN brands b ON b.id = m.brand_id
       ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);
    const page = query.page;
    const limit = query.limit;
    const offset = (page - 1) * limit;

    const result = await pool.query<MachineAdminRow>(
      `SELECT m.*, b.name AS brand_name, b.code AS brand_code,
              st.code AS standard_type_code, st.name AS standard_type_name,
              ${PRIMARY_IMAGE_URL_SQL}
       FROM machines m
       JOIN brands b ON b.id = m.brand_id
       LEFT JOIN standard_machine_types st ON st.id = m.standard_type_id
       ${where}
       ORDER BY ${sortCol} ${sortDir}, m.code ASC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, limit, offset]
    );

    return {
      items: result.rows.map(mapMachine),
      meta: buildPaginationMeta(page, limit, total),
    };
  },

  async getMachine(id: string): Promise<Machine | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<MachineAdminRow>(
      `SELECT m.*, b.name AS brand_name, b.code AS brand_code,
              st.code AS standard_type_code, st.name AS standard_type_name,
              ${PRIMARY_IMAGE_URL_SQL}
       FROM machines m
       JOIN brands b ON b.id = m.brand_id
       LEFT JOIN standard_machine_types st ON st.id = m.standard_type_id
       WHERE m.id::text = $1 OR m.code = $1`,
      [id]
    );
    return result.rows[0] ? mapMachine(result.rows[0]) : null;
  },

  async createMachine(input: AdminMachineUpsertInput): Promise<Machine> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');

    const brand = await pool.query<{ id: string }>('SELECT id FROM brands WHERE id = $1', [
      input.brandId,
    ]);
    if (!brand.rows[0]) throw new AppError(400, 'INVALID_BRAND', 'Brand not found');

    try {
      const result = await pool.query<{ id: string }>(
        `INSERT INTO machines (
           brand_id, code, name, muscle_group, machine_type, description,
           sort_order, is_active, has_seat, has_back_pad, has_foot_plate, has_handle, rom_type,
           bodyweight_load_factor, standard_type_id, model_code
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING id`,
        [
          input.brandId,
          input.code.trim().toUpperCase(),
          input.name,
          input.muscleGroup,
          input.machineType ?? 'selectorized',
          input.description ?? null,
          input.sortOrder ?? 0,
          input.isActive ?? true,
          input.hasSeat ?? true,
          input.hasBackPad ?? false,
          input.hasFootPlate ?? false,
          input.hasHandle ?? true,
          input.romType || null,
          input.machineType === 'bodyweight'
            ? (input.bodyweightLoadFactor ?? null)
            : null,
          input.standardTypeId ?? null,
          input.modelCode?.trim() || null,
        ]
      );
      const machineId = result.rows[0].id;
      const created = await this.getMachine(machineId);
      if (!created) throw new AppError(500, 'CREATE_FAILED', 'Machine create failed');
      return created;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === '23505') throw new AppError(409, 'CODE_EXISTS', 'Machine code already exists');
      throw err;
    }
  },

  async updateMachine(id: string, input: AdminMachineUpsertInput): Promise<Machine> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await this.getMachine(id);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Machine not found');

    const brand = await pool.query<{ id: string }>('SELECT id FROM brands WHERE id = $1', [
      input.brandId,
    ]);
    if (!brand.rows[0]) throw new AppError(400, 'INVALID_BRAND', 'Brand not found');

    try {
      const nextType = input.machineType ?? 'selectorized';
      const nextFactor =
        nextType === 'bodyweight'
          ? input.bodyweightLoadFactor === undefined
            ? existing.bodyweightLoadFactor ?? null
            : input.bodyweightLoadFactor
          : null;

      const nextName = mergeLocalizedName(
        existing.name as LocalizedBag,
        input.name
      );
      const nextDescription = mergeLocalizedDescription(
        existing.description as LocalizedBag | null | undefined,
        input.description
      );
      const romProvided = input.romType !== undefined;
      const romValue =
        input.romType === undefined ? null : input.romType.trim() || null;

      await pool.query(
        `UPDATE machines SET
           brand_id = $2,
           code = $3,
           name = $4,
           muscle_group = $5,
           machine_type = $6,
           description = $7,
           sort_order = $8,
           is_active = $9,
           has_seat = COALESCE($10, has_seat),
           has_back_pad = COALESCE($11, has_back_pad),
           has_foot_plate = COALESCE($12, has_foot_plate),
           has_handle = COALESCE($13, has_handle),
           rom_type = CASE WHEN $14::boolean THEN $15 ELSE rom_type END,
           bodyweight_load_factor = $16,
           standard_type_id = $17,
           model_code = $18,
           updated_at = NOW()
         WHERE id = $1`,
        [
          existing.id,
          input.brandId,
          input.code.trim().toUpperCase(),
          nextName,
          input.muscleGroup,
          nextType,
          nextDescription,
          input.sortOrder ?? 0,
          input.isActive ?? true,
          input.hasSeat ?? null,
          input.hasBackPad ?? null,
          input.hasFootPlate ?? null,
          input.hasHandle ?? null,
          romProvided,
          romValue,
          nextFactor,
          input.standardTypeId === undefined
            ? existing.standardTypeId ?? null
            : input.standardTypeId,
          input.modelCode === undefined
            ? existing.modelCode ?? null
            : input.modelCode.trim() || null,
        ]
      );

      const nextCode = input.code.trim().toUpperCase();
      if (existing.code !== nextCode) {
        await pool.query(
          `UPDATE machine_cover_images SET machine_code = $2 WHERE machine_id = $1`,
          [existing.id, nextCode]
        ).catch(() => undefined);
        await pool.query(
          `UPDATE machine_images
           SET image_url = REPLACE(image_url, $2, $3)
           WHERE machine_id = $1
             AND image_url LIKE '%/media/machine-covers/%'`,
          [existing.id, `/media/machine-covers/${existing.code}/`, `/media/machine-covers/${nextCode}/`]
        ).catch(() => undefined);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === '23505') throw new AppError(409, 'CODE_EXISTS', 'Machine code already exists');
      if (code === '23503') throw new AppError(400, 'INVALID_BRAND', 'Brand not found');
      throw err;
    }

    const updated = await this.getMachine(existing.id);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Machine not found');
    return updated;
  },

  async setMachineActive(id: string, isActive: boolean): Promise<Machine> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await this.getMachine(id);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Machine not found');
    await pool.query('UPDATE machines SET is_active = $2, updated_at = NOW() WHERE id = $1', [
      existing.id,
      isActive,
    ]);
    const updated = await this.getMachine(existing.id);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Machine not found');
    return updated;
  },

  /**
   * Remove rows that block `DELETE FROM machines` (NO ACTION / RESTRICT FKs).
   * Cascading children (settings, images, logs, favorites, …) follow the machine row.
   */
  async purgeMachineBlockingRefs(client: {
    query: (text: string, params?: unknown[]) => Promise<unknown>;
  }, machineId: string): Promise<void> {
    await client.query('DELETE FROM machine_trades WHERE machine_id = $1', [machineId]);
    await client.query('DELETE FROM recent_history WHERE machine_id = $1', [machineId]);
    await client.query('DELETE FROM machine_recommendations WHERE machine_id = $1', [machineId]);
    await client.query('DELETE FROM gym_machines WHERE machine_id = $1', [machineId]);
  },

  async deleteMachine(
    id: string,
    options: { force?: boolean } = {}
  ): Promise<{ deleted: boolean; deactivated: boolean; forcePurged: boolean }> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await this.getMachine(id);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Machine not found');

    if (options.force) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await this.purgeMachineBlockingRefs(client, existing.id);
        await client.query('DELETE FROM machines WHERE id = $1', [existing.id]);
        await client.query('COMMIT');
        return { deleted: true, deactivated: false, forcePurged: true };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // CASCADE FKs (workout_logs, favorites, …) do not raise 23503 — soft-deactivate
    // when user data references the machine so a normal delete cannot wipe history.
    const refs = await pool.query<{ logs: string; favs: string }>(
      `SELECT
         (SELECT COUNT(*)::text FROM workout_logs WHERE machine_id = $1) AS logs,
         (SELECT COUNT(*)::text FROM favorites WHERE machine_id = $1) AS favs`,
      [existing.id]
    );
    const logCount = Number(refs.rows[0]?.logs ?? 0);
    const favCount = Number(refs.rows[0]?.favs ?? 0);
    if (logCount > 0 || favCount > 0) {
      await pool.query('UPDATE machines SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [
        existing.id,
      ]);
      return { deleted: false, deactivated: true, forcePurged: false };
    }

    try {
      await pool.query('DELETE FROM machines WHERE id = $1', [existing.id]);
      return { deleted: true, deactivated: false, forcePurged: false };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === '23503') {
        await pool.query('UPDATE machines SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [
          existing.id,
        ]);
        return { deleted: false, deactivated: true, forcePurged: false };
      }
      throw err;
    }
  },

  /**
   * Update catalog tips/warnings/pro tips and mirror tips/warnings onto
   * machine_settings so recommendation responses pick up the same content.
   * MachineFit PRO tips stay on machines.pro_tips only.
   */
  async updateMachineTips(id: string, input: AdminMachineTipsUpdateInput): Promise<Machine> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await this.getMachine(id);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Machine not found');

    const tips = {
      ko: (input.tips.ko ?? []).map((s) => s.trim()).filter(Boolean),
      en: (input.tips.en ?? []).map((s) => s.trim()).filter(Boolean),
      ...(input.tips.ja ? { ja: input.tips.ja.map((s) => s.trim()).filter(Boolean) } : {}),
      ...(input.tips.zh ? { zh: input.tips.zh.map((s) => s.trim()).filter(Boolean) } : {}),
    };
    const warnings = {
      ko: (input.warnings.ko ?? []).map((s) => s.trim()).filter(Boolean),
      en: (input.warnings.en ?? []).map((s) => s.trim()).filter(Boolean),
      ...(input.warnings.ja
        ? { ja: input.warnings.ja.map((s) => s.trim()).filter(Boolean) }
        : {}),
      ...(input.warnings.zh
        ? { zh: input.warnings.zh.map((s) => s.trim()).filter(Boolean) }
        : {}),
    };
    const proTips = {
      ko: (input.proTips.ko ?? []).map((s) => s.trim()).filter(Boolean),
      en: (input.proTips.en ?? []).map((s) => s.trim()).filter(Boolean),
      ...(input.proTips.ja
        ? { ja: input.proTips.ja.map((s) => s.trim()).filter(Boolean) }
        : {}),
      ...(input.proTips.zh
        ? { zh: input.proTips.zh.map((s) => s.trim()).filter(Boolean) }
        : {}),
    };

    await pool.query(
      `UPDATE machines
       SET tips = $2::jsonb, warnings = $3::jsonb, pro_tips = $4::jsonb, updated_at = NOW()
       WHERE id = $1`,
      [existing.id, JSON.stringify(tips), JSON.stringify(warnings), JSON.stringify(proTips)]
    );

    await pool.query(
      `UPDATE machine_settings
       SET tips = $2::jsonb, warnings = $3::jsonb
       WHERE machine_id = $1`,
      [existing.id, JSON.stringify(tips), JSON.stringify(warnings)]
    );

    const updated = await this.getMachine(existing.id);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Machine not found');
    return updated;
  },

  async updateBrandImageFields(
    id: string,
    fields: { logoUrl?: string | null; imageUrl?: string | null }
  ): Promise<Brand> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const existing = await this.getBrand(id);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Brand not found');
    if (fields.logoUrl !== undefined) {
      await pool.query('UPDATE brands SET logo_url = $2, updated_at = NOW() WHERE id = $1', [
        existing.id,
        fields.logoUrl,
      ]);
    }
    if (fields.imageUrl !== undefined) {
      await pool.query('UPDATE brands SET image_url = $2, updated_at = NOW() WHERE id = $1', [
        existing.id,
        fields.imageUrl,
      ]);
    }
    const updated = await this.getBrand(existing.id);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Brand not found');
    return updated;
  },
};
