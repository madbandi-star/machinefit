import type { GymListQuery } from '@machinefit/shared';
import type { Gym, GymMachine, GymPhoto } from '@machinefit/shared';
// GymMachine registeredByRole/status used in inventory mapping
import { getPool } from '../config/database.js';
import { MOCK_GYMS } from '../data/mock.js';

interface GymRow {
  id: string;
  owner_id: string;
  slug: string | null;
  name: string;
  description: Record<string, string> | null;
  address: string;
  city: string | null;
  country_id: string;
  country_code?: string;
  latitude: string | null;
  longitude: string | null;
  phone: string | null;
  website_url: string | null;
  business_hours: Record<string, { open: string; close: string; closed?: boolean }> | null;
  amenities: Record<string, boolean> | null;
  is_verified: boolean;
  is_active: boolean;
  registration_status?: string;
  machine_count?: string;
  distance_km?: string;
}

function mapGym(row: GymRow): Gym {
  return {
    id: row.id,
    ownerId: row.owner_id,
    slug: row.slug ?? undefined,
    name: row.name,
    description: row.description ?? undefined,
    address: row.address,
    city: row.city ?? undefined,
    countryId: row.country_id,
    countryCode: row.country_code,
    latitude: row.latitude ? parseFloat(row.latitude) : undefined,
    longitude: row.longitude ? parseFloat(row.longitude) : undefined,
    phone: row.phone ?? undefined,
    websiteUrl: row.website_url ?? undefined,
    businessHours: row.business_hours ?? undefined,
    amenities: row.amenities ?? undefined,
    isVerified: row.is_verified,
    isActive: row.is_active,
    machineCount: row.machine_count ? parseInt(row.machine_count, 10) : undefined,
    distanceKm: row.distance_km ? parseFloat(row.distance_km) : undefined,
  };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function filterMockGyms(query: GymListQuery): Gym[] {
  let items = MOCK_GYMS.map(({ photos: _p, machines: _m, ...gym }) => ({
    ...gym,
    machineCount: gym.machineCount ?? _m.length,
  }));

  if (query.city) {
    const city = query.city.toLowerCase();
    items = items.filter((g) => g.city?.toLowerCase().includes(city));
  }
  if (query.q) {
    const q = query.q.toLowerCase();
    items = items.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.city?.toLowerCase().includes(q) ||
        g.address.toLowerCase().includes(q)
    );
  }
  if (query.machineCode) {
    items = items.filter((g) => {
      const mock = MOCK_GYMS.find((m) => m.id === g.id);
      return mock?.machines.some((m) => m.machineCode === query.machineCode);
    });
  }
  if (query.brandCode) {
    const prefix = query.brandCode.split('_')[0];
    items = items.filter((g) => {
      const mock = MOCK_GYMS.find((m) => m.id === g.id);
      return mock?.machines.some((m) => m.machineCode?.startsWith(prefix));
    });
  }
  if (query.lat != null && query.lng != null) {
    items = items
      .map((g) => ({
        ...g,
        distanceKm:
          g.latitude != null && g.longitude != null
            ? Math.round(haversineKm(query.lat!, query.lng!, g.latitude, g.longitude) * 10) / 10
            : undefined,
      }))
      .filter((g) => g.distanceKm == null || g.distanceKm <= query.radius);
    items.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  }

  return items;
}

