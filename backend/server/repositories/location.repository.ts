import type {
  LocationCity,
  LocationCountry,
  LocationDistrict,
  LocationRef,
  LocationState,
  LocationVisibility,
  ReverseGeocodeResult,
  UserLocation,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';

type NameJson = Record<string, string>;

const COUNTRIES_TTL_MS = 30 * 60_000;
let countriesCache: { expiresAt: number; value: LocationCountry[] } | null = null;

function pickName(name: NameJson | string, locale: string): string {
  if (typeof name === 'string') return name;
  if (locale.startsWith('ko')) return name.ko || name.en || Object.values(name)[0] || '';
  return name.en || name.ko || Object.values(name)[0] || '';
}

function mapCountry(row: {
  code: string;
  name: NameJson;
  flag_emoji: string | null;
  default_timezone: string;
  sort_order: number;
}): LocationCountry {
  return {
    code: row.code,
    name: row.name,
    flagEmoji: row.flag_emoji ?? undefined,
    defaultTimezone: row.default_timezone,
    sortOrder: row.sort_order,
  };
}

export const locationRepository = {
  async listCountries(): Promise<LocationCountry[]> {
    if (countriesCache && countriesCache.expiresAt > Date.now()) {
      return countriesCache.value;
    }
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query<{
      code: string;
      name: NameJson;
      flag_emoji: string | null;
      default_timezone: string;
      sort_order: number;
    }>(
      `SELECT code, name, flag_emoji, default_timezone, sort_order
       FROM countries
       WHERE is_active = TRUE
       ORDER BY sort_order ASC, code ASC`
    );
    const value = result.rows.map(mapCountry);
    countriesCache = { expiresAt: Date.now() + COUNTRIES_TTL_MS, value };
    return value;
  },

  async listStates(countryCode: string): Promise<LocationState[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query<{
      id: string;
      country_code: string;
      code: string;
      name: NameJson;
      latitude: string | null;
      longitude: string | null;
      sort_order: number;
    }>(
      `SELECT id, country_code, code, name, latitude::text, longitude::text, sort_order
       FROM location_states
       WHERE country_code = $1 AND is_active = TRUE
       ORDER BY sort_order ASC, code ASC`,
      [countryCode.toUpperCase()]
    );
    return result.rows.map((r) => ({
      id: r.id,
      countryCode: r.country_code,
      code: r.code,
      name: r.name,
      latitude: r.latitude ? parseFloat(r.latitude) : null,
      longitude: r.longitude ? parseFloat(r.longitude) : null,
      sortOrder: r.sort_order,
    }));
  },

  async listStatesForCountries(countryCodes: string[]): Promise<LocationState[]> {
    const pool = getPool();
    if (!pool || countryCodes.length === 0) return [];
    const codes = countryCodes.map((c) => c.toUpperCase());
    const result = await pool.query<{
      id: string;
      country_code: string;
      code: string;
      name: NameJson;
      latitude: string | null;
      longitude: string | null;
      sort_order: number;
    }>(
      `SELECT id, country_code, code, name, latitude::text, longitude::text, sort_order
       FROM location_states
       WHERE country_code = ANY($1::text[]) AND is_active = TRUE
       ORDER BY country_code ASC, sort_order ASC, code ASC`,
      [codes]
    );
    return result.rows.map((r) => ({
      id: r.id,
      countryCode: r.country_code,
      code: r.code,
      name: r.name,
      latitude: r.latitude ? parseFloat(r.latitude) : null,
      longitude: r.longitude ? parseFloat(r.longitude) : null,
      sortOrder: r.sort_order,
    }));
  },

  async listCitiesForStateIds(stateIds: string[]): Promise<LocationCity[]> {
    const pool = getPool();
    if (!pool || stateIds.length === 0) return [];
    const result = await pool.query<{
      id: string;
      state_id: string;
      code: string;
      name: NameJson;
      latitude: string | null;
      longitude: string | null;
      sort_order: number;
      country_code: string;
    }>(
      `SELECT c.id, c.state_id, c.code, c.name, c.latitude::text, c.longitude::text, c.sort_order,
              s.country_code
       FROM location_cities c
       JOIN location_states s ON s.id = c.state_id
       WHERE c.state_id = ANY($1::uuid[]) AND c.is_active = TRUE
       ORDER BY c.state_id ASC, c.sort_order ASC, c.code ASC`,
      [stateIds]
    );
    return result.rows.map((r) => ({
      id: r.id,
      stateId: r.state_id,
      countryCode: r.country_code,
      code: r.code,
      name: r.name,
      latitude: r.latitude ? parseFloat(r.latitude) : null,
      longitude: r.longitude ? parseFloat(r.longitude) : null,
      sortOrder: r.sort_order,
    }));
  },

  async listCities(stateId: string): Promise<LocationCity[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query<{
      id: string;
      state_id: string;
      code: string;
      name: NameJson;
      latitude: string | null;
      longitude: string | null;
      sort_order: number;
      country_code: string;
    }>(
      `SELECT c.id, c.state_id, c.code, c.name, c.latitude::text, c.longitude::text, c.sort_order,
              s.country_code
       FROM location_cities c
       JOIN location_states s ON s.id = c.state_id
       WHERE c.state_id = $1 AND c.is_active = TRUE
       ORDER BY c.name->>'ko' ASC NULLS LAST, c.sort_order ASC, c.code ASC`,
      [stateId]
    );
    return result.rows.map((r) => ({
      id: r.id,
      stateId: r.state_id,
      countryCode: r.country_code,
      code: r.code,
      name: r.name,
      latitude: r.latitude ? parseFloat(r.latitude) : null,
      longitude: r.longitude ? parseFloat(r.longitude) : null,
      sortOrder: r.sort_order,
    }));
  },

  async listDistricts(cityId: string): Promise<LocationDistrict[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query<{
      id: string;
      city_id: string;
      code: string;
      name: NameJson;
      latitude: string | null;
      longitude: string | null;
      sort_order: number;
    }>(
      `SELECT id, city_id, code, name, latitude::text, longitude::text, sort_order
       FROM location_districts
       WHERE city_id = $1 AND is_active = TRUE
       ORDER BY name->>'ko' ASC NULLS LAST, sort_order ASC, code ASC`,
      [cityId]
    );
    return result.rows.map((r) => ({
      id: r.id,
      cityId: r.city_id,
      code: r.code,
      name: r.name,
      latitude: r.latitude ? parseFloat(r.latitude) : null,
      longitude: r.longitude ? parseFloat(r.longitude) : null,
      sortOrder: r.sort_order,
    }));
  },

  async resolveLabel(
    refs: {
      countryCode?: string | null;
      stateId?: string | null;
      cityId?: string | null;
      districtId?: string | null;
      districtName?: string | null;
    },
    locale = 'ko'
  ): Promise<LocationRef['label']> {
    const pool = getPool();
    if (!pool || !refs.countryCode) return undefined;

    const country = await pool.query<{ name: NameJson; flag_emoji: string | null }>(
      `SELECT name, flag_emoji FROM countries WHERE code = $1`,
      [refs.countryCode.toUpperCase()]
    );
    const c = country.rows[0];
    if (!c) return undefined;

    let stateName: string | undefined;
    let cityName: string | undefined;
    let districtName: string | undefined;

    if (refs.stateId) {
      const st = await pool.query<{ name: NameJson }>(
        `SELECT name FROM location_states WHERE id = $1`,
        [refs.stateId]
      );
      if (st.rows[0]) {
        stateName = pickName(st.rows[0].name, locale);
      }
    }
    if (refs.cityId) {
      const ci = await pool.query<{ name: NameJson }>(
        `SELECT name FROM location_cities WHERE id = $1`,
        [refs.cityId]
      );
      if (ci.rows[0]) {
        cityName = pickName(ci.rows[0].name, locale);
      }
    }
    if (refs.districtId) {
      const di = await pool.query<{ name: NameJson }>(
        `SELECT name FROM location_districts WHERE id = $1`,
        [refs.districtId]
      );
      if (di.rows[0]) districtName = pickName(di.rows[0].name, locale);
    }
    if (!districtName && refs.districtName?.trim()) {
      districtName = refs.districtName.trim();
    }

    const countryName = pickName(c.name, locale);
    const parts = [countryName, stateName, cityName, districtName].filter(Boolean);
    return {
      country: countryName,
      state: stateName,
      city: cityName,
      district: districtName,
      flagEmoji: c.flag_emoji ?? undefined,
      path: `${c.flag_emoji ? `${c.flag_emoji} ` : ''}${parts.join(' > ')}`,
    };
  },

  async getStateCodes(
    stateId?: string | null,
    cityId?: string | null
  ): Promise<{ stateCode: string | null; cityCode: string | null }> {
    const pool = getPool();
    if (!pool) return { stateCode: null, cityCode: null };
    let stateCode: string | null = null;
    let cityCode: string | null = null;
    if (stateId) {
      const r = await pool.query<{ code: string }>(`SELECT code FROM location_states WHERE id = $1`, [
        stateId,
      ]);
      stateCode = r.rows[0]?.code ?? null;
    }
    if (cityId) {
      const r = await pool.query<{ code: string }>(`SELECT code FROM location_cities WHERE id = $1`, [
        cityId,
      ]);
      cityCode = r.rows[0]?.code ?? null;
    }
    return { stateCode, cityCode };
  },

  async getUserLocation(userId: string, locale = 'ko'): Promise<UserLocation> {
    const pool = getPool();
    const empty: UserLocation = {
      countryCode: null,
      stateId: null,
      cityId: null,
      districtId: null,
      districtName: null,
      postalCode: null,
      latitude: null,
      longitude: null,
      visibility: 'gym',
      isSet: false,
    };
    if (!pool) return empty;

    const result = await pool.query<{
      country_code: string | null;
      state_id: string | null;
      city_id: string | null;
      district_id: string | null;
      district_name: string | null;
      postal_code: string | null;
      latitude: string | null;
      longitude: string | null;
      visibility: LocationVisibility;
      updated_at: Date;
    }>(`SELECT * FROM user_locations WHERE user_id = $1`, [userId]);

    const row = result.rows[0];
    if (!row || !row.country_code) return empty;

    const codes = await this.getStateCodes(row.state_id, row.city_id);
    const label = await this.resolveLabel(
      {
        countryCode: row.country_code,
        stateId: row.state_id,
        cityId: row.city_id,
        districtId: row.district_id,
        districtName: row.district_name,
      },
      locale
    );

    return {
      countryCode: row.country_code,
      stateId: row.state_id,
      cityId: row.city_id,
      districtId: row.district_id,
      districtName: row.district_name,
      stateCode: codes.stateCode,
      cityCode: codes.cityCode,
      postalCode: row.postal_code,
      latitude: row.latitude ? parseFloat(row.latitude) : null,
      longitude: row.longitude ? parseFloat(row.longitude) : null,
      visibility: row.visibility,
      isSet: true,
      label,
      updatedAt: row.updated_at.toISOString(),
    };
  },

  async upsertUserLocation(
    userId: string,
    input: {
      countryCode?: string | null;
      stateId?: string | null;
      cityId?: string | null;
      districtId?: string | null;
      districtName?: string | null;
      postalCode?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      visibility?: LocationVisibility;
    },
    locale = 'ko'
  ): Promise<UserLocation> {
    const pool = getPool();
    if (!pool) return this.getUserLocation(userId, locale);

    if (!input.countryCode) {
      await pool.query(`DELETE FROM user_locations WHERE user_id = $1`, [userId]);
      return this.getUserLocation(userId, locale);
    }

    const districtName = input.districtName?.trim() || null;

    await pool.query(
      `INSERT INTO user_locations (
         user_id, country_code, state_id, city_id, district_id, district_name, postal_code,
         latitude, longitude, visibility, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         country_code = EXCLUDED.country_code,
         state_id = EXCLUDED.state_id,
         city_id = EXCLUDED.city_id,
         district_id = EXCLUDED.district_id,
         district_name = EXCLUDED.district_name,
         postal_code = EXCLUDED.postal_code,
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         visibility = EXCLUDED.visibility,
         updated_at = NOW()`,
      [
        userId,
        input.countryCode.toUpperCase(),
        input.stateId ?? null,
        input.cityId ?? null,
        input.districtId ?? null,
        districtName,
        input.postalCode?.trim() || null,
        input.latitude ?? null,
        input.longitude ?? null,
        input.visibility ?? 'gym',
      ]
    );
    return this.getUserLocation(userId, locale);
  },

  async deleteUserLocation(userId: string): Promise<UserLocation> {
    const pool = getPool();
    if (pool) {
      await pool.query(`DELETE FROM user_locations WHERE user_id = $1`, [userId]);
    }
    return this.getUserLocation(userId);
  },

  /** Nearest district (dong) when available, else nearest city within radius. */
  async reverseGeocode(lat: number, lng: number, locale = 'ko'): Promise<ReverseGeocodeResult | null> {
    const pool = getPool();
    if (!pool) return null;

    /** Max km for dong match before falling back to city. */
    const DISTRICT_RADIUS_KM = 8;
    /** Max km for city match — avoid far-away false positives. */
    const CITY_RADIUS_KM = 80;

    const haversineKm = (latCol: string, lngCol: string) => `
              (
                6371 * acos(
                  LEAST(1.0, GREATEST(-1.0,
                    cos(radians($1)) * cos(radians(${latCol})) *
                    cos(radians(${lngCol}) - radians($2)) +
                    sin(radians($1)) * sin(radians(${latCol}))
                  ))
                )
              )::float8`;

    const districtHit = await pool.query<{
      district_id: string;
      city_id: string;
      state_id: string;
      country_code: string;
      city_code: string;
      state_code: string;
      district_code: string;
      dist: string;
    }>(
      `SELECT d.id AS district_id, c.id AS city_id, s.id AS state_id, s.country_code,
              c.code AS city_code, s.code AS state_code, d.code AS district_code,
              ${haversineKm('d.latitude', 'd.longitude')} AS dist
       FROM location_districts d
       JOIN location_cities c ON c.id = d.city_id
       JOIN location_states s ON s.id = c.state_id
       WHERE d.is_active = TRUE
         AND d.latitude IS NOT NULL
         AND d.longitude IS NOT NULL
       ORDER BY dist ASC
       LIMIT 1`,
      [lat, lng]
    );

    if (districtHit.rows[0] && parseFloat(districtHit.rows[0].dist) <= DISTRICT_RADIUS_KM) {
      const row = districtHit.rows[0];
      const label = await this.resolveLabel(
        {
          countryCode: row.country_code,
          stateId: row.state_id,
          cityId: row.city_id,
          districtId: row.district_id,
        },
        locale
      );
      return {
        countryCode: row.country_code,
        stateId: row.state_id,
        cityId: row.city_id,
        districtId: row.district_id,
        districtCode: row.district_code,
        stateCode: row.state_code,
        cityCode: row.city_code,
        latitude: lat,
        longitude: lng,
        label,
        accuracyMeters: Math.round(parseFloat(row.dist) * 1000),
      };
    }

    const result = await pool.query<{
      city_id: string;
      state_id: string;
      country_code: string;
      city_code: string;
      state_code: string;
      dist: string;
    }>(
      `SELECT c.id AS city_id, s.id AS state_id, s.country_code,
              c.code AS city_code, s.code AS state_code,
              ${haversineKm('c.latitude', 'c.longitude')} AS dist
       FROM location_cities c
       JOIN location_states s ON s.id = c.state_id
       WHERE c.is_active = TRUE
         AND c.latitude IS NOT NULL
         AND c.longitude IS NOT NULL
       ORDER BY dist ASC
       LIMIT 1`,
      [lat, lng]
    );
    const row = result.rows[0];
    if (!row || parseFloat(row.dist) > CITY_RADIUS_KM) return null;
    const label = await this.resolveLabel(
      {
        countryCode: row.country_code,
        stateId: row.state_id,
        cityId: row.city_id,
      },
      locale
    );
    return {
      countryCode: row.country_code,
      stateId: row.state_id,
      cityId: row.city_id,
      districtId: null,
      stateCode: row.state_code,
      cityCode: row.city_code,
      latitude: lat,
      longitude: lng,
      label,
      accuracyMeters: Math.round(parseFloat(row.dist) * 1000),
    };
  },

  async adminUpsertCountry(input: {
    code: string;
    name: { ko: string; en: string };
    flagEmoji?: string;
    defaultTimezone: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<LocationCountry> {
    const pool = getPool();
    if (!pool) throw new Error('DATABASE_REQUIRED');
    const result = await pool.query<{
      code: string;
      name: NameJson;
      flag_emoji: string | null;
      default_timezone: string;
      sort_order: number;
    }>(
      `INSERT INTO countries (code, name, default_timezone, flag_emoji, is_active, sort_order)
       VALUES ($1, $2::jsonb, $3, $4, $5, $6)
       ON CONFLICT (code) DO UPDATE SET
         name = EXCLUDED.name,
         default_timezone = EXCLUDED.default_timezone,
         flag_emoji = EXCLUDED.flag_emoji,
         is_active = EXCLUDED.is_active,
         sort_order = EXCLUDED.sort_order
       RETURNING code, name, flag_emoji, default_timezone, sort_order`,
      [
        input.code.toUpperCase(),
        JSON.stringify(input.name),
        input.defaultTimezone,
        input.flagEmoji ?? null,
        input.isActive ?? true,
        input.sortOrder ?? 1000,
      ]
    );
    return mapCountry(result.rows[0]!);
  },

  async adminUpsertState(input: {
    countryCode: string;
    code: string;
    name: { ko: string; en: string };
    latitude?: number | null;
    longitude?: number | null;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<LocationState> {
    const pool = getPool();
    if (!pool) throw new Error('DATABASE_REQUIRED');
    const result = await pool.query<{
      id: string;
      country_code: string;
      code: string;
      name: NameJson;
      latitude: string | null;
      longitude: string | null;
      sort_order: number;
    }>(
      `INSERT INTO location_states (country_code, code, name, latitude, longitude, sort_order, is_active)
       VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7)
       ON CONFLICT (country_code, code) DO UPDATE SET
         name = EXCLUDED.name,
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         sort_order = EXCLUDED.sort_order,
         is_active = EXCLUDED.is_active
       RETURNING id, country_code, code, name, latitude::text, longitude::text, sort_order`,
      [
        input.countryCode.toUpperCase(),
        input.code,
        JSON.stringify(input.name),
        input.latitude ?? null,
        input.longitude ?? null,
        input.sortOrder ?? 1000,
        input.isActive ?? true,
      ]
    );
    const r = result.rows[0]!;
    return {
      id: r.id,
      countryCode: r.country_code,
      code: r.code,
      name: r.name,
      latitude: r.latitude ? parseFloat(r.latitude) : null,
      longitude: r.longitude ? parseFloat(r.longitude) : null,
      sortOrder: r.sort_order,
    };
  },

  async adminUpsertCity(input: {
    stateId: string;
    code: string;
    name: { ko: string; en: string };
    latitude?: number | null;
    longitude?: number | null;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<LocationCity> {
    const pool = getPool();
    if (!pool) throw new Error('DATABASE_REQUIRED');
    const result = await pool.query<{
      id: string;
      state_id: string;
      code: string;
      name: NameJson;
      latitude: string | null;
      longitude: string | null;
      sort_order: number;
    }>(
      `INSERT INTO location_cities (state_id, code, name, latitude, longitude, sort_order, is_active)
       VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7)
       ON CONFLICT (state_id, code) DO UPDATE SET
         name = EXCLUDED.name,
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         sort_order = EXCLUDED.sort_order,
         is_active = EXCLUDED.is_active
       RETURNING id, state_id, code, name, latitude::text, longitude::text, sort_order`,
      [
        input.stateId,
        input.code,
        JSON.stringify(input.name),
        input.latitude ?? null,
        input.longitude ?? null,
        input.sortOrder ?? 1000,
        input.isActive ?? true,
      ]
    );
    const r = result.rows[0]!;
    return {
      id: r.id,
      stateId: r.state_id,
      code: r.code,
      name: r.name,
      latitude: r.latitude ? parseFloat(r.latitude) : null,
      longitude: r.longitude ? parseFloat(r.longitude) : null,
      sortOrder: r.sort_order,
    };
  },

  async adminUpsertDistrict(input: {
    cityId: string;
    code: string;
    name: { ko: string; en: string };
    latitude?: number | null;
    longitude?: number | null;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<LocationDistrict> {
    const pool = getPool();
    if (!pool) throw new Error('DATABASE_REQUIRED');
    const result = await pool.query<{
      id: string;
      city_id: string;
      code: string;
      name: NameJson;
      latitude: string | null;
      longitude: string | null;
      sort_order: number;
    }>(
      `INSERT INTO location_districts (city_id, code, name, latitude, longitude, sort_order, is_active)
       VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7)
       ON CONFLICT (city_id, code) DO UPDATE SET
         name = EXCLUDED.name,
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         sort_order = EXCLUDED.sort_order,
         is_active = EXCLUDED.is_active
       RETURNING id, city_id, code, name, latitude::text, longitude::text, sort_order`,
      [
        input.cityId,
        input.code,
        JSON.stringify(input.name),
        input.latitude ?? null,
        input.longitude ?? null,
        input.sortOrder ?? 1000,
        input.isActive ?? true,
      ]
    );
    const r = result.rows[0]!;
    return {
      id: r.id,
      cityId: r.city_id,
      code: r.code,
      name: r.name,
      latitude: r.latitude ? parseFloat(r.latitude) : null,
      longitude: r.longitude ? parseFloat(r.longitude) : null,
      sortOrder: r.sort_order,
    };
  },
};
