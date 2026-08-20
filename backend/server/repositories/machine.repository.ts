import type { Brand, Machine } from '@machinefit/shared';
import {
  BRAND_CODES,
  machineMatchesMuscleGroupFilter,
  stripProTipSeparatorsFromLocalized,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { MOCK_BRANDS, MOCK_MACHINES } from '../data/mock.js';
import { brandAssetMediaUrl } from '../utils/public-api-base.js';
import { withCacheBust } from '../utils/cache-bust-url.js';
import { supportsMachineCoverMuscleVariants } from '../utils/machine-cover-schema.util.js';
import {
  primaryImageCoalesceSql,
  standardTypePrimaryImageSql,
} from '../utils/primary-image-sql.js';

const MACHINE_ID_TTL_MS = 30 * 60_000;
const machineIdByCodeCache = new Map<string, { expiresAt: number; id: string | null }>();

interface MachineRow {
  id: string;
  brand_id: string;
  code: string;
  name: Record<string, string>;
  muscle_group: string;
  machine_type: string;
  description: Record<string, string> | null;
  how_to: Record<string, string[]> | null;
  warnings: Record<string, string[]> | null;
  tips: Record<string, string[]> | null;
  beginner_tips: Record<string, string[]> | null;
  intermediate_tips: Record<string, string[]> | null;
  advanced_tips: Record<string, string[]> | null;
  pro_tips: Record<string, string[]> | null;
  recommended_experience: string | null;
  has_seat: boolean;
  has_back_pad: boolean;
  has_foot_plate: boolean;
  has_handle: boolean;
  rom_type: string | null;
  is_active: boolean;
  bodyweight_load_factor?: string | number | null;
}

interface BrandRow {
  id: string;
  code: string;
  name: Record<string, string>;
  description: Record<string, string> | null;
  logo_url: string | null;
  website_url: string | null;
  country_id: string | null;
  is_active: boolean;
  sort_order?: number | null;
  logo_version?: number | null;
  has_logo_data?: boolean | null;
}

function mapBrand(row: BrandRow): Brand {
  let logoUrl = row.logo_url ?? undefined;
  // Prefer durable media bytes when present so search chips never stick to stale/missing URLs.
  if (row.has_logo_data) {
    const version = Number(row.logo_version ?? 0);
    logoUrl = withCacheBust(brandAssetMediaUrl(row.code, 'logo'), version) ?? undefined;
  } else if (logoUrl?.includes('/media/brand-assets/')) {
    // URL points at media route but bytes are gone — let FE fall back to packaged SVG.
    logoUrl = undefined;
  }

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? undefined,
    logoUrl,
    websiteUrl: row.website_url ?? undefined,
    countryId: row.country_id ?? undefined,
    sortOrder: row.sort_order ?? 0,
    isActive: row.is_active,
  };
}

function mapMachine(
  row: MachineRow,
  extras?: { primaryImageUrl?: string | null; brandName?: Record<string, string> | null }
): Machine {
  return {
    id: row.id,
    brandId: row.brand_id,
    code: row.code,
    name: row.name,
    brandName: extras?.brandName ?? undefined,
    muscleGroup: row.muscle_group,
    machineType: row.machine_type,
    description: row.description ?? undefined,
    howTo: row.how_to ?? undefined,
    warnings: row.warnings ?? undefined,
    tips: row.tips ?? undefined,
    beginnerTips: row.beginner_tips ?? undefined,
    intermediateTips: row.intermediate_tips ?? undefined,
    advancedTips: row.advanced_tips ?? undefined,
    proTips: stripProTipSeparatorsFromLocalized(row.pro_tips) ?? undefined,
    recommendedExperience: row.recommended_experience ?? undefined,
    hasSeat: row.has_seat,
    hasBackPad: row.has_back_pad,
    hasFootPlate: row.has_foot_plate,
    hasHandle: row.has_handle,
    romType: row.rom_type ?? undefined,
    isActive: row.is_active,
    bodyweightLoadFactor:
      row.bodyweight_load_factor == null || row.bodyweight_load_factor === ''
        ? null
        : Number(row.bodyweight_load_factor),
    primaryImageUrl: extras?.primaryImageUrl ?? undefined,
  };
}

function attachBrandName(machine: Machine): Machine {
  const brand = MOCK_BRANDS.find((b) => b.id === machine.brandId);
  return brand ? { ...machine, brandName: brand.name } : machine;
}

function filterMockMachinesByBrand(brandCode: string): Machine[] {
  const brand = MOCK_BRANDS.find((b) => b.code === brandCode);
  if (!brand) return [];
  return MOCK_MACHINES.filter((m) => m.brandId === brand.id);
}

const PRIMARY_IMAGE_SQL = primaryImageCoalesceSql('m');

