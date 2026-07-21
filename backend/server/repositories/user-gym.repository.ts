import type { CreateUserGymInput, LocationRef, UpdateUserGymInput, UserGym } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { randomUUID } from 'node:crypto';
import { locationRepository } from './location.repository.js';

interface UserGymRow {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  brand_name: string | null;
  is_default: boolean;
  country_code: string | null;
  metro_code: string | null;
  district_code: string | null;
  state_id: string | null;
  city_id: string | null;
  district_id: string | null;
  postal_code: string | null;
  latitude: string | null;
  longitude: string | null;
  phone: string | null;
  website_url: string | null;
  location_set: boolean;
  created_at: string;
  updated_at: string;
}

async function mapRow(row: UserGymRow, locale = 'ko'): Promise<UserGym> {
  const locationSet = Boolean(row.location_set && row.country_code && row.state_id && row.city_id);
  let location: LocationRef | undefined;
  if (locationSet) {
    const label = await locationRepository.resolveLabel(
      {
        countryCode: row.country_code,
        stateId: row.state_id,
        cityId: row.city_id,
        districtId: row.district_id,
      },
      locale
    );
    location = {
      countryCode: row.country_code,
      stateId: row.state_id,
      cityId: row.city_id,
      districtId: row.district_id,
      stateCode: row.metro_code,
      cityCode: row.district_code,
      postalCode: row.postal_code,
      latitude: row.latitude ? parseFloat(row.latitude) : null,
      longitude: row.longitude ? parseFloat(row.longitude) : null,
      label,
    };
  }

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    address: row.address ?? undefined,
    brandName: row.brand_name ?? undefined,
    isDefault: row.is_default,
    locationSet,
    location,
    phone: row.phone ?? undefined,
    websiteUrl: row.website_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** In-memory fallback when DATABASE_URL is unset. */
const mockGyms = new Map<string, UserGym[]>();

function getMockList(userId: string): UserGym[] {
  return mockGyms.get(userId) ?? [];
}

function setMockList(userId: string, items: UserGym[]) {
  mockGyms.set(userId, items);
}

async function resolveLiveCodes(input: {
  countryCode?: string | null;
  stateId?: string | null;
  cityId?: string | null;
}): Promise<{ countryCode: string | null; metroCode: string | null; districtCode: string | null; locationSet: boolean }> {
  if (!input.countryCode || !input.stateId || !input.cityId) {
    return { countryCode: null, metroCode: null, districtCode: null, locationSet: false };
  }
  const codes = await locationRepository.getStateCodes(input.stateId, input.cityId);
  return {
    countryCode: input.countryCode.toUpperCase(),
    metroCode: codes.stateCode,
    districtCode: codes.cityCode,
    locationSet: Boolean(codes.stateCode && codes.cityCode),
  };
}

export const userGymRepository = {
  async listByUser(userId: string, locale = 'ko'): Promise<UserGym[]> {
    const pool = getPool();
    if (!pool) {
      return getMockList(userId).slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }

    const result = await pool.query<UserGymRow>(
      `SELECT * FROM user_gyms WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC`,
      [userId]
    );
    return Promise.all(result.rows.map((row) => mapRow(row, locale)));
  },

  async findByIdForUser(userId: string, gymId: string, locale = 'ko'): Promise<UserGym | null> {
    const pool = getPool();
    if (!pool) {
      return getMockList(userId).find((g) => g.id === gymId) ?? null;
    }

    const result = await pool.query<UserGymRow>(
      `SELECT * FROM user_gyms WHERE id = $1 AND user_id = $2`,
      [gymId, userId]
    );
    return result.rows[0] ? mapRow(result.rows[0], locale) : null;
  },

  async ensureDefaultGym(userId: string, preferredName?: string): Promise<UserGym> {
    const existing = await this.listByUser(userId);
    if (existing.length > 0) {
      return existing.find((g) => g.isDefault) ?? existing[0]!;
    }

    return this.create(userId, {
      name: preferredName?.trim() || '기본 헬스장',
      setActive: true,
      setDefault: true,
      requireLocation: false,
    });
  },

  async create(userId: string, input: CreateUserGymInput): Promise<UserGym> {
    const pool = getPool();
    const name = input.name.trim();
    const address = input.address?.trim() || null;
    const brandName = input.brandName?.trim() || null;
    const phone = input.phone?.trim() || null;
    const websiteUrl = input.websiteUrl?.trim() || null;
    const makeDefault = Boolean(input.setDefault) || (await this.listByUser(userId)).length === 0;
    const live = await resolveLiveCodes(input);

    if (!pool) {
      const now = new Date().toISOString();
      const list = getMockList(userId).map((g) =>
        makeDefault ? { ...g, isDefault: false } : g
      );
      const gym: UserGym = {
        id: randomUUID(),
        userId,
        name,
        address: address ?? undefined,
        brandName: brandName ?? undefined,
        phone: phone ?? undefined,
        websiteUrl: websiteUrl ?? undefined,
        isDefault: makeDefault,
        locationSet: live.locationSet,
        location: live.locationSet
          ? {
              countryCode: live.countryCode,
              stateId: input.stateId ?? null,
              cityId: input.cityId ?? null,
              districtId: input.districtId ?? null,
              stateCode: live.metroCode,
              cityCode: live.districtCode,
              postalCode: input.postalCode ?? null,
              latitude: input.latitude ?? null,
              longitude: input.longitude ?? null,
            }
          : undefined,
        createdAt: now,
        updatedAt: now,
      };
      list.push(gym);
      setMockList(userId, list);
      return gym;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (makeDefault) {
        await client.query(`UPDATE user_gyms SET is_default = FALSE WHERE user_id = $1`, [userId]);
      }
      const result = await client.query<UserGymRow>(
        `INSERT INTO user_gyms (
           user_id, name, address, brand_name, is_default,
           country_code, metro_code, district_code,
           state_id, city_id, district_id, postal_code,
           latitude, longitude, phone, website_url, location_set
         ) VALUES (
           $1,$2,$3,$4,$5,
           $6,$7,$8,
           $9,$10,$11,$12,
           $13,$14,$15,$16,$17
         )
         RETURNING *`,
        [
          userId,
          name,
          address,
          brandName,
          makeDefault,
          live.countryCode,
          live.metroCode,
          live.districtCode,
          input.stateId ?? null,
          input.cityId ?? null,
          input.districtId ?? null,
          input.postalCode?.trim() || null,
          input.latitude ?? null,
          input.longitude ?? null,
          phone,
          websiteUrl,
          live.locationSet,
        ]
      );
      const gym = await mapRow(result.rows[0]!);
      if (input.setActive !== false) {
        await client.query(`UPDATE users SET active_gym_id = $1 WHERE id = $2`, [gym.id, userId]);
      }
      await client.query('COMMIT');
      return gym;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async update(userId: string, gymId: string, input: UpdateUserGymInput): Promise<UserGym | null> {
    const current = await this.findByIdForUser(userId, gymId);
    if (!current) return null;

    const pool = getPool();
    const name = input.name?.trim() ?? current.name;
    const address =
      input.address === undefined
        ? current.address ?? null
        : input.address === null || input.address === ''
          ? null
          : input.address.trim();
    const brandName =
      input.brandName === undefined
        ? current.brandName ?? null
        : input.brandName === null || input.brandName === ''
          ? null
          : input.brandName.trim();
    const phone =
      input.phone === undefined
        ? current.phone ?? null
        : input.phone === null || input.phone === ''
          ? null
          : input.phone.trim();
    const websiteUrl =
      input.websiteUrl === undefined
        ? current.websiteUrl ?? null
        : input.websiteUrl === null || input.websiteUrl === ''
          ? null
          : input.websiteUrl.trim();
    const isDefault = input.isDefault ?? current.isDefault;

    const nextLoc = {
      countryCode:
        input.countryCode !== undefined ? input.countryCode : current.location?.countryCode,
      stateId: input.stateId !== undefined ? input.stateId : current.location?.stateId,
      cityId: input.cityId !== undefined ? input.cityId : current.location?.cityId,
      districtId: input.districtId !== undefined ? input.districtId : current.location?.districtId,
      postalCode:
        input.postalCode !== undefined ? input.postalCode : current.location?.postalCode,
      latitude: input.latitude !== undefined ? input.latitude : current.location?.latitude,
      longitude: input.longitude !== undefined ? input.longitude : current.location?.longitude,
    };
    const live = await resolveLiveCodes(nextLoc);

    if (!pool) {
      const list = getMockList(userId).map((g) => {
        if (isDefault && g.id !== gymId) return { ...g, isDefault: false };
        if (g.id !== gymId) return g;
        return {
          ...g,
          name,
          address: address ?? undefined,
          brandName: brandName ?? undefined,
          phone: phone ?? undefined,
          websiteUrl: websiteUrl ?? undefined,
          isDefault,
          locationSet: live.locationSet,
          location: live.locationSet
            ? {
                countryCode: live.countryCode,
                stateId: nextLoc.stateId ?? null,
                cityId: nextLoc.cityId ?? null,
                districtId: nextLoc.districtId ?? null,
                stateCode: live.metroCode,
                cityCode: live.districtCode,
                postalCode: nextLoc.postalCode ?? null,
                latitude: nextLoc.latitude ?? null,
                longitude: nextLoc.longitude ?? null,
              }
            : undefined,
          updatedAt: new Date().toISOString(),
        };
      });
      setMockList(userId, list);
      return list.find((g) => g.id === gymId) ?? null;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (isDefault) {
        await client.query(`UPDATE user_gyms SET is_default = FALSE WHERE user_id = $1`, [userId]);
      }
      const result = await client.query<UserGymRow>(
        `UPDATE user_gyms
         SET name = $1, address = $2, brand_name = $3, is_default = $4,
             country_code = $5, metro_code = $6, district_code = $7,
             state_id = $8, city_id = $9, district_id = $10, postal_code = $11,
             latitude = $12, longitude = $13, phone = $14, website_url = $15,
             location_set = $16
         WHERE id = $17 AND user_id = $18
         RETURNING *`,
        [
          name,
          address,
          brandName,
          isDefault,
          live.countryCode,
          live.metroCode,
          live.districtCode,
          nextLoc.stateId ?? null,
          nextLoc.cityId ?? null,
          nextLoc.districtId ?? null,
          typeof nextLoc.postalCode === 'string' ? nextLoc.postalCode.trim() || null : null,
          nextLoc.latitude ?? null,
          nextLoc.longitude ?? null,
          phone,
          websiteUrl,
          live.locationSet,
          gymId,
          userId,
        ]
      );
      await client.query('COMMIT');
      return result.rows[0] ? mapRow(result.rows[0]) : null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async remove(userId: string, gymId: string): Promise<boolean> {
    const list = await this.listByUser(userId);
    if (list.length <= 1) return false;
    const target = list.find((g) => g.id === gymId);
    if (!target) return false;

    const pool = getPool();
    if (!pool) {
      const next = list.filter((g) => g.id !== gymId);
      if (target.isDefault && next[0]) next[0] = { ...next[0], isDefault: true };
      setMockList(userId, next);
      return true;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM user_gyms WHERE id = $1 AND user_id = $2`, [gymId, userId]);
      if (target.isDefault) {
        const fallback = await client.query<{ id: string }>(
          `SELECT id FROM user_gyms WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
          [userId]
        );
        if (fallback.rows[0]) {
          await client.query(`UPDATE user_gyms SET is_default = TRUE WHERE id = $1`, [
            fallback.rows[0].id,
          ]);
          await client.query(
            `UPDATE users SET active_gym_id = $1 WHERE id = $2 AND (active_gym_id IS NULL OR active_gym_id = $3)`,
            [fallback.rows[0].id, userId, gymId]
          );
        }
      }
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async setActive(userId: string, gymId: string): Promise<UserGym | null> {
    const gym = await this.findByIdForUser(userId, gymId);
    if (!gym) return null;

    const pool = getPool();
    if (!pool) return gym;

    await pool.query(`UPDATE users SET active_gym_id = $1 WHERE id = $2`, [gymId, userId]);
    return gym;
  },

  async getActiveGymId(userId: string): Promise<string | null> {
    const pool = getPool();
    if (!pool) {
      const list = getMockList(userId);
      return list.find((g) => g.isDefault)?.id ?? list[0]?.id ?? null;
    }

    const result = await pool.query<{ active_gym_id: string | null }>(
      `SELECT active_gym_id FROM users WHERE id = $1`,
      [userId]
    );
    const active = result.rows[0]?.active_gym_id;
    if (active) {
      const owned = await this.findByIdForUser(userId, active);
      if (owned) return owned.id;
    }

    const ensured = await this.ensureDefaultGym(userId);
    await pool.query(`UPDATE users SET active_gym_id = $1 WHERE id = $2`, [ensured.id, userId]);
    return ensured.id;
  },
};
