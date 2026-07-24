import type { GymDirectoryEntry, GymDirectorySearchQuery } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { buildPaginationMeta } from '../utils/pagination.util.js';

const MOCK_DIRECTORY: GymDirectoryEntry[] = [
  {
    id: '00000000-0000-4000-8000-00000000d001',
    name: '짐박스 강남1호점',
    brand: '짐박스',
    stateName: '서울특별시',
    cityName: '강남구',
    latitude: 37.50384,
    longitude: 127.02525,
    locationLabel: '서울특별시 강남구',
  },
  {
    id: '00000000-0000-4000-8000-00000000d002',
    name: '짐박스 신림본점',
    brand: '짐박스',
    stateName: '서울특별시',
    cityName: '관악구',
    latitude: 37.4842,
    longitude: 126.9296,
    locationLabel: '서울특별시 관악구',
  },
  {
    id: '00000000-0000-4000-8000-00000000d003',
    name: '스포애니 강남역1호점',
    brand: '스포애니',
    stateName: '서울특별시',
    cityName: '강남구',
    latitude: 37.4979,
    longitude: 127.0276,
    locationLabel: '서울특별시 강남구',
  },
  {
    id: '00000000-0000-4000-8000-00000000d004',
    name: '에이블짐 신촌점',
    brand: '에이블짐',
    stateName: '서울특별시',
    cityName: '서대문구',
    latitude: 37.5598,
    longitude: 126.9425,
    locationLabel: '서울특별시 서대문구',
  },
  {
    id: '00000000-0000-4000-8000-00000000d005',
    name: '올라잇짐 망포점',
    stateName: '경기도',
    cityName: '수원시',
    locationLabel: '경기도 수원시',
  },
  {
    id: '00000000-0000-4000-8000-00000000d00c',
    name: '머신핏GYM 강남점',
    stateName: '서울특별시',
    cityName: '강남구',
    districtName: '역삼동',
    locationLabel: '서울특별시 강남구 역삼동',
  },
];

function locationLabel(parts: Array<string | null | undefined>): string | undefined {
  const label = parts.filter(Boolean).join(' ').trim();
  return label || undefined;
}

