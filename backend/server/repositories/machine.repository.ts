import type { Brand, Machine } from '@machinefit/shared';
import { BRAND_CODES, machineMatchesMuscleGroupFilter } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { MOCK_BRANDS, MOCK_MACHINES } from '../data/mock.js';

interface MachineRow {
  id: string;
  brand_id: string;
  code: string;
  name: Record<string, string>;
  muscle_group: string;
  machine_type: string;
  description: Record<string, string> | null;
  has_seat: boolean;
  has_back_pad: boolean;
  has_foot_plate: boolean;
  has_handle: boolean;
  rom_type: string | null;
  is_active: boolean;
}

interface BrandRow {
  id: string;
  code: string;
  name: Record<string, string>;
  logo_url: string | null;
  website_url: string | null;
  country_id: string | null;
  is_active: boolean;
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
    hasSeat: row.has_seat,
    hasBackPad: row.has_back_pad,
    hasFootPlate: row.has_foot_plate,
    hasHandle: row.has_handle,
    romType: row.rom_type ?? undefined,
    isActive: row.is_active,
    primaryImageUrl: extras?.primaryImageUrl ?? undefined,
  };
}

function mapBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    logoUrl: row.logo_url ?? undefined,
    websiteUrl: row.website_url ?? undefined,
    countryId: row.country_id ?? undefined,
    isActive: row.is_active,
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

export const machineRepository = {
  async findMany(filters: {
    brandCode?: string;
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
    }
    if (filters.muscleGroup) {
      // Free-weight brand: every FW_* can target any muscle (biceps/triceps included).
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
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM machines m
       LEFT JOIN brands b ON b.id = m.brand_id ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const result = await pool.query<MachineRow & { brand_name: Record<string, string> | null }>(
      `SELECT m.*, b.name AS brand_name FROM machines m
       LEFT JOIN brands b ON b.id = m.brand_id
       ${where}
       ORDER BY m.code ASC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, filters.limit, filters.offset]
    );

    return {
      items: result.rows.map((row) =>
        mapMachine(row, { brandName: row.brand_name ?? undefined })
      ),
      total,
    };
  },

  async findByCode(code: string): Promise<Machine | null> {
    const pool = getPool();
    if (!pool) return MOCK_MACHINES.find((m) => m.code === code) ?? null;

    const result = await pool.query<MachineRow & { primary_image_url: string | null }>(
      `SELECT m.*,
              (
                SELECT mi.image_url
                FROM machine_images mi
                WHERE mi.machine_id = m.id
                ORDER BY mi.is_primary DESC, mi.sort_order ASC
                LIMIT 1
              ) AS primary_image_url
       FROM machines m
       WHERE m.code = $1 AND m.is_active = true`,
      [code]
    );
    const row = result.rows[0];
    return row ? mapMachine(row, { primaryImageUrl: row.primary_image_url }) : null;
  },

  async findByBrandCode(brandCode: string): Promise<Machine[]> {
    const pool = getPool();
    if (!pool) {
      return filterMockMachinesByBrand(brandCode).map(attachBrandName);
    }

    const result = await pool.query<MachineRow & { brand_name: Record<string, string> | null }>(
      `SELECT m.*, b.name AS brand_name FROM machines m
       JOIN brands b ON b.id = m.brand_id
       WHERE b.code = $1 AND m.is_active = true
       ORDER BY m.code ASC`,
      [brandCode]
    );
    return result.rows.map((row) => mapMachine(row, { brandName: row.brand_name ?? undefined }));
  },

  async findIdByCode(code: string): Promise<string | null> {
    const pool = getPool();
    if (!pool) return MOCK_MACHINES.find((m) => m.code === code)?.id ?? null;

    const result = await pool.query<{ id: string }>(
      'SELECT id FROM machines WHERE code = $1',
      [code]
    );
    return result.rows[0]?.id ?? null;
  },
};

export const brandRepository = {
  async findAll(): Promise<Brand[]> {
    const pool = getPool();
    if (!pool) return MOCK_BRANDS;

    const result = await pool.query<BrandRow>(
      `SELECT * FROM brands WHERE is_active = true
       ORDER BY CASE code
         WHEN 'BODYWEIGHT' THEN 1
         WHEN 'FREE_WEIGHT' THEN 2
         WHEN 'HAMMER_STRENGTH' THEN 3
         WHEN 'LIFE_FITNESS' THEN 4
         WHEN 'CYBEX' THEN 5
         WHEN 'TECHNOGYM' THEN 6
         ELSE 99
       END, code ASC`
    );
    return result.rows.map(mapBrand);
  },

  async findByCode(code: string): Promise<Brand | null> {
    const pool = getPool();
    if (!pool) return MOCK_BRANDS.find((b) => b.code === code) ?? null;

    const result = await pool.query<BrandRow>(
      'SELECT * FROM brands WHERE code = $1 AND is_active = true',
      [code]
    );
    return result.rows[0] ? mapBrand(result.rows[0]) : null;
  },
};
