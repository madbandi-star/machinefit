import type { GymDirectoryEntry, GymDirectorySearchQuery } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { buildPaginationMeta } from '../utils/pagination.util.js';

const MOCK_DIRECTORY: GymDirectoryEntry[] = [
  {
    id: '00000000-0000-4000-8000-00000000d001',
    name: '머신핏GYM 강남점',
    stateName: '서울특별시',
    cityName: '강남구',
    districtName: '역삼동',
    locationLabel: '서울특별시 강남구 역삼동',
  },
  {
    id: '00000000-0000-4000-8000-00000000d002',
    name: 'FitZone Gangnam',
    stateName: '서울특별시',
    cityName: '강남구',
    locationLabel: '서울특별시 강남구',
  },
  {
    id: '00000000-0000-4000-8000-00000000d003',
    name: 'Iron Temple Seoul',
    stateName: '서울특별시',
    cityName: '마포구',
    locationLabel: '서울특별시 마포구',
  },
];

function locationLabel(parts: Array<string | null | undefined>): string | undefined {
  const label = parts.filter(Boolean).join(' ').trim();
  return label || undefined;
}

export const gymDirectoryRepository = {
  async search(query: GymDirectorySearchQuery) {
    const pool = getPool();
    const page = query.page;
    const limit = query.limit;
    const q = query.q.trim();

    if (!pool) {
      const lowered = q.toLowerCase();
      const items = MOCK_DIRECTORY.filter((g) => g.name.toLowerCase().includes(lowered));
      const total = items.length;
      const start = (page - 1) * limit;
      return {
        items: items.slice(start, start + limit),
        meta: buildPaginationMeta(page, limit, total),
      };
    }

    const params: unknown[] = [`%${q}%`, query.districtId ?? null, query.cityId ?? null, query.stateId ?? null];
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM gym_directory d
       WHERE d.is_active = TRUE
         AND d.name ILIKE $1`,
      [params[0]]
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const result = await pool.query<{
      id: string;
      name: string;
      address: string | null;
      state_id: string | null;
      city_id: string | null;
      district_id: string | null;
      state_name: string | null;
      city_name: string | null;
      district_name: string | null;
      latitude: string | null;
      longitude: string | null;
      state_label: string | null;
      city_label: string | null;
      district_label: string | null;
    }>(
      `SELECT d.id, d.name, d.address, d.state_id, d.city_id, d.district_id,
              d.state_name, d.city_name, d.district_name, d.latitude, d.longitude,
              s.name->>'ko' AS state_label,
              c.name->>'ko' AS city_label,
              x.name->>'ko' AS district_label
       FROM gym_directory d
       LEFT JOIN location_states s ON s.id = d.state_id
       LEFT JOIN location_cities c ON c.id = d.city_id
       LEFT JOIN location_districts x ON x.id = d.district_id
       WHERE d.is_active = TRUE
         AND d.name ILIKE $1
       ORDER BY
         CASE
           WHEN $2::uuid IS NOT NULL AND d.district_id = $2::uuid THEN 0
           WHEN $3::uuid IS NOT NULL AND d.city_id = $3::uuid THEN 1
           WHEN $4::uuid IS NOT NULL AND d.state_id = $4::uuid THEN 2
           ELSE 3
         END,
         CASE WHEN d.name ILIKE replace($1, '%', '') || '%' THEN 0 ELSE 1 END,
         d.name ASC
       LIMIT $5 OFFSET $6`,
      [params[0], params[1], params[2], params[3], limit, (page - 1) * limit]
    );

    const items: GymDirectoryEntry[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address ?? undefined,
      stateId: row.state_id ?? undefined,
      cityId: row.city_id ?? undefined,
      districtId: row.district_id ?? undefined,
      stateName: row.state_label ?? row.state_name ?? undefined,
      cityName: row.city_label ?? row.city_name ?? undefined,
      districtName: row.district_label ?? row.district_name ?? undefined,
      latitude: row.latitude != null ? parseFloat(row.latitude) : undefined,
      longitude: row.longitude != null ? parseFloat(row.longitude) : undefined,
      locationLabel: locationLabel([
        row.state_label ?? row.state_name,
        row.city_label ?? row.city_name,
        row.district_label ?? row.district_name,
      ]),
    }));

    return { items, meta: buildPaginationMeta(page, limit, total) };
  },
};