export const gymRepository = {
  async findMany(query: GymListQuery): Promise<{ items: Gym[]; total: number }> {
    const pool = getPool();
    if (!pool) {
      const filtered = filterMockGyms(query);
      const total = filtered.length;
      const start = (query.page - 1) * query.limit;
      return { items: filtered.slice(start, start + query.limit), total };
    }

    const conditions = [
      'g.is_active = TRUE',
      "(g.registration_status IS NULL OR g.registration_status = 'approved')",
    ];
    const params: unknown[] = [];
    let idx = 1;

    if (query.countryId) {
      conditions.push(`g.country_id = $${idx++}`);
      params.push(query.countryId);
    }
    if (query.countryCode) {
      conditions.push(`EXISTS (
        SELECT 1 FROM countries c_filter
        WHERE c_filter.id = g.country_id AND UPPER(c_filter.code) = $${idx++}
      )`);
      params.push(query.countryCode.toUpperCase());
    }
    if (query.stateId) {
      conditions.push(`g.state_id = $${idx++}`);
      params.push(query.stateId);
    }
    if (query.cityId) {
      conditions.push(`g.city_id = $${idx++}`);
      params.push(query.cityId);
    }
    if (query.districtId) {
      conditions.push(`g.district_id = $${idx++}`);
      params.push(query.districtId);
    }
    if (query.city) {
      conditions.push(`g.city ILIKE $${idx++}`);
      params.push(`%${query.city}%`);
    }
    if (query.q) {
      conditions.push(`(g.name ILIKE $${idx} OR g.city ILIKE $${idx} OR g.address ILIKE $${idx})`);
      params.push(`%${query.q}%`);
      idx++;
    }
    if (query.machineCode) {
      conditions.push(`EXISTS (
        SELECT 1 FROM gym_machines gm
        JOIN machines m ON m.id = gm.machine_id
        WHERE gm.gym_id = g.id AND m.code = $${idx++}
          AND gm.is_available = TRUE AND gm.deleted_at IS NULL
      )`);
      params.push(query.machineCode);
    }
    if (query.brandCode) {
      conditions.push(`EXISTS (
        SELECT 1 FROM gym_machines gm
        JOIN machines m ON m.id = gm.machine_id
        JOIN brands b ON b.id = m.brand_id
        WHERE gm.gym_id = g.id AND b.code = $${idx++} AND gm.deleted_at IS NULL
      )`);
      params.push(query.brandCode);
    }

    let distanceSelect = '';
    if (query.lat != null && query.lng != null) {
      distanceSelect = `, (6371 * acos(LEAST(1, GREATEST(-1,
        cos(radians($${idx})) * cos(radians(g.latitude)) *
        cos(radians(g.longitude) - radians($${idx + 1})) +
        sin(radians($${idx})) * sin(radians(g.latitude))
      )))) AS distance_km`;
      params.push(query.lat, query.lng);
      idx += 2;
      conditions.push(`g.latitude IS NOT NULL AND g.longitude IS NOT NULL`);
      conditions.push(`(6371 * acos(LEAST(1, GREATEST(-1,
        cos(radians($${idx - 2})) * cos(radians(g.latitude)) *
        cos(radians(g.longitude) - radians($${idx - 1})) +
        sin(radians($${idx - 2})) * sin(radians(g.latitude))
      )))) <= $${idx}`);
      params.push(query.radius);
      idx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const countPromise = pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM gyms g ${where}`,
      params
    );

    const orderBy =
      query.lat != null ? 'ORDER BY distance_km ASC' : 'ORDER BY g.name ASC';

    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;
    const resultPromise = pool.query<GymRow>(
      `SELECT g.id, g.owner_id, g.slug, g.name, g.description, g.address, g.city, g.country_id,
              g.latitude, g.longitude, g.phone, g.website_url, g.business_hours, g.amenities,
              g.is_verified, g.is_active, g.registration_status,
              c.code AS country_code,
              COALESCE(mc.machine_count, '0') AS machine_count
              ${distanceSelect}
       FROM gyms g
       LEFT JOIN countries c ON c.id = g.country_id
       LEFT JOIN (
         SELECT gym_id, COUNT(*)::text AS machine_count
         FROM gym_machines
         WHERE deleted_at IS NULL
         GROUP BY gym_id
       ) mc ON mc.gym_id = g.id
       ${where}
       ${orderBy}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      [...params, query.limit, (query.page - 1) * query.limit]
    );

    const [countResult, result] = await Promise.all([countPromise, resultPromise]);
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    return { items: result.rows.map(mapGym), total };
  },

  async findByIdOrSlug(idOrSlug: string): Promise<Gym | null> {
    const pool = getPool();
    if (!pool) {
      const mock = MOCK_GYMS.find((g) => g.id === idOrSlug || g.slug === idOrSlug);
      if (!mock) return null;
      const { photos: _p, machines, ...gym } = mock;
      return { ...gym, machineCount: machines.length };
    }

    const result = await pool.query<GymRow>(
      `SELECT g.id, g.owner_id, g.slug, g.name, g.description, g.address, g.city, g.country_id,
              g.latitude, g.longitude, g.phone, g.website_url, g.business_hours, g.amenities,
              g.is_verified, g.is_active, g.registration_status,
              c.code AS country_code,
              COALESCE(mc.machine_count, '0') AS machine_count
       FROM gyms g
       LEFT JOIN countries c ON c.id = g.country_id
       LEFT JOIN (
         SELECT gym_id, COUNT(*)::text AS machine_count
         FROM gym_machines
         WHERE deleted_at IS NULL
         GROUP BY gym_id
       ) mc ON mc.gym_id = g.id
       WHERE (g.id::text = $1 OR g.slug = $1)
         AND g.is_active = TRUE
         AND (g.registration_status IS NULL OR g.registration_status = 'approved')`,
      [idOrSlug]
    );
    return result.rows[0] ? mapGym(result.rows[0]) : null;
  },

  async getPhotos(gymId: string): Promise<GymPhoto[]> {
    const pool = getPool();
    if (!pool) {
      const mock = MOCK_GYMS.find((g) => g.id === gymId || g.slug === gymId);
      return mock?.photos ?? [];
    }

    const gym = await this.findByIdOrSlug(gymId);
    if (!gym) return [];

    const result = await pool.query<{
      id: string;
      gym_id: string;
      photo_url: string;
      sort_order: number;
    }>(
      'SELECT id, gym_id, photo_url, sort_order FROM gym_photos WHERE gym_id = $1 ORDER BY sort_order ASC',
      [gym.id]
    );

    return result.rows.map((row) => ({
      id: row.id,
      gymId: row.gym_id,
      photoUrl: row.photo_url,
      sortOrder: row.sort_order,
    }));
  },

  async getMachines(gymId: string): Promise<GymMachine[]> {
    const pool = getPool();
    if (!pool) {
      const mock = MOCK_GYMS.find((g) => g.id === gymId || g.slug === gymId);
      return mock?.machines ?? [];
    }

    const gym = await this.findByIdOrSlug(gymId);
    if (!gym) return [];

    const result = await pool.query<{
      id: string;
      gym_id: string;
      machine_id: string;
      machine_code: string;
      machine_name: Record<string, string>;
      brand_code: string | null;
      brand_name: Record<string, string> | null;
      muscle_group: string;
      quantity: number;
      notes: string | null;
      is_available: boolean;
      instance_label: string | null;
      floor_zone: string | null;
      registered_by: string | null;
      registered_by_role: string | null;
      is_verified: boolean | null;
      status: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT gm.*, m.code AS machine_code, m.name AS machine_name, m.muscle_group,
              b.code AS brand_code, b.name AS brand_name
       FROM gym_machines gm
       JOIN machines m ON m.id = gm.machine_id
       LEFT JOIN brands b ON b.id = m.brand_id
       WHERE gm.gym_id = $1 AND gm.deleted_at IS NULL
       ORDER BY COALESCE(gm.is_verified, FALSE) DESC, m.code ASC`,
      [gym.id]
    );

    return result.rows.map((row) => ({
      id: row.id,
      gymId: row.gym_id,
      machineId: row.machine_id,
      machineCode: row.machine_code,
      machineName: row.machine_name?.ko ?? row.machine_name?.en ?? row.machine_code,
      brandCode: row.brand_code ?? undefined,
      brandName: row.brand_name?.ko ?? row.brand_name?.en ?? undefined,
      muscleGroup: row.muscle_group,
      quantity: row.quantity,
      notes: row.notes ?? undefined,
      isAvailable: row.is_available,
      instanceLabel: row.instance_label ?? undefined,
      floorZone: row.floor_zone ?? undefined,
      registeredBy: row.registered_by ?? undefined,
      registeredByRole: (row.registered_by_role as GymMachine['registeredByRole']) ?? undefined,
      isVerified: Boolean(row.is_verified),
      status: (row.status as GymMachine['status']) ?? 'active',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },
};