/** Prefer free-weight muscle-variant cover, then default cover / machine_images / standard type. */
function primaryImageSqlForMuscle(muscleParamIndex: number | null): string {
  if (muscleParamIndex == null) {
    return `COALESCE(
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
         img.image_url,
         ${standardTypePrimaryImageSql('m')}
       ) AS primary_image_url`;
  }
  return `COALESCE(
         (
           SELECT CASE
             WHEN c.image_url IS NULL THEN NULL
             WHEN POSITION('?' IN c.image_url) > 0
               THEN c.image_url || '&v=' || COALESCE(c.version, 0)::text
             ELSE c.image_url || '?v=' || COALESCE(c.version, 0)::text
           END
           FROM machine_cover_images c
           WHERE c.machine_id = m.id AND c.target_muscle_group = $${muscleParamIndex}
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
         img.image_url,
         ${standardTypePrimaryImageSql('m')}
       ) AS primary_image_url`;
}

export const machineRepository = {
  async findMany(filters: {
    brandCode?: string;
    brandCodes?: string[];
    muscleGroup?: string;
    machineType?: string;
    q?: string;
    limit: number;
    offset: number;
  }): Promise<{ items: Machine[]; total: number }> {
    const pool = getPool();
    if (!pool) {
      let items = [...MOCK_MACHINES];
      if (filters.brandCode) {
        items = filterMockMachinesByBrand(filters.brandCode);
      } else if (filters.brandCodes?.length) {
        const allowed = new Set(filters.brandCodes);
        items = items.filter((m) => {
          const brand = MOCK_BRANDS.find((b) => b.id === m.brandId);
          return brand ? allowed.has(brand.code) : false;
        });
      }
      if (filters.muscleGroup) {
        items = items.filter((m) =>
          machineMatchesMuscleGroupFilter(m.code, m.muscleGroup, filters.muscleGroup!)
        );
      }
      if (filters.q) {
        const q = filters.q.toLowerCase();
        items = items.filter((m) =>
          Object.values(m.name).some((n) => n?.toLowerCase().includes(q))
        );
      }
      const total = items.length;
      return {
        items: items.slice(filters.offset, filters.offset + filters.limit).map(attachBrandName),
        total,
      };
    }

    const conditions: string[] = ['m.is_active = true'];
    const params: unknown[] = [];
    let idx = 1;

    if (filters.brandCode) {
      conditions.push(`b.code = $${idx++}`);
      params.push(filters.brandCode);
    } else if (filters.brandCodes?.length) {
      conditions.push(`b.code = ANY($${idx++}::text[])`);
      params.push(filters.brandCodes);
    }
    if (filters.muscleGroup) {
      // Free-weight brand: every FW_* can target any muscle (biceps/triceps/arms/core included).
      conditions.push(
        `(m.muscle_group = $${idx} OR b.code = $${idx + 1} OR m.muscle_group = 'full_body')`
      );
      params.push(filters.muscleGroup, BRAND_CODES.FREE_WEIGHT);
      idx += 2;
    }
    if (filters.machineType) {
      conditions.push(`m.machine_type = $${idx++}`);
      params.push(filters.machineType);
    }
    if (filters.q) {
      conditions.push(`m.name::text ILIKE $${idx}`);
      params.push(`%${filters.q}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countPromise = pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM machines m
       LEFT JOIN brands b ON b.id = m.brand_id ${where}`,
      params
    );

    const muscleParamIndex = filters.muscleGroup ? params.indexOf(filters.muscleGroup) + 1 : null;
    const muscleVariantsReady = await supportsMachineCoverMuscleVariants(pool);
    const primaryImageSelect = muscleVariantsReady
      ? primaryImageSqlForMuscle(muscleParamIndex)
      : `COALESCE(img.image_url, ${standardTypePrimaryImageSql('m')}) AS primary_image_url`;

    // List projection: skip tip/how_to blobs — detail page fetches full machine.
    const listPromise = pool.query<
      MachineRow & { brand_name: Record<string, string> | null; primary_image_url: string | null }
    >(
      `SELECT
         m.id, m.brand_id, m.code, m.name, m.muscle_group, m.machine_type,
         m.description, m.recommended_experience,
         m.has_seat, m.has_back_pad, m.has_foot_plate, m.has_handle,
         m.rom_type, m.is_active, m.bodyweight_load_factor,
         NULL::jsonb AS how_to,
         NULL::jsonb AS warnings,
         NULL::jsonb AS tips,
         NULL::jsonb AS beginner_tips,
         NULL::jsonb AS intermediate_tips,
         NULL::jsonb AS advanced_tips,
         NULL::jsonb AS pro_tips,
         b.name AS brand_name,
         ${primaryImageSelect}
       FROM machines m
       LEFT JOIN brands b ON b.id = m.brand_id
       LEFT JOIN LATERAL (
         SELECT mi.image_url
         FROM machine_images mi
         WHERE mi.machine_id = m.id
         ORDER BY mi.is_primary DESC, mi.sort_order ASC
         LIMIT 1
       ) img ON TRUE
       ${where}
       ORDER BY m.code ASC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, filters.limit, filters.offset]
    );

    const [countResult, result] = await Promise.all([countPromise, listPromise]);
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    return {
      items: result.rows.map((row) =>
        mapMachine(row, {
          brandName: row.brand_name ?? undefined,
          primaryImageUrl: row.primary_image_url,
        })
      ),
      total,
    };
  },

  async findByCode(code: string, targetMuscleGroup?: string | null): Promise<Machine | null> {
    const pool = getPool();
    if (!pool) {
      const machine = MOCK_MACHINES.find((m) => m.code === code) ?? null;
      return machine ? attachBrandName(machine) : null;
    }

    const muscle = targetMuscleGroup?.trim() || null;
    const muscleVariantsReady = await supportsMachineCoverMuscleVariants(pool);
    const primaryImageSelect =
      muscleVariantsReady
        ? muscle
          ? primaryImageSqlForMuscle(2)
          : primaryImageSqlForMuscle(null)
        : `COALESCE(img.image_url, ${standardTypePrimaryImageSql('m')}) AS primary_image_url`;

    const result = await pool.query<
      MachineRow & { brand_name: Record<string, string> | null; primary_image_url: string | null }
    >(
      `SELECT m.*, b.name AS brand_name,
         ${primaryImageSelect}
       FROM machines m
       LEFT JOIN brands b ON b.id = m.brand_id
       LEFT JOIN LATERAL (
         SELECT mi.image_url
         FROM machine_images mi
         WHERE mi.machine_id = m.id
         ORDER BY mi.is_primary DESC, mi.sort_order ASC
         LIMIT 1
       ) img ON TRUE
       WHERE m.code = $1 AND m.is_active = true`,
      muscle ? [code, muscle] : [code]
    );
    const row = result.rows[0];
    return row
      ? mapMachine(row, {
          brandName: row.brand_name ?? undefined,
          primaryImageUrl: row.primary_image_url,
        })
      : null;
  },

  async findByBrandCode(brandCode: string): Promise<Machine[]> {
    const pool = getPool();
    if (!pool) {
      return filterMockMachinesByBrand(brandCode).map(attachBrandName);
    }

    const result = await pool.query<
      MachineRow & { brand_name: Record<string, string> | null; primary_image_url: string | null }
    >(
      `SELECT m.*, b.name AS brand_name, ${PRIMARY_IMAGE_SQL}
       FROM machines m
       JOIN brands b ON b.id = m.brand_id
       WHERE b.code = $1 AND m.is_active = true
       ORDER BY m.code ASC`,
      [brandCode]
    );
    return result.rows.map((row) =>
      mapMachine(row, {
        brandName: row.brand_name ?? undefined,
        primaryImageUrl: row.primary_image_url,
      })
    );
  },

  async findIdByCode(code: string): Promise<string | null> {
    const cached = machineIdByCodeCache.get(code);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.id;
    }

    const pool = getPool();
    if (!pool) {
      const id = MOCK_MACHINES.find((m) => m.code === code)?.id ?? null;
      machineIdByCodeCache.set(code, { expiresAt: Date.now() + MACHINE_ID_TTL_MS, id });
      return id;
    }

    const result = await pool.query<{ id: string }>(
      'SELECT id FROM machines WHERE code = $1',
      [code]
    );
    const id = result.rows[0]?.id ?? null;
    machineIdByCodeCache.set(code, { expiresAt: Date.now() + MACHINE_ID_TTL_MS, id });
    if (machineIdByCodeCache.size > 500) {
      const oldest = machineIdByCodeCache.keys().next().value;
      if (oldest) machineIdByCodeCache.delete(oldest);
    }
    return id;
  },

  /** Clear code→id memo after admin rename/delete (or wipe all). */
  clearIdByCodeCache(code?: string): void {
    if (code) machineIdByCodeCache.delete(code);
    else machineIdByCodeCache.clear();
  },
};

export const brandRepository = {
  async findAll(): Promise<Brand[]> {
    const pool = getPool();
    if (!pool) return MOCK_BRANDS;

    const result = await pool.query<BrandRow>(
      `SELECT b.id, b.code, b.name, b.description, b.logo_url, b.website_url, b.country_id, b.is_active,
              b.sort_order,
              ba.logo_version,
              (ba.logo_data IS NOT NULL) AS has_logo_data
       FROM brands b
       LEFT JOIN brand_assets ba ON ba.brand_id = b.id
       WHERE b.is_active = true
       ORDER BY b.sort_order ASC, b.code ASC`
    );
    return result.rows.map(mapBrand);
  },

  async findByCode(code: string): Promise<Brand | null> {
    const pool = getPool();
    if (!pool) return MOCK_BRANDS.find((b) => b.code === code) ?? null;

    const result = await pool.query<BrandRow>(
      `SELECT b.id, b.code, b.name, b.description, b.logo_url, b.website_url, b.country_id, b.is_active,
              b.sort_order,
              ba.logo_version,
              (ba.logo_data IS NOT NULL) AS has_logo_data
       FROM brands b
       LEFT JOIN brand_assets ba ON ba.brand_id = b.id
       WHERE b.code = $1 AND b.is_active = true`,
      [code]
    );
    return result.rows[0] ? mapBrand(result.rows[0]) : null;
  },
};