/** Haversine distance in meters (sphere R=6371000). */
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const gymDirectoryRepository = {
  async search(query: GymDirectorySearchQuery) {
    const pool = getPool();
    const page = query.page;
    const limit = query.limit;
    const q = query.q.trim();
    const brandFilter = query.brand?.trim() || null;
    const hasCoords =
      typeof query.latitude === 'number' &&
      Number.isFinite(query.latitude) &&
      typeof query.longitude === 'number' &&
      Number.isFinite(query.longitude);

    if (!pool) {
      const lowered = q.toLowerCase();
      let items = MOCK_DIRECTORY.filter((g) => {
        const hitName = g.name.toLowerCase().includes(lowered);
        const hitBrand = (g.brand ?? '').toLowerCase().includes(lowered);
        const brandOk = brandFilter ? (g.brand ?? '').includes(brandFilter) : true;
        return brandOk && (hitName || hitBrand);
      });
      if (hasCoords) {
        items = items
          .map((g) => {
            if (g.latitude == null || g.longitude == null) {
              return { ...g, distanceMeters: undefined };
            }
            return {
              ...g,
              distanceMeters: haversineMeters(
                query.latitude!,
                query.longitude!,
                g.latitude,
                g.longitude
              ),
            };
          })
          .sort((a, b) => {
            const da = a.distanceMeters ?? Number.POSITIVE_INFINITY;
            const db = b.distanceMeters ?? Number.POSITIVE_INFINITY;
            return da - db || a.name.localeCompare(b.name, 'ko');
          });
      }
      const total = items.length;
      const start = (page - 1) * limit;
      return {
        items: items.slice(start, start + limit),
        meta: buildPaginationMeta(page, limit, total),
      };
    }

    const countParams: unknown[] = [`%${q}%`];
    let countWhere =
      `d.is_active = TRUE AND (d.name ILIKE $1 OR COALESCE(d.brand, '') ILIKE $1)`;
    if (brandFilter) {
      countParams.push(`%${brandFilter}%`);
      countWhere += ` AND (d.brand ILIKE $2 OR d.name ILIKE $2)`;
    }
    const countRes = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM gym_directory d WHERE ${countWhere}`,
      countParams
    );
    const total = parseInt(countRes.rows[0]?.count ?? '0', 10);

    const params: unknown[] = [
      `%${q}%`,
      query.districtId ?? null,
      query.cityId ?? null,
      query.stateId ?? null,
    ];
    let brandClause = '';
    if (brandFilter) {
      params.push(`%${brandFilter}%`);
      brandClause = `AND (d.brand ILIKE $5 OR d.name ILIKE $5)`;
    }

    let distanceSelect = 'NULL::float8 AS distance_meters';
    let orderBy = `
         CASE
           WHEN $2::uuid IS NOT NULL AND d.district_id = $2::uuid THEN 0
           WHEN $3::uuid IS NOT NULL AND d.city_id = $3::uuid THEN 1
           WHEN $4::uuid IS NOT NULL AND d.state_id = $4::uuid THEN 2
           ELSE 3
         END,
         CASE WHEN d.name ILIKE replace($1, '%', '') || '%' THEN 0 ELSE 1 END,
         d.name ASC`;

    if (hasCoords) {
      params.push(query.latitude, query.longitude);
      const latP = brandFilter ? 6 : 5;
      const lngP = brandFilter ? 7 : 6;
      distanceSelect = `(6371000 * acos(LEAST(1.0, GREATEST(-1.0,
          cos(radians($${latP}::float8)) * cos(radians(d.latitude))
            * cos(radians(d.longitude) - radians($${lngP}::float8))
          + sin(radians($${latP}::float8)) * sin(radians(d.latitude))
        )))) AS distance_meters`;
      orderBy = `
         CASE WHEN d.latitude IS NULL OR d.longitude IS NULL THEN 1 ELSE 0 END,
         distance_meters ASC NULLS LAST,
         d.name ASC`;
    }

    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;
    params.push(limit, (page - 1) * limit);

    const result = await pool.query<{
      id: string;
      name: string;
      brand: string | null;
      address: string | null;
      state_id: string | null;
      city_id: string | null;
      district_id: string | null;
      state_name: string | null;
      city_name: string | null;
      district_name: string | null;
      latitude: string | null;
      longitude: string | null;
      distance_meters: string | null;
      state_label: string | null;
      city_label: string | null;
      district_label: string | null;
    }>(
      `SELECT d.id, d.name, d.brand, d.address, d.state_id, d.city_id, d.district_id,
              d.state_name, d.city_name, d.district_name, d.latitude, d.longitude,
              ${distanceSelect},
              s.name->>'ko' AS state_label,
              c.name->>'ko' AS city_label,
              x.name->>'ko' AS district_label
       FROM gym_directory d
       LEFT JOIN location_states s ON s.id = d.state_id
       LEFT JOIN location_cities c ON c.id = d.city_id
       LEFT JOIN location_districts x ON x.id = d.district_id
       WHERE d.is_active = TRUE
         AND (d.name ILIKE $1 OR COALESCE(d.brand, '') ILIKE $1)
         ${brandClause}
       ORDER BY ${orderBy}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );

    const items: GymDirectoryEntry[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      brand: row.brand ?? undefined,
      address: row.address ?? undefined,
      stateId: row.state_id ?? undefined,
      cityId: row.city_id ?? undefined,
      districtId: row.district_id ?? undefined,
      stateName: row.state_label ?? row.state_name ?? undefined,
      cityName: row.city_label ?? row.city_name ?? undefined,
      districtName: row.district_label ?? row.district_name ?? undefined,
      latitude: row.latitude != null ? parseFloat(row.latitude) : undefined,
      longitude: row.longitude != null ? parseFloat(row.longitude) : undefined,
      distanceMeters:
        row.distance_meters != null ? parseFloat(row.distance_meters) : undefined,
      locationLabel: locationLabel([
        row.state_label ?? row.state_name,
        row.city_label ?? row.city_name,
        row.district_label ?? row.district_name,
      ]),
    }));

    return { items, meta: buildPaginationMeta(page, limit, total) };
  },
};
